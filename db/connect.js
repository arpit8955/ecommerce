const mongoose = require("mongoose");

const connectDB = async (url) => {
  await mongoose
    .connect(url)
    .then((e) => {
      console.log("Connected to database successfully");
    })
    .catch((e) => {
      console.log("error in connecting to database");
      console.log(e);
    });
};

module.exports = connectDB;
