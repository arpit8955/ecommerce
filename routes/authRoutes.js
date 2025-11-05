const { Router } = require("express");
const router = require("express").Router();
const { createUser, loginUser } = require("../controllers/authController");
const { createValidate } = require("../validators/user");

router.post("/register", createValidate, createUser);
router.post("/login", loginUser);
module.exports = router;
