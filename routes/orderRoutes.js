const express = require("express");
const router = express.Router();
const {
  checkout,
  payOrder,
  getOrderHistory,
  getOrderDetails,
} = require("../controllers/orderController");
const isAuthorized = require("../middlewares/authMiddleware");
const { isUser } = require("../middlewares/roleCheckMiddleware");


router.post("/checkout", isAuthorized, isUser, checkout);
router.get("/", isAuthorized, isUser, getOrderHistory);
router.get("/:id", isAuthorized, isUser, getOrderDetails); 
router.post("/:id/pay", isAuthorized, isUser, payOrder); 

module.exports = router;
