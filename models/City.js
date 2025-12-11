// models/City.js
import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

// NOTE: `unique: true` creates an index. Do NOT create a duplicate index here.
// Removed duplicate `schema.index({ name: 1 })` which caused the mongoose warning.

const City = mongoose.model("City", citySchema);
export default City;
