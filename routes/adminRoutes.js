// routes/adminRoutes.js
import express from "express";
import { protect, adminProtect } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
  getUserById,
} from "../controllers/adminControllers.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", protect, adminProtect, getAdminStats);

// User management
router.get("/users", protect, adminProtect, getAllUsers);
router.put("/users/:id/role", protect, adminProtect, updateUserRole);
router.delete("/users/:id", protect, adminProtect, deleteUser);

// Get single user by ID
router.get("/users/:id", protect, adminProtect, getUserById);

export default router;
