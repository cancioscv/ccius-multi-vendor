import { Router } from "express";
import { registerUser } from "../controller/auth.controller.js";

const router: Router = Router();

router.post("/register-user", registerUser);

export default router;
