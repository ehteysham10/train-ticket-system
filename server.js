
import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatMessage from "./models/ChatMessage.js";

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

console.log("🔥 Socket.IO initialized!");

// Optional Socket Authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow no-auth clients for testing

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      id: decoded.id || decoded._id,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    console.warn("Socket auth failed:", err.message);
    return next();
  }
});

// MAIN SOCKET LOGIC
io.on("connection", (socket) => {
  // Log connection specifically with ID
  console.log(
    `🔵 Connected: ${socket.id} | User: ${socket.user?.id || "Guest/Admin-Test"}`
  );

  // Join personal room
  socket.on("joinRoom", (roomId) => {
    try {
      if (!roomId) return;
      roomId = roomId.toString();

      // Socket.io automatically handles duplicates, but checking acts as a safeguard
      if (!socket.rooms.has(roomId)) {
        socket.join(roomId);
        console.log(`🏠 ${socket.id} joined room: ${roomId}`);
      }
    } catch (err) {
      console.error("joinRoom error:", err);
    }
  });

  // SEND MESSAGE
  socket.on("sendMessage", async (data) => {
    try {
      const senderId = socket.user?.id?.toString() || data.senderId;
      const receiverId = data.receiverId?.toString();
      const message = data.message;

      if (!senderId || !receiverId || !message) {
        socket.emit("error", { message: "Missing fields in sendMessage" });
        return;
      }

      // Save message to DB
      const saved = await ChatMessage.create({
        sender: senderId,
        receiver: receiverId,
        message,
        isAdmin: data.isAdmin || false,
      });

      const cleanMsg = {
        _id: saved._id.toString(),
        sender: saved.sender.toString(),
        receiver: saved.receiver.toString(),
        message: saved.message,
        isAdmin: saved.isAdmin,
        createdAt: saved.createdAt,
      };

      console.log(`📨 Chat: ${senderId} -> ${receiverId}: "${message}"`);

      // ---------------------------------------------------------
      // ✅ FIX: Use socket.to() instead of io.to()
      // Yeh message sirf Receiver ko jayega. Sender ko wapis nahi aayega.
      // ---------------------------------------------------------
      socket.to(receiverId).emit("receiveMessage", cleanMsg);

      // ✅ Sender (Admin/User) ko alag se confirmation bhejo
      socket.emit("messageSent", cleanMsg);

    } catch (err) {
      console.error("sendMessage error:", err);
      socket.emit("error", { message: "Message failed to send" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Disconnected: ${socket.id}`);
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  httpServer.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.info("SIGTERM received. Shutting down gracefully.");
  httpServer.close(() => process.exit(0));
});