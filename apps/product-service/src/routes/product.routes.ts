import { Router } from "express";
import {
  createDiscountCode,
  createProduct,
  deleteDiscountCode,
  deleteProductImage,
  getCategories,
  getDiscountCodes,
  uploadProductImage,
} from "../controller/product.controller.js";
import { isAuth } from "@e-com/libs";

const router: Router = Router();

router.get("/categories", getCategories);
router.post("/create-discount-code", isAuth, createDiscountCode);
router.get("/get-discount-code", isAuth, getDiscountCodes);
router.delete("/delete-discount-code/:id", isAuth, deleteDiscountCode);

// Images
router.post("/upload-product-image", isAuth, uploadProductImage);
router.delete("/delete-product-image", isAuth, deleteProductImage);
router.post("/create-product", isAuth, createProduct);

export default router;
