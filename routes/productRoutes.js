const { Router } = require("express");
const router = require("express").Router();
const { createProduct,updateProduct,deleteProduct,getAllProducts} = require("../controllers/productController");
const isAuthorized = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/roleCheckMiddleware");
const {
  createValidate,
  updateValidate,
} = require("../validators/product");

router.post("/add",isAuthorized,isAdmin,createValidate, createProduct);
router.put("/updateproduct/:id",isAuthorized,isAdmin,updateValidate, updateProduct);
router.delete("/deleteproduct/:id",isAuthorized,isAdmin, deleteProduct);
router.get("/allproducts", getAllProducts);
module.exports = router;
