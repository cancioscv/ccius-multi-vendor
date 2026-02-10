import { isAuth, isSeller } from "@e-com/libs";
import { Router } from "express";
import {
  createNewConversation,
  getSellerConversations,
  getSellerMessages,
  getUserConversations,
  getUserMessages,
} from "../controller/chat.controller.js";

const router: Router = Router();

router.post("/create-user-conversation-group", isAuth, createNewConversation);
router.get("/user-conversations", isAuth, getUserConversations);
router.get("/seller-conversations", isAuth, isSeller, getSellerConversations);
router.get("/user-messages/:conversationId", isAuth, getUserMessages);
router.get("/seller-messages/:conversationId", isAuth, isSeller, getSellerMessages);

export default router;
