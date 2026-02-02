import { Router } from "express";
import { isAdmin, isAuth, isSeller } from "@e-com/libs";

import {
  forgotUserPassword,
  loginUser,
  refreshToken,
  createUser,
  resetUserPassword,
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
  updateUserPassword,
  addUserAddress,
  getShippingAddresses,
  deleteUserAddress,
  logoutUser,
  getAdmin,
  logoutSeller,
} from "../controller/auth.controller.js";

const router: Router = Router();

// User
router.post("/create-user", createUser);
router.post("/verify-user", verifyUser);
router.post("/login", loginUser);
router.get("/logout-user", isAuth, logoutUser);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotUserPassword);
router.post("/reset-password", resetUserPassword);
router.post("/verify-forgot-password", verifyForgotPassword);
router.post("/change-password", isAuth, updateUserPassword);
router.get("/logged-user", isAuth, getUser);
router.get("/logged-admin", isAuth, isAdmin, getAdmin);
router.post("/add-address", isAuth, addUserAddress);
router.get("/shipping-addresses", isAuth, getShippingAddresses);
router.delete("/delete-address/:addressId", isAuth, deleteUserAddress);

// Seller and Shop
router.post("/create-seller", createSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/login-seller", loginSeller);
router.get("/logout-seller", isAuth, isSeller, logoutSeller);
router.get("/logged-seller", isAuth, isSeller, getSeller);

// Stripe
router.post("/create-stripe-link", createStripeConnectLink);

router.get("/get-layouts", getLayoutData);

// Admin

export default router;
