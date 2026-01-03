import { Router } from "express";
import { getCategories } from "../controller/product.controller.js";

const router: Router = Router();

router.get("/categories", getCategories);

export default router;
