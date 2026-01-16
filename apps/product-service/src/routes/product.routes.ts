import { Router } from "express";
import {
  createDiscountCode,
  createProduct,
  deleteDiscountCode,
  deleteProductImage,
  getSellerProducts,
  getCategories,
  getDiscountCodes,
  uploadProductImage,
  deleteProduct,
  restoreProduct,
  getAllProducts,
  getProductById,
  getFilteredProducts,
  getFilteredOffers,
  getFilteredShops,
  searchProducts,
  getTopShops,
  getAllOffers,
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

// Product
router.post("/create-product", isAuth, createProduct);
router.get("/get-seller-products", isAuth, getSellerProducts);
router.delete("/delete-product/:productId", isAuth, deleteProduct);
router.put("/restore-product/:productId", isAuth, restoreProduct);
router.get("/all-products/", getAllProducts);
router.get("/product/:slug", getProductById);
router.get("/filtered-products", getFilteredProducts);
router.get("/filtered-offers", getFilteredOffers);
router.get("/filtered-shops", getFilteredShops);
router.get("/search-products", searchProducts);
router.get("/top-shops", getTopShops);
router.get("/all-offers", getAllOffers);

export default router;
