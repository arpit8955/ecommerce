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
const {findAndCancelOrders} = require("./controllers/orderController")
// const communityRoutes = require("./routes/communityRoutes");
// const propertiesRoutes = require("./routes/propertiesRoutes");
// const blogRoutes = require("./routes/blogRoutes");
// const scheduleVisitRoutes = require("./routes/propertyScheduleRouter");
// const contactUSRoutes = require("./routes/contactUsRoutes");
// const postRequirmentRoutes = require("./routes/postRequirmentRoutes");

connectDB(process.env.MONGO_URI);
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Handles JSON payloads up to 50mb
app.use(express.urlencoded({ limit: "50mb", extended: true }));

//route middlewares
app.use("/api/auth", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
// app.use("/api/community", communityRoutes);
// app.use("/api/properties", propertiesRoutes);
// app.use("/api/blog", blogRoutes);
// app.use("/api/propertyvisit", scheduleVisitRoutes);
// app.use("/api/contactus", contactUSRoutes);
// app.use("/api/postrequirment", postRequirmentRoutes);
//server test route
cron.schedule("*/1 * * * *", async () => {
  await findAndCancelOrders();
});
app.get("/", (req, res) => {
  res.status(200).json({ message: "ecommerce Server is Running" });
  // response.successResponse(res,"no data","working good")
});

// const cron = require("node-cron");
process.env.TZ = "Asia/Kolkata";
//connection to database

// socket.io
const http = require("http").Server(app);
// const io = require("socket.io")(http, {
//   cors: {
//     origin: "*",
//   },
// });

//server listenng
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
