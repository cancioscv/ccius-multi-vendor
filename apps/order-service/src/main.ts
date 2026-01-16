import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@e-com/libs";
import orderRouter from "./routes/order.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.get("/api", (req, res) => {
  res.send({ message: "Welcome to order-service!" });
});

// Routes
app.use("/api", orderRouter);

app.use(errorMiddleware);

const port = process.env.PORT || 6003;
const server = app.listen(port, () => {
  console.log(`Order Service running on http://localhost:${port}/api`);
});
server.on("error", console.error);
