
import Ticket from "../models/Ticket.js";
import City from "../models/City.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";

// ---------------------- Helpers ----------------------
const getFixedPrice = (category) =>
  category === "Economy" ? 1000 : category === "Business" ? 2500 : null;

const escapeRegExp = (str = "") =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateSeatNumber = () => {
  const row = String.fromCharCode(65 + Math.floor(Math.random() * 6));
  const num = Math.floor(Math.random() * 30) + 1;
  return `${row}${num}`;
};

// ---------------------- CREATE TICKET ----------------------
export const createTicket = asyncHandler(async (req, res) => {
  const { from, to, category, travelDate, travelTime } = req.body;

  if (!from || !to || !category || !travelDate || !travelTime) {
    return res.status(400).json({ 
      message: "'from', 'to', 'category', 'travelDate' and 'travelTime' are required" 
    });
  }

  const allowedTimes = ["5am", "10am", "5pm", "10pm"];
  if (!allowedTimes.includes(travelTime)) {
    return res.status(400).json({ message: "Invalid travelTime. Must be one of: 5am, 10am, 5pm, 10pm" });
  }

  // Validate cities
  const [fromCity, toCity] = await Promise.all([
    City.findOne({ name: new RegExp(`^${escapeRegExp(from)}$`, "i") }),
    City.findOne({ name: new RegExp(`^${escapeRegExp(to)}$`, "i") }),
  ]);
  if (!fromCity || !toCity) return res.status(400).json({ message: "Invalid city names" });

  const price = getFixedPrice(category);
  if (!price) return res.status(400).json({ message: "Invalid category" });

  // Validate travelDate and travelTime
  const now = new Date();
  const selectedDate = new Date(travelDate);
  selectedDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return res.status(400).json({ message: "travelDate must be today or a future date" });
  }

  const timeMap = { "5am": 5, "10am": 10, "5pm": 17, "10pm": 22 };
  if (selectedDate.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const travelHour = timeMap[travelTime];

    if (travelHour < currentHour || (travelHour === currentHour && 0 <= currentMinutes)) {
      return res.status(400).json({ 
        message: "You must choose a future time for today." 
      });
    }
  }

  // Ensure seat number is unique for that date + time
  let seatNumber;
  let attempts = 0;
  do {
    seatNumber = generateSeatNumber();
    attempts++;
    if (attempts > 10) {
      return res.status(500).json({ message: "Unable to generate unique seat number. Try again." });
    }
  } while (await Ticket.findOne({ travelDate: selectedDate, travelTime, seatNumber }));

  // Create ticket
  const ticket = await Ticket.create({
    user: req.user._id,
    from: fromCity.name,
    to: toCity.name,
    category,
    price,
    seatNumber,
    travelDate: selectedDate,
    travelTime,
    status: "Pending",
  });

  const populated = await Ticket.findById(ticket._id).populate("user", "name email");

  // Format travelDate nicely
  const formattedDate = new Date(populated.travelDate).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });

  // Send initial confirmation email
  const verifyURL = `http://localhost:5000/api/tickets/confirm/${ticket._id}`;
  const html = `
    <h2>Hello ${populated.user.name},</h2>
    <p>Your ticket has been created! Please confirm your booking by clicking below:</p>
    <a href="${verifyURL}" style="padding:10px 20px;background:#007bff;color:white;text-decoration:none;border-radius:5px;">
      Confirm Ticket
    </a>
    <h3 style="margin-top:20px;">Ticket Details:</h3>
    <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
      <tr><th>From</th><td>${populated.from}</td></tr>
      <tr><th>To</th><td>${populated.to}</td></tr>
      <tr><th>Category</th><td>${populated.category}</td></tr>
      <tr><th>Seat Number</th><td>${populated.seatNumber}</td></tr>
      <tr><th>Travel Date</th><td>${formattedDate}</td></tr>
      <tr><th>Travel Time</th><td>${populated.travelTime}</td></tr>
      <tr><th>Price</th><td>$${populated.price}</td></tr>
      <tr><th>Status</th><td>${populated.status}</td></tr>
    </table>
  `;

  await sendEmail(populated.user.email, "Confirm Ticket Booking", html);

  res.status(201).json({
    message: "Ticket created. Check email to confirm.",
    ticket: populated,
  });
});

