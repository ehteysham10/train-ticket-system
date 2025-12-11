

// import mongoose from "mongoose";

// const ticketSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     from: { type: String, required: true },
//     to: { type: String, required: true },

//     category: {
//       type: String,
//       enum: ["Economy", "Business"],
//       required: true,
//     },

//     price: { type: Number, required: true },

//     seatNumber: { type: String, default: null },

//     travelDate: { type: Date, required: true },

//     travelTime: {
//       type: String,
//       enum: ["5am", "10am", "5pm", "10pm"],
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["Pending", "Booked", "Cancelled", "Refunded"],
//       default: "Pending",
//     },

//     cancelledAt: { type: Date, default: null },

//     refundAmount: { type: Number, default: 0 },
//     refundDate: { type: Date, default: null },

//     image: { type: String },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Ticket", ticketSchema);


















import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    from: { type: String, required: true },
    to: { type: String, required: true },

    category: {
      type: String,
      enum: ["Economy", "Business"],
      required: true,
    },

    price: { type: Number, required: true },

    seatNumber: { type: String, required: true }, // auto-generated, now required

    travelDate: { type: Date, required: true },

    travelTime: {
      type: String,
      enum: ["5am", "10am", "5pm", "10pm"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Booked", "Cancelled", "Refunded"],
      default: "Pending",
    },

    cancelledAt: { type: Date, default: null },

    refundAmount: { type: Number, default: 0 },
    refundDate: { type: Date, default: null },

    image: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
