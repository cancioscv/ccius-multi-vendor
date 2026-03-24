import express from "express";

import { Router } from "express";
import { isAuth } from "@e-com/libs";

import {
  capturePayPalPayment,
  createKlarnaPaymentIntent,
  createKlarnaPaymentSession,
  createPayPalOrderHandler,
  createPayPalPaymentSession,
  paypalWebhook,
} from "../controller/payment.controller.js";

const router: Router = Router();

// ── Klarna ──
router.post("/create-klarna-payment-session", isAuth, createKlarnaPaymentSession);
router.post("/create-klarna-payment-intent", isAuth, createKlarnaPaymentIntent);

// ── PayPal ──
router.post("/create-paypal-payment-session", isAuth, createPayPalPaymentSession);
router.post("/create-paypal-order", isAuth, createPayPalOrderHandler);
router.post("/capture-paypal-payment", isAuth, capturePayPalPayment);

router.post("/paypal/webhook", express.raw({ type: "application/json" }), paypalWebhook);

export default router;
