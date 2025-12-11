

// controllers/adminTicketControllers.js

import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

// Get all tickets (Admin only)
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("user", "name email");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tickets", error });
  }
};

// Get tickets by userId
export const getTicketsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const tickets = await Ticket.find({ user: userId });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user's tickets", error });
  }
};

// Update any ticket (Admin)
export const adminUpdateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const updated = await Ticket.findByIdAndUpdate(
      ticketId,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update ticket", error });
  }
};

// Delete ticket (Admin)
export const adminDeleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await ticket.deleteOne();

    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete ticket", error });
  }
};

