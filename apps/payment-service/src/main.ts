import express, { NextFunction, Request, Response } from "express";

import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import paymentRouter from "./routes/payment.routes.js";
import {
  createOrder,
  //  paypalWebhook
} from "./controller/payment.controller.js";

const app = express();

// Middleware
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL, credentials: true }));
app.use(cookieParser());

// Increase JSON payload limit to 10MB
app.use(express.json({ limit: "10mb" }));
// Increase URL-encoded payload limit to 10MB and set extended to true
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/api", (req, res) => {
  res.send({ message: "Welcome to payment-service!" });
});

// For Stripe for communicating with the Server properly
app.post(
  "/api/create-order",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    (req as any).rawBody = req.body;
    next();
  },
  createOrder
);

// app.post(
//   "/paypal/webhook",
//   bodyParser.raw({ type: "application/json" }),
//   (req, res, next) => {
//     (req as any).rawBody = req.body;
//     next();
//   },
//   paypalWebhook
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", paymentRouter);

// Start
const port = process.env.PORT || 6009;
app.listen(port, () => {
  console.log(`Payment Service is running on http://localhost:${port}/api`);
  console.log(`Klarna environment: ${process.env.KLARNA_ENV || "playground"}`);
});
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});
