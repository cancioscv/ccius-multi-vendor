import { isAdmin, isAuth } from "@e-com/libs";
import { Router } from "express";
import {
  addNewAdmin,
  getAllAdmins,
  getAllCustomizations,
  getAllEvents,
  getAllNotifications,
  getAllProducts,
  getAllSellers,
  getAllUsers,
  getUserNotifications,
} from "../controller/admin.controller.js";

const router: Router = Router();

router.get("/all-products", isAuth, isAdmin, getAllProducts);
router.get("/all-events", isAuth, isAdmin, getAllEvents);
router.get("/all-admins", isAuth, isAdmin, getAllAdmins);
router.put("/add-new-admin", isAuth, isAdmin, addNewAdmin);
router.get("/all-users", isAuth, isAdmin, getAllUsers);
router.get("/all-sellers", isAuth, isAdmin, getAllSellers);
router.get("/all-customizations", getAllCustomizations);
router.get("/all-notifications", isAuth, isAdmin, getAllNotifications);
router.get("/user-notifications", isAuth, getUserNotifications);

export default router;
