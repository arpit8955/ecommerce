const asynchandler = require("express-async-handler");
const orderDB = require("../models/orderModel");
const response = require("../middlewares/response");

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/admin/orders
 * @access  Private (Admin)
 */
const getAllOrders = asynchandler(async (req, res) => {
  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filtering (by status) [cite: 50]
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await orderDB
    .find(filter)
    .populate("userId", "name email") // [cite: 50]
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

/**
 * @desc    Update an order's status (Admin only)
 * @route   PATCH /api/admin/orders/:id/status
 * @access  Private (Admin)
 */
const updateOrderStatus = asynchandler(async (req, res) => {
  const { id: orderId } = req.params;
  const { status } = req.body; // e.g., "SHIPPED" or "DELIVERED" [cite: 51]

  const order = await orderDB.findById(orderId);

  if (!order) {
    return response.notFoundError(res, "Order not found.");
  }

  // Business logic: Admins can only update orders that are PAID
  if (order.status !== "PAID") {
    return response.badRequestError(
      res,
      `Cannot update status. Order is not PAID (current status: ${order.status}).`
    );
  }

  order.status = status;
  await order.save();

  // TODO: Dispatch an email to the user about the status update
  // await emailQueue.add("sendStatusUpdateEmail", { orderId: order._id, status });

  response.successResponse(res, order, `Order status updated to ${status}.`);
});

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
