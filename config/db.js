// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // New mongodb driver (v4+) no longer needs useNewUrlParser/useUnifiedTopology.
      // Keep short server/socket timeouts to fail fast in dev/test environments.
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // IPv4
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);

    conn.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    conn.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting reconnect...");
    });
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
