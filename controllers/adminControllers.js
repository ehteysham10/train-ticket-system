// controllers/adminControllers.js
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import City from "../models/City.js";
import jwt from "jsonwebtoken";
import validatePassword from "../utils/passwordValidator.js";
import fs from "fs";
import path from "path";
import asyncHandler from "../utils/asyncHandler.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// Register (admin helper)
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!validatePassword(password)) return res.status(400).json({ message: "Weak password." });

  const userExists = await User.findOne({ email }).lean();
  if (userExists) return res.status(400).json({ message: "User already exists." });

  const user = await User.create({ name, email, password });
  res
    .status(201)
    .json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
});

// Login (admin helper)
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      token: generateToken(user._id),
    });
  }

  return res.status(401).json({ message: "Invalid email or password" });
});

// Upload profile pic (admin helper)
export const uploadProfilePic = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.profilePic) {
    const oldPath = path.join("uploads", user.profilePic);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  user.profilePic = `users/${req.file.filename}`;
  await user.save();

  res.json({ message: "Profile picture updated", profilePic: `/uploads/${user.profilePic}` });
});

// Delete profile pic (admin helper)
export const deleteProfilePic = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.profilePic) {
    const filePath = path.join("uploads", user.profilePic);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    user.profilePic = "";
    await user.save();
    return res.json({ message: "Profile picture deleted" });
  }

  return res.status(404).json({ message: "No profile picture found" });
});

// Get single user by ID (admin)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// Dashboard stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const [userCount, ticketCount, cityCount] = await Promise.all([
    User.countDocuments(),
    Ticket.countDocuments(),
    City.countDocuments(),
  ]);
  res.json({ userCount, ticketCount, cityCount });
});

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -__v").lean();
  res.json(users);
});

// Toggle user role (admin)
export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = user.role === "admin" ? "user" : "admin";
  await user.save();
  res.json({
    message: `User role updated to ${user.role}`,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// Delete user (admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id).lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted successfully" });
});
