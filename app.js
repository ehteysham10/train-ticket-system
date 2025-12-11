
// app.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import multer from "multer";

import connectDB from "./config/db.js";

// Routes
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import adminTicketRoutes from "./routes/adminTicketRoutes.js";
import chatRoutes from "./routes/chatRoutes.js"; // <-- chat routes

// Connect DB
connectDB();

const app = express();



app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.options("*", cors()); 

// app.use(cors())

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Response time log
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// Security
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Compression
app.use(compression());

// Logging
app.use(morgan("dev"));

// Body parser
app.use(express.json({ limit: "10kb" }));

// Static uploads
app.use("/uploads", express.static("uploads"));







// Routes (existing)
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin/tickets", adminTicketRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🚆 Railway Ticket Management Backend Running...");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Multer error handler
app.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    (err?.message && err.message.includes("Only .jpeg"))
  ) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

export default app;

