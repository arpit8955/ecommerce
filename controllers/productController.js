const express = require("express");
const asynchandler = require("express-async-handler");
const productDB = require("../models/productModel");
const response = require("../middlewares/response");


const createProduct = asynchandler(async (req, res) => {
  const { productName, description, price,stock } = req.body;
  try {
    const newProduct = new productDB({
        productName: productName,
        description: description,
        price: price,
        stock:stock
    });
    const savedProduct = await newProduct.save();
    if (!savedProduct) {
      return response.internalServerError(res, "Failed to save the product");
    }
    response.successResponse(
      res,
      savedProduct,
      "Successfully saved the product"
    );
  } catch (error) {
    response.internalServerError(res, error.message);
  }
});


const updateProduct = asynchandler(async (req, res) => {
  const { id } = req.params;
  try {
    const {
      productName,
      description,
      price,
      stock,
    } = req.body;

    const findProduct = await productDB.findOne({
      _id: id,
    });
    if (!findProduct) {
      return response.notFoundError(res, "Cannot find the product");
    }
    const updatedData = {
      ...(productName && { productName }),
      ...(description && { description }),
      ...(price && { price }),
      ...(stock && { stock }),
    };
    const updatedProduct = await productDB.findByIdAndUpdate(
      { _id: findProduct._id },
      updatedData,
      { new: true }
    );
    if (!updatedProduct) {
      return response.internalServerError(res, "Failed to update the Product");
    }
    response.successResponse(
      res,
      updatedProduct,
      "Successfully updated the product"
    );
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
});

const deleteProduct = asynchandler(async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || id === ":id") {
      return response.validationError(
        res,
        `Cannot delete the product without id`
      );
    }
    const findProduct = await productDB.findById({
      _id: id,
    });

    if (!findProduct) {
      response.notFoundError(res, "Product not found");
    }
    const deletedProduct = await productDB.findByIdAndDelete({
      _id: findProduct._id,
    });
    if (!deletedProduct) {
      response.internalServerError(
        res,
        "An error occurred while deleting product"
      );
    }
    response.successResponse(
      res,
      deletedProduct,
      "Product deleted successfully"
    );
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
});
const getAllProducts = async (req, res) => {
    const {page=1,limitPerPage=10,sortKey,sortValue,name}=req.query
    try {
        const pageNum = parseInt(page);
        const limit = parseInt(limitPerPage);
          const filter = {
            ...(name ? { productName: { $regex: name, $options: "i" } } : {}), // case-insensitive search
          };
          const sortOptions = {
            ...(sortKey && sortValue
              ? { [sortKey]: sortValue === "asc" ? 1 : -1 }
              : {price:1,productName:1}),
        };
            const skip = (pageNum - 1) * limit;
   const products = await productDB
     .find(filter)
     .sort(sortOptions)
     .skip(skip)
            .limit(limit);
        
    if (!products) {
      return response.internalServerError(
        res,
        "Couldn't find products"
      );
        }
         const totalCount = await productDB.countDocuments(filter);
    return response.successResponse(
      res,
      {
        products,
        totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limit),
      },
      "Successfully fetched products"
    );
  } catch (error) {
    response.internalServerError(res, error.message || "Internal server error");
  }
};
module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
};