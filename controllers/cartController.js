const express = require("express");
const asynchandler = require("express-async-handler");
const productDB = require("../models/productModel");
const cartDB = require("../models/cartModel");
const response = require("../middlewares/response");


const getCart = asynchandler(async (req, res) => {
    try {
      const { userId } = req.query;
      const getCartDetails = await cartDB.findOne({ userId: userId }).populate({
        path: "items.productId",
        select: "productName",
      });
      if (!getCartDetails) {
        return response.successResponse(res, [], "Cart is empty");
      }
      response.successResponse(
        res,
        getCartDetails,
        "successfully fetched the cart data"
      );
    } catch (error) {
        response.internalServerError(res, error.message);
    }
});

const addCartItems = asynchandler(async (req, res) => { 
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;
        const product = await productDB.findById(productId);
        if (!product) {
            response.notFoundError(res,"product not found")
        }
        let cart = await cartDB.findOne({ userId });
        if (!cart) {
          cart = await cartDB.create({
            userId,
            items: [{ productId, quantity }],
          });
        } else {
          const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
          );
          if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity; // update quantity
          } else {
            cart.items.push({ productId, quantity });
          }
          await cart.save();
        }
        response.successResponse(res,cart,"Item added successfully")
    } catch (error) {
        response.internalServerError(res, error.message);
    }
});

const removeCartItem = asynchandler(async (req, res) => { 
    try {
         const { productId } = req.params;
        const userId = req.user._id;
        const cart = await cartDB.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
        cart.items = cart.items.filter(
          (item) => item.productId.toString() !== productId
        );
        await cart.save();
        response.successResponse(res, cart, "Item removed successfully");
    } catch (error) {
        response.internalServerError(res, error.message);
    }
});

module.exports = { getCart, addCartItems, removeCartItem };