const { Router } = require("express");
const router = require("express").Router();
const { getCart  ,addCartItems, removeCartItem} = require("../controllers/cartController");
const isAuthorized = require("../middlewares/authMiddleware");
const { isUser } = require("../middlewares/roleCheckMiddleware");


router.post("/add", isAuthorized, isUser, addCartItems);
router.delete("/items/:productId", isAuthorized, isUser, removeCartItem);
router.get("/getcart",isAuthorized,isUser, getCart);
module.exports = router;
