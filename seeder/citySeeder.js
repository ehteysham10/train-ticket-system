// seeder/citySeeder.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import City from "../models/City.js";
import connectDB from "../config/db.js";

dotenv.config();

// 🇵🇰 List of major Pakistani cities
const pakistaniCities = [
  { name: "Karachi" },
  { name: "Lahore" },
  { name: "Islamabad" },
  { name: "Faisalabad" },
  { name: "Rawalpindi" },
  { name: "Multan" },
  { name: "Peshawar" },
  { name: "Quetta" },
  { name: "Sialkot" },
  { name: "Hyderabad" },
  { name: "Gujranwala" },
  { name: "Sukkur" },
  { name: "Bahawalpur" },
  { name: "Sargodha" },
  { name: "Abbottabad" },
  { name: "Larkana" },
  { name: "Mardan" },
  { name: "Sheikhupura" },
  { name: "Mirpur" },
  { name: "Kasur" },
];

const seedCities = async () => {
  try {
    await connectDB();

    // Optional: Clear old data if needed
    await City.deleteMany();

    await City.insertMany(pakistaniCities);

    console.log("✅ Pakistani cities have been seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding cities:", error);
    process.exit(1);
  }
};

// Run seeder
seedCities();
