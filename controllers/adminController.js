const asynchandler = require("express-async-handler");
const orderDB = require("../models/orderModel");
const response = require("../middlewares/response");


const getAllOrders = asynchandler(async (req, res) => {

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;


  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await orderDB
    .find(filter)
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalOrders = await orderDB.countDocuments(filter);

  response.successResponse(
    res,
    {
      orders,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    },
    "Successfully fetched all orders."
  );
});


const updateOrderStatus = asynchandler(async (req, res) => {
  const { id: orderId } = req.params;
  const { status } = req.body; 

  const order = await orderDB.findById(orderId);

  if (!order) {
    return response.notFoundError(res, "Order not found.");
  }

  
  if (order.status !== "PAID") {
    return response.badRequestError(
      res,
      `Cannot update status. Order is not PAID (current status: ${order.status}).`
    );
  }

  order.status = status;
  await order.save();


  response.successResponse(res, order, `Order status updated to ${status}.`);
});

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
