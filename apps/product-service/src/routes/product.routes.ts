import { Router } from "express";
import {
  createDiscountCode,
  createProduct,
  deleteDiscountCode,
  deleteProductImage,
  getShopProducts,
  getCategories,
  getDiscountCodes,
  uploadProductImage,
  deleteProduct,
  restoreProduct,
  getAllProducts,
  getProductBySlug,
  getFilteredProducts,
  getFilteredOffers,
  getFilteredShops,
  searchProducts,
  getTopShops,
  getAllOffers,
  getStripeAccount,
  slugValidator,
  getProductAnalytics,
  createReview,
  getReview,
  updateReview,
} from "../controller/product.controller.js";
import { isAuth, isSeller } from "@e-com/libs";

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
router.get("/shop-products", isAuth, getShopProducts);
router.delete("/delete-product/:productId", isAuth, deleteProduct);
router.put("/restore-product/:productId", isAuth, restoreProduct);
router.get("/get-stripe-account", isAuth, isSeller, getStripeAccount);
router.get("/all-products/", getAllProducts);
router.get("/product/:slug", getProductBySlug);
router.get("/filtered-products", getFilteredProducts);
router.get("/filtered-offers", getFilteredOffers);
router.get("/filtered-shops", getFilteredShops);
router.get("/search-products", searchProducts);
router.get("/top-shops", getTopShops);
router.get("/all-offers", getAllOffers);
router.post("/slug-validator", isAuth, isSeller, slugValidator);
router.get("/product-analytics/:productId", getProductAnalytics);

router.post("/create-review", isAuth, createReview);
router.put("/update-review", isAuth, updateReview); // Check if is productId or viewId
router.get("/review/:productId", isAuth, getReview);

export default router;
