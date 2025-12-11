// controllers/cityControllers.js
import City from "../models/City.js";
import asyncHandler from "../utils/asyncHandler.js";

// Helper to escape user input for RegExp
const escapeRegExp = (string = "") => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get all cities (public)
export const getCities = asyncHandler(async (req, res) => {
  const search = (req.query.search || "").trim();
  const query = search ? { name: { $regex: escapeRegExp(search), $options: "i" } } : {};

  // use lean + projection to reduce memory
  const cities = await City.find(query).sort({ name: 1 }).select("_id name").lean();

  // Return array (could be empty)
  res.status(200).json(cities.map((c) => ({ id: c._id, name: c.name })));
});

// Admin: create a new city
export const createCity = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "City name required" });
  }
  const normalized = String(name).trim();

  // case-insensitive exact match (escape user input)
  const exists = await City.findOne({ name: { $regex: `^${escapeRegExp(normalized)}$`, $options: "i" } }).lean();
  if (exists) return res.status(400).json({ message: "City already exists" });

  const city = await City.create({ name: normalized });
  res.status(201).json({ id: city._id, name: city.name });
});

// Admin: delete a city
export const deleteCity = asyncHandler(async (req, res) => {
  const city = await City.findByIdAndDelete(req.params.id).lean();
  if (!city) return res.status(404).json({ message: "City not found" });
  res.json({ message: "City deleted" });
});
