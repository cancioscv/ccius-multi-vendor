import { Router } from "express";
import { isAuth } from "@e-com/libs";
import { getUserOrders } from "../controller/order.controller.js";

const router: Router = Router();

router.get("/user-orders", isAuth, getUserOrders);

export default router;