// ---------------------- CONFIRM TICKET ----------------------
export const confirmTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId).populate("user", "name email");

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (ticket.status === "Booked") return res.status(400).json({ message: "Ticket already confirmed" });

  ticket.status = "Booked";
  await ticket.save();

  // Send final booked ticket email
  const formattedDate = new Date(ticket.travelDate).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  const html = `
    <h2>Hello ${ticket.user.name},</h2>
    <p>Your ticket is now confirmed. Here are the details:</p>
    <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
      <tr><th>From</th><td>${ticket.from}</td></tr>
      <tr><th>To</th><td>${ticket.to}</td></tr>
      <tr><th>Category</th><td>${ticket.category}</td></tr>
      <tr><th>Seat Number</th><td>${ticket.seatNumber}</td></tr>
      <tr><th>Travel Date</th><td>${formattedDate}</td></tr>
      <tr><th>Travel Time</th><td>${ticket.travelTime}</td></tr>
      <tr><th>Price</th><td>$${ticket.price}</td></tr>
      <tr><th>Status</th><td>${ticket.status}</td></tr>
    </table>
  `;
  await sendEmail(ticket.user.email, "Ticket Confirmed", html);

  res.json({ message: "Ticket confirmed successfully", ticket });
});

// ---------------------- CANCEL TICKET ----------------------
export const cancelTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate("user", "email name");
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  const isOwner = ticket.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

  if (ticket.status !== "Booked") return res.status(400).json({ message: "Only booked tickets can be cancelled" });

  const verifyURL = `http://localhost:5000/api/tickets/confirm-cancel/${ticket._id}`;
  const html = `
    <h2>Hello ${ticket.user.name},</h2>
    <p>Please confirm your cancellation:</p>
    <a href="${verifyURL}" style="padding:10px 20px;background:#d9534f;color:white;text-decoration:none;border-radius:5px;">
      Confirm Cancellation
    </a>
  `;
  await sendEmail(ticket.user.email, "Confirm Ticket Cancellation", html);

  res.json({ message: "Cancellation email sent. Please verify." });
});

// ---------------------- CONFIRM CANCEL + REFUND ----------------------
export const confirmCancelTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (ticket.status === "Cancelled") return res.status(400).json({ message: "Ticket already cancelled" });

  ticket.status = "Refunded";
  ticket.cancelledAt = new Date();
  ticket.refundAmount = ticket.price * 0.8;
  ticket.refundDate = new Date();
  await ticket.save();

  res.json({ message: "Ticket cancelled & refunded (20% deduction)", ticket });
});

// ---------------------- GET TICKETS ----------------------
export const getTickets = asyncHandler(async (req, res) => {
  const filter = req.user.role !== "admin" ? { user: req.user._id } : {};
  const tickets = await Ticket.find(filter).populate("user", "name email").sort({ createdAt: -1 });
  res.json(tickets);
});

// ---------------------- SEARCH TICKETS ----------------------
export const searchTickets = asyncHandler(async (req, res) => {
  const { from, to, category, date } = req.query;
  const filter = {};

  if (from) filter.from = { $regex: escapeRegExp(from), $options: "i" };
  if (to) filter.to = { $regex: escapeRegExp(to), $options: "i" };
  if (category) filter.category = category;
  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59);
    filter.travelDate = { $gte: start, $lte: end };
  }

  if (req.user.role !== "admin") filter.user = req.user._id;

  const tickets = await Ticket.find(filter).populate("user", "name email");
  res.json(tickets);
});
