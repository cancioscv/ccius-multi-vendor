import { isAuth, isSeller } from "@e-com/libs";
import { Router } from "express";
import {
  deleteShopAndSeller,
  editSellerShop,
  followShop,
  getSellerEvents,
  getSellerInfo,
  getSellerNotifications,
  getSellerProducts,
  isFollowing,
  markNotificationAsRead,
  restoreShopAndSeller,
  unfollowShop,
  updateProfilePicture,
  uploadImage,
} from "../controller/seller.controller.js";

const router: Router = Router();

router.delete("/delete-shop-seller", isAuth, deleteShopAndSeller);
router.patch("/restore-shop-seller", isAuth, restoreShopAndSeller);
router.post("/upload-image", isAuth, uploadImage);
router.put("/update-profile-picture", isAuth, updateProfilePicture);
router.put("/edit-seller-shop", isAuth, editSellerShop);
router.get("/seller-info/:id", getSellerInfo); // TODO: isAuth must be included here.
router.get("/seller-products/:id", getSellerProducts);
router.get("/seller-events/:id", isAuth, getSellerEvents);
router.post("/follow-shop", isAuth, followShop);
router.post("/unfollow-shop", isAuth, unfollowShop); // Watch: Should not be this delete request?
router.get("/is-following/:id", isAuth, isFollowing);
router.get("/seller-notifications", isAuth, isSeller, getSellerNotifications);
router.post("/mark-notification-as-read", isAuth, markNotificationAsRead);

export default router;
