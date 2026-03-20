import { Router } from "express";
import { isAuth } from "@e-com/libs";

import { createKlarnaPaymentIntent, createKlarnaPaymentSession } from "../controller/payment.controller.js";

const router: Router = Router();

// ── Klarna ──
router.post("/create-klarna-payment-session", isAuth, createKlarnaPaymentSession);
router.post("/create-klarna-payment-intent", isAuth, createKlarnaPaymentIntent);

export default router;
