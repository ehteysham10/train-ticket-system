import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Invalid email"],
  },

  password: { type: String, required: true, minlength: 8 },

  profilePic: { type: String, default: "" },

  // Role
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  // Email verification
  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  verifyTokenExpires: Date,

  // Forgot password
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Hash Password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match Password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
