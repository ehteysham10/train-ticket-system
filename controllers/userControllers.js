
// controllers/userControllers.js
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import validatePassword from "../utils/passwordValidator.js";
import sendEmail from "../utils/sendEmail.js";

// JWT Generator
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ------------------------------------------------------
// NEW: Fetch User Messages (for Admin Chat)
// ------------------------------------------------------
export const getUserMessages = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId).select("messages name email");

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.json({
    userId,
    name: user.name,
    messages: user.messages || [],
  });
});

// ------------------------------------------------------
// Register User + Send Verification Email
// ------------------------------------------------------
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required." });

  if (!validatePassword(password))
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    });

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser)
    return res.status(400).json({ message: "User already exists." });

  // Create token (short random string)
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    isVerified: false,
    verifyToken,
    verifyTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  const verifyUrl = `${process.env.BACKEND_URL.replace(
    /\/$/,
    ""
  )}/api/users/verify/${verifyToken}`;

  const html = `
    <h2>Verify your email</h2>
    <p>Hello ${user.name},</p>
    <p>Thanks for registering. Click the button below to verify your email address. This link expires in 15 minutes.</p>
    <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#007bff;color:#fff;border-radius:6px;text-decoration:none">Verify Email</a></p>
    <p>If the button doesn't work, copy & paste this URL into your browser:</p>
    <pre>${verifyUrl}</pre>
    <p>— Railway App</p>
  `;

  try {
    await sendEmail(user.email, "Verify your email", html);
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    console.error("Email send failed, user removed:", err.message);
    return res
      .status(500)
      .json({ message: "Registration failed: unable to send verification email." });
  }

  res.status(201).json({
    message: "Registration successful. Please check your email to verify.",
  });
});

// ------------------------------------------------------
// Verify Email (backend only)
// ------------------------------------------------------
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    verifyToken: token,
    verifyTokenExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully!" });
});

// ------------------------------------------------------
// Login User
// ------------------------------------------------------
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required." });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid email or password." });

  const isMatch = await user.matchPassword(password);
  if (!isMatch)
    return res.status(401).json({ message: "Invalid email or password." });

  if (!user.isVerified)
    return res.status(401).json({ message: "Email is not verified." });

  res.json({
    message: "Login successful.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
    },
    token: generateToken(user._id),
  });
});

// ------------------------------------------------------
// Forgot Password → Send Reset Link
// ------------------------------------------------------
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "User with this email not found" });

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
  await user.save();

  const resetUrl = `${process.env.BACKEND_URL.replace(
    /\/$/,
    ""
  )}/api/users/reset-password/${resetToken}`;

  const html = `
    <h2>Reset your password</h2>
    <p>Hello ${user.name},</p>
    <p>Click the link below to reset your password (expires in 15 minutes):</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you didn't request this, ignore this email.</p>
  `;

  try {
    await sendEmail(user.email, "Reset Password", html);
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.error("Reset email failed:", err.message);
    return res.status(500).json({ message: "Unable to send password reset email." });
  }

  res.json({ message: "Password reset email sent" });
});

// ------------------------------------------------------
// Reset Password
// ------------------------------------------------------
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired reset token" });

  if (!validatePassword(newPassword))
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    });

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

// ------------------------------------------------------
// Upload Profile Pic
// ------------------------------------------------------
export const uploadProfilePic = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found." });

  if (user.profilePic) {
    const oldPath = path.join("uploads", user.profilePic);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  user.profilePic = `users/${req.file.filename}`;
  await user.save();

  res.json({
    message: "Profile picture updated successfully.",
    profilePic: `/uploads/${user.profilePic}`,
  });
});

// ------------------------------------------------------
// Delete Profile Pic
// ------------------------------------------------------
export const deleteProfilePic = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found." });

  if (!user.profilePic)
    return res.status(404).json({ message: "No profile picture found" });

  const filePath = path.join("uploads", user.profilePic);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  user.profilePic = "";
  await user.save();

  res.json({ message: "Profile picture deleted successfully." });
});
