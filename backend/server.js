import "dotenv/config";
import express from "express";
import cors from "cors";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (_req, res) => {
  res.send("API working");
});

app.get("/health", (_req, res) => {
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});