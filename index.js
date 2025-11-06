const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const connectDB = require("./db/connect");
require("dotenv").config();
const bodyParser = require("body-parser");
const response = require("./middlewares/response");
const cron = require("node-cron");

const userRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const {findAndCancelOrders} = require("./controllers/orderController")


connectDB(process.env.MONGO_URI);
app.use(cors());
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

//route middlewares
app.use("/api/auth", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);

cron.schedule("*/1 * * * *", async () => {
  await findAndCancelOrders();
});
app.get("/", (req, res) => {
  res.status(200).json({ message: "ecommerce Server is Running" });

});

process.env.TZ = "Asia/Kolkata";



const http = require("http").Server(app);

//server listenng
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
