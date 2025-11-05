const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminController");
const isAuthorized = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/roleCheckMiddleware");


router.get("/orders",isAuthorized,isAdmin, getAllOrders);
router.patch("/orders/:id/status",isAuthorized,isAdmin, updateOrderStatus);

module.exports = router;
