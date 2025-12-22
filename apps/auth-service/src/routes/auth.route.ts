import { Router } from "express";
import { forgotPassword, login, registerUser, resetPassword, verifyUser, verifyUserForgotPassword } from "../controller/auth.controller.js";

const router: Router = Router();

router.post("/register-user", registerUser);
router.post("/verify-user", verifyUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-forgot-password", verifyUserForgotPassword);

export default router;
