import { Router } from "express";
import { isAdmin, isAuth, isSeller } from "@e-com/libs";
import {
  createPaymentIntent,
  createPaymentSession,
  getAdminOrders,
  getOrderDetails,
  getSellerOrders,
  getUserOrders,
  updateDeliveryStatus,
  verifyCouponCode,
  verifyPaymentSession,
} from "../controller/order.controller.js";

const router: Router = Router();

router.post("/create-payment-intent", isAuth, createPaymentIntent);
router.post("/create-payment-session", isAuth, createPaymentSession);
router.get("/verify-payment-session", isAuth, verifyPaymentSession);
router.get("/user-orders", isAuth, getUserOrders);
router.get("/seller-orders", isAuth, isSeller, getSellerOrders);
router.get("/admin-orders", isAuth, isAdmin, getAdminOrders);
router.get("/order-details/:id", isAuth, getOrderDetails);
router.put("/update-delivery-status/:orderId", isAuth, isSeller, updateDeliveryStatus);
router.put("/verify-coupon", isAuth, verifyCouponCode);

export default router;
