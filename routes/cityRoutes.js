import express from "express";
import { getCities, createCity, deleteCity } from "../controllers/cityControllers.js";
import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCities);
router.post("/", protect, adminProtect, createCity);
router.delete("/:id", protect, adminProtect, deleteCity);

export default router;
