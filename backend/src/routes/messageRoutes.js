import express from "express";
import auth from "../middleware/auth.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation
} from "../controllers/messageController.js";

const router = express.Router();

// Enforce authentication on all chat endpoints
router.use(auth);

// Chat routes
router.get("/conversations", getConversations);
router.get("/conversation/:conversationId", getMessages);
router.post("/send", sendMessage);
router.post("/conversation", getOrCreateConversation);

export default router;
