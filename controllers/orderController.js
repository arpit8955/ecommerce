const asynchandler = require("express-async-handler");
const mongoose = require("mongoose");
const orderDB = require("../models/orderModel");
const productDB = require("../models/productModel");
const cartDB = require("../models/cartModel");
const paymentDB = require("../models/paymentModel");
const response = require("../middlewares/response");

/**
 * @desc    Create an order from the cart (Checkout)
 * @route   POST /api/orders/checkout
 * @access  Private (User)
 */
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

    // 2. Check and RESERVE stock
    for (const item of cart.items) {
      const product = await productDB.findById(item.productId).session(session);

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      // Check available stock (using your 'stock' field)
      if (product.stock < item.quantity) {
        throw new Error(
          `Not enough available stock for ${product.productName}.`
        );
      }

      // **UPDATED LOGIC: Move stock from 'stock' to 'reservedStock'**
      product.stock -= item.quantity; // Decrement available stock
      product.reservedStock += item.quantity; // Increment reserved stock

      productUpdates.push(product.save({ session }));

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });

      totalAmount += item.quantity * product.price;
    }

    await Promise.all(productUpdates);

    // 4. Create the order
    const newOrder = new orderDB({
      userId,
      items: orderItems,
      totalAmount,
      status: "PENDING_PAYMENT",
    });
    await newOrder.save({ session });

    // 5. Clear the user's cart
    cart.items = [];
    await cart.save({ session });

    // 6. Commit the entire transaction
    await session.commitTransaction();

    // TODO: Start the 15-minute timer here
    // e.g., await orderQueue.add("cancelOrder", { orderId: newOrder._id }, { delay: 15 * 60 * 1000 });

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

/**
 * @desc    Simulate successful payment for an order
 * @route   POST /api/orders/:id/pay
 * @access  Private (User)
 */
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
    // 1. Update order status to PAID
    order.status = "PAID";
    await order.save({ session });

    // **UPDATED LOGIC: Commit the stock reservation**
    // We just clear the 'reservedStock' amount.
    const productUpdates = [];
    for (const item of order.items) {
      productUpdates.push(
        productDB
          .updateOne(
            { _id: item.productId },
            { $inc: { reservedStock: -item.quantity } } // Clear reserved stock
          )
          .session(session)
      );
    }
    await Promise.all(productUpdates);

    // 2. Create a mock payment record
    const payment = new paymentDB({
      orderId: order._id,
      transactionId: `mock_tx_${Date.now()}`,
      amount: order.totalAmount,
      status: "SUCCESS",
    });
    await payment.save({ session });

    await session.commitTransaction();

    // 3. Dispatch asynchronous job
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

/**
 * @desc    Get authenticated user's order history
 * @route   GET /api/orders
 * @access  Private (User)
 */
const getOrderHistory = asynchandler(async (req, res) => {
  const userId = req.user._id;

  // Pagination [cite: 47]
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

/**
 * @desc    Get details for a single order
 * @route   GET /api/orders/:id
 * @access  Private (User)
 */
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

/* Helper function for cancelling unpaid orders.
  This would be triggered by a cron job or a delayed queue message. [cite: 20]
*/
// const cancelOrderTransaction = async (orderId) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const order = await orderDB.findById(orderId).session(session);
//     if (!order || order.status !== "PENDING_PAYMENT") {
//       await session.abortTransaction();
//       return;
//     }

//     // 1. Mark order as CANCELLED
//     order.status = "CANCELLED";
//     await order.save({ session });

//     // 2. **UPDATED LOGIC: Release reserved stock back to the available pool**
//     const productUpdates = [];
//     for (const item of order.items) {
//       productUpdates.push(
//         productDB
//           .updateOne(
//             { _id: item.productId },
//             {
//               $inc: {
//                 stock: item.quantity, // Add back to available stock
//                 reservedStock: -item.quantity, // Remove from reserved stock
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

    // Check if order still exists and is still pending
    if (!order || order.status !== "PENDING_PAYMENT") {
      await session.abortTransaction(); // No action needed
      session.endSession();
      if (order) {
        console.log(
          `Order ${orderId} is already ${order.status}. No action taken.`
        );
      }
      return;
    }

    // 1. Mark order as CANCELLED
    order.status = "CANCELLED";
    await order.save({ session });

    // 2. Release stock back to the 'stock' (available) pool
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

  // 1. Calculate the time 15 minutes ago
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  try {
    // 2. Find all orders that are still PENDING_PAYMENT and were created
    //    more than 15 minutes ago.
    const ordersToCancel = await orderDB.find({
      status: "PENDING_PAYMENT",
      createdAt: { $lte: fifteenMinutesAgo }, // $lte = less than or equal to
    });

    if (ordersToCancel.length === 0) {
      console.log("CRON: No expired orders found.");
      return;
    }

    console.log(`CRON: Found ${ordersToCancel.length} orders to cancel.`);

    // 3. Loop through each order and cancel it using the service
    for (const order of ordersToCancel) {
      // We await each one to avoid overloading the DB
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
  // cancelOrderTransaction (export if needed, or keep private)
};
