
// routes/chatRoutes.js
import express from "express";
import { getChatHistory, getChatUsers } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js"; // adjust path if different

const router = express.Router();

// Get chat history between logged-in user/admin and :userId
router.get("/history/:userId", protect, getChatHistory);

// Admin: get list of user threads
router.get("/users", protect, getChatUsers);

export default router;
