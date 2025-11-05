const asynchandler = require("express-async-handler");
const mongoose = require("mongoose");
const orderDB = require("../models/orderModel");
const productDB = require("../models/productModel");
const cartDB = require("../models/cartModel");
const paymentDB = require("../models/paymentModel");
const response = require("../middlewares/response");

const checkout = asynchandler(async (req, res) => {
  const userId = req.user._id;
  const cart = await cartDB.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    return response.badRequestError(res, "Your cart is empty.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalAmount = 0;
    const orderItems = [];
    const productUpdates = [];

    for (const item of cart.items) {
      const product = await productDB.findById(item.productId).session(session);

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Not enough available stock for ${product.productName}.`
        );
      }


      product.stock -= item.quantity; 
      product.reservedStock += item.quantity;

      productUpdates.push(product.save({ session }));

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });

      totalAmount += item.quantity * product.price;
    }

    await Promise.all(productUpdates);

   
    const newOrder = new orderDB({
      userId,
      items: orderItems,
      totalAmount,
      status: "PENDING_PAYMENT",
    });
    await newOrder.save({ session });

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();



    response.successResponse(
      res,
      newOrder,
      "Checkout successful. Stock reserved. Please proceed to payment."
    );
  } catch (error) {
    await session.abortTransaction();
    response.internalServerError(res, `Transaction failed: ${error.message}`);
  } finally {
    session.endSession();
  }
});


const payOrder = asynchandler(async (req, res) => {
  const { id: orderId } = req.params;
  const userId = req.user._id;

  const order = await orderDB.findOne({ _id: orderId, userId });

  if (!order) {
    return response.notFoundError(res, "Order not found.");
  }
  if (order.status !== "PENDING_PAYMENT") {
    return response.badRequestError(
      res,
      `Order is not pending payment. Current status: ${order.status}`
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
 
    order.status = "PAID";
    await order.save({ session });

    const productUpdates = [];
    for (const item of order.items) {
      productUpdates.push(
        productDB
          .updateOne(
            { _id: item.productId },
            { $inc: { reservedStock: -item.quantity } } 
          )
          .session(session)
      );
    }
    await Promise.all(productUpdates);

 
    const payment = new paymentDB({
      orderId: order._id,
      transactionId: `mock_tx_${Date.now()}`,
      amount: order.totalAmount,
      status: "SUCCESS",
    });
    await payment.save({ session });

    await session.commitTransaction();


    console.log(`QUEUE: Dispatching email for order ${order._id}`);

    response.successResponse(res, order, "Payment successful. Order is PAID.");
  } catch (error) {
    await session.abortTransaction();
    response.internalServerError(
      res,
      `Payment transaction failed: ${error.message}`
    );
  } finally {
    session.endSession();
  }
});


const getOrderHistory = asynchandler(async (req, res) => {
  const userId = req.user._id;


  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await orderDB
    .find({ userId })
    .populate("items.productId", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalOrders = await orderDB.countDocuments({ userId });

  response.successResponse(
    res,
    {
      orders,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    },
    "Successfully fetched order history."
  );
});

const getOrderDetails = asynchandler(async (req, res) => {
  const { id: orderId } = req.params;
  const userId = req.user._id;

  const order = await orderDB
    .findOne({ _id: orderId, userId }) // [cite: 48]
    .populate("items.productId", "name description price");

  if (!order) {
    return response.notFoundError(res, "Order not found or access denied.");
  }

  response.successResponse(res, order, "Successfully fetched order details.");
});


// const cancelOrderTransaction = async (orderId) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const order = await orderDB.findById(orderId).session(session);
//     if (!order || order.status !== "PENDING_PAYMENT") {
//       await session.abortTransaction();
//       return;
//     }

//     
//     order.status = "CANCELLED";
//     await order.save({ session });

//     
//     const productUpdates = [];
//     for (const item of order.items) {
//       productUpdates.push(
//         productDB
//           .updateOne(
//             { _id: item.productId },
//             {
//               $inc: {
//                 stock: item.quantity, 
//                 reservedStock: -item.quantity,
//               },
//             }
//           )
//           .session(session)
//       );
//     }
//     await Promise.all(productUpdates);

//     await session.commitTransaction();
//     console.log(`Successfully cancelled order ${orderId} and restored stock.`);
//   } catch (error) {
//     await session.abortTransaction();
//     console.error(`Failed to cancel order ${orderId}:`, error.message);
//   } finally {
//     session.endSession();
//   }
// };

const cancelOrderById = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await orderDB.findById(orderId).session(session);

    if (!order || order.status !== "PENDING_PAYMENT") {
      await session.abortTransaction();
      session.endSession();
      if (order) {
        console.log(
          `Order ${orderId} is already ${order.status}. No action taken.`
        );
      }
      return;
    }

  
    order.status = "CANCELLED";
    await order.save({ session });

 
    const productUpdates = [];
    for (const item of order.items) {
      productUpdates.push(
        productDB
          .updateOne(
            { _id: item.productId },
            {
              $inc: {
                stock: item.quantity, // Add back to available
                reservedStock: -item.quantity, // Remove from reserved
              },
            }
          )
          .session(session)
      );
    }
    await Promise.all(productUpdates);

    await session.commitTransaction();
    console.log(`Successfully cancelled order ${orderId} and restored stock.`);
  } catch (error) {
    await session.abortTransaction();
    console.error(`Failed to cancel order ${orderId}:`, error.message);
  } finally {
    session.endSession();
  }
};

const findAndCancelOrders = async () => {
  console.log("CRON: Running job to find expired orders...");

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  try {
   
    const ordersToCancel = await orderDB.find({
      status: "PENDING_PAYMENT",
      createdAt: { $lte: fifteenMinutesAgo },
    });

    if (ordersToCancel.length === 0) {
      console.log("CRON: No expired orders found.");
      return;
    }

    console.log(`CRON: Found ${ordersToCancel.length} orders to cancel.`);

    
    for (const order of ordersToCancel) {
  
      await cancelOrderById(order._id);
    }
  } catch (error) {
    console.error("CRON: Error during cancellation job:", error.message);
  }
};

module.exports = {
  checkout,
  payOrder,
  getOrderHistory,
  getOrderDetails,
  findAndCancelOrders,
  
};
