// routes/userRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  uploadProfilePic,
  deleteProfilePic,
} from "../controllers/userControllers.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import { getUserMessages } from "../controllers/userControllers.js";

const router = express.Router();

// Auth
router.post("/signup", registerUser);
router.post("/login", loginUser);

// Email Verification (backend only)
router.get("/verify/:token", verifyEmail);

// Forgot / Reset Password
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


router.get("/:id", protect, getUserMessages);



router.get("/", (req, res) => {
  return res.status(400).json({
    message: "User ID required in URL. Example: /api/users/USERID"
  });
});


// Profile picture
router.put("/upload", protect, upload.single("profilePic"), uploadProfilePic);
router.delete("/upload", protect, deleteProfilePic);

export default router;
