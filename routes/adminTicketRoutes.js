// routes/adminTicketRoutes.js
import express from "express";
import {
  getAllTickets,
  getTicketsByUser,
  adminUpdateTicket,
  adminDeleteTicket,
} from "../controllers/adminTicketController.js";
import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ All routes below are restricted to Admin only
router.use(protect, adminProtect);

// 👇 Get all tickets
router.get("/", getAllTickets);

// 👇 Get all tickets by specific user
router.get("/user/:userId", getTicketsByUser);

// 👇 Update any ticket
router.put("/:ticketId", adminUpdateTicket);

// 👇 Delete any ticket
router.delete("/:ticketId", adminDeleteTicket);

export default router;
