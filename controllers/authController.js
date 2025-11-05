const express = require("express");
const asynchandler = require("express-async-handler");
const userDB = require("../models/userModel");
const response = require("../middlewares/response");
const bcrypt = require("bcryptjs");
const jwt = require("../utils/jwt");
const createUser = asynchandler(async (req, res) => {
  const { name, email, role, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await userDB({
    name,
    password: hashedPassword,
    email: email.toLowerCase(),
    role,
  }).save();
  console.log(newUser);
  response.successResponse(res, newUser, "Successfully created the User");
});
const loginUser = asynchandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return response.validationError(
      res,
      `Cannot login without ${!email ? "email" : !password ? "password" : ""}`
    );
  }
  const userDetails = await userDB.findOne({ email }).select("password");

  if (!userDetails) {
    return response.notFoundError(res, "Email does not exist");
  }

  const matchedPassword = await bcrypt.compare(password, userDetails.password);

  if (matchedPassword) {
    const token = jwt(userDetails._id);
    const result = { token };
    response.successResponse(res, result, ":Login was successful");
  } else {
    response.errorResponse(res, "Password incorrect", 400);
  }
});

module.exports = { createUser, loginUser };
