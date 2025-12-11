

// models/ChatMessage.js
import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },   // userId or admin string
    receiver: { type: String, required: true }, // userId or admin string
    message: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    read: { type: Boolean, default: false },    // useful later
  },
  { timestamps: true }
);



export default mongoose.model("ChatMessage", chatMessageSchema);

