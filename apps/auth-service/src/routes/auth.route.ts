import { Router } from "express";
import { isAuth } from "@e-com/libs";

import {
  forgotPassword,
  login,
  refreshToken,
  registerUser,
  resetPassword,
  verifyUser,
  verifyForgotPassword,
  getUser,
  registerSeller,
  verifySeller,
  createShop,
} from "../controller/auth.controller.js";

const router: Router = Router();

// User
router.post("/register-user", registerUser);
router.post("/verify-user", verifyUser);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-forgot-password", verifyForgotPassword);

router.get("/logged-user", isAuth, getUser);

// Seller and Shop
router.post("/register-seller", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);

export default router;
