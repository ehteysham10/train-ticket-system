
import express from "express";
import {
  createTicket,
  getTickets,
  searchTickets,
  cancelTicket,
  confirmTicket,
  confirmCancelTicket
} from "../controllers/ticketControllers.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createTicket);
router.get("/", protect, getTickets);

router.get("/confirm/:ticketId", confirmTicket);
router.get("/confirm-cancel/:ticketId", confirmCancelTicket);

router.get("/search", protect, searchTickets);

router.put("/cancel/:id", protect, cancelTicket);

export default router;

