import { Router } from "express";
import { isAuth, isSeller } from "@e-com/libs";

import {
  forgotPassword,
  login,
  refreshToken,
  createUser,
  resetPassword,
  verifyUser,
  verifyForgotPassword,
  getUser,
  createSeller,
  verifySeller,
  createShop,
  createStripeConnectLink,
  loginSeller,
  getSeller,
  getLayoutData,
  changePassword,
  addUserAddress,
  getShippingAddresses,
  deleteUserAddress,
} from "../controller/auth.controller.js";

const router: Router = Router();

// User
router.post("/create-user", createUser);
router.post("/verify-user", verifyUser);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-forgot-password", verifyForgotPassword);
router.post("/change-password", isAuth, changePassword);
router.get("/logged-user", isAuth, getUser);
router.post("/add-address", isAuth, addUserAddress);
router.get("/shipping-addresses", isAuth, getShippingAddresses);
router.delete("/delete-address/:addressId", isAuth, deleteUserAddress);

// Seller and Shop
router.post("/create-seller", createSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/login-seller", loginSeller);

router.get("/logged-seller", isAuth, isSeller, getSeller);

// Stripe
router.post("/create-stripe-link", createStripeConnectLink);

router.get("/get-layouts", getLayoutData);

export default router;
