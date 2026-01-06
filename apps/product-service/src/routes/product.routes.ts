import { Router } from "express";
import { createDiscountCode, deleteDiscountCode, getCategories, getDiscountCodes } from "../controller/product.controller.js";
import { isAuth } from "@e-com/libs";

const router: Router = Router();

router.get("/categories", getCategories);
router.post("/create-discount-code", isAuth, createDiscountCode);
router.get("/get-discount-code", isAuth, getDiscountCodes);
router.delete("/delete-discount-code/:id", isAuth, deleteDiscountCode);

export default router;
