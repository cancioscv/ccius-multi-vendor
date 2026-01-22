import { isAuth, isSeller } from "@e-com/libs";
import { Router } from "express";
import {
  deleteShop,
  editShop,
  followShop,
  getSellerEvents,
  getSellerInfo,
  getSellerNotifications,
  getSellerProducts,
  isFollowing,
  markNotificationAsRead,
  restoreShop,
  unfollowShop,
  updateProfilePicture,
  uploadImage,
} from "../controller/seller.controller.js";

const router: Router = Router();

router.delete("/delete-shop", isAuth, deleteShop);
router.patch("/restore-shop", isAuth, restoreShop);
router.post("/upload-image", isAuth, uploadImage);
router.put("/update-profile-picture", isAuth, updateProfilePicture);
router.put("/edit-shop", isAuth, editShop);
router.get("/seller-info/:id", isAuth, getSellerInfo);
router.get("/seller-products/:id", isAuth, getSellerProducts);
router.get("/seller-events/:id", isAuth, getSellerEvents);
router.post("/follow-shop", isAuth, followShop);
router.post("/unfollow-shop", isAuth, unfollowShop); // Watch: Should not bee this delete request?
router.get("/is-following/:id", isAuth, isFollowing);
router.get("/seller-notifications", isAuth, isSeller, getSellerNotifications);
router.put("mark-notification-as-read", isAuth, markNotificationAsRead);

export default router;
