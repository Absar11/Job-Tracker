import mongoose from "mongoose";

export const UserRole = {
  USER: "User",
  ADMIN: "Admin",
};

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    password: { type: String, required: false },
    password_hash: { type: String, required: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    avatar: { type: String, default: "" },
    resetToken: { type: String, default: "" },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
