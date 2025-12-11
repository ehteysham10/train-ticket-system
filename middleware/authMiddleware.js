// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // verify token (throws on invalid/expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // minimize fields fetched and use lean to reduce overhead
    // if req.user already exists (rare), skip DB lookup
    if (!req.user || !req.user._id) {
      const user = await User.findById(decoded.id).select("-password").lean();
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      req.user = user; // plain object
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Admin-only middleware
export const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};
