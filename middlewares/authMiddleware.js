const jwt = require("jsonwebtoken");
const userDB = require("../models/userModel");
const response = require("../middlewares/response");
require("dotenv").config();

const isAuthorized = async (req, res, next) => {
  const token = req.headers.Authorization || req.headers.authorization;
  let decoded;
  if (!token) {
    return response.validationError(res, "Unauthorized");
  }
  try {
    decoded = jwt.verify(token, process.env.JWTSECRET);
    console.log(decoded);

    const user = await userDB.findOne({
      _id: decoded.id,
      // activeToken: token,
    }).select("-password");
    console.log(user,"user")
    if (!user) {
      return res
        .status(404)
        .send({ error: "User not found with the provided ID." });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.log("error", err);
    if (err.name === "JsonWebTokenError" && err.message === "jwt malformed") {
      return response.tokenValidation(
        res,
        "The token is malformed. Please logout and then log in again."
      );
    } else if (err.name === "TokenExpiredError") {
      return response.tokenValidation(
        res,
        "Login token has expired Please logout and then log in again"
      );
    } else {
      return response.internalServerError(
        res,
        err.message || "Internal server error"
      );
    }
  }
};
module.exports = isAuthorized;
