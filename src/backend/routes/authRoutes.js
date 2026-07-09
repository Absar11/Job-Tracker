import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  sendSignupOtp,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.post("/send-otp", sendSignupOtp);   // Step 1: send OTP
router.post("/register", registerUser);    // Step 2: verify OTP + create account
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", authenticateJWT, getUserProfile);
router.put("/profile", authenticateJWT, updateUserProfile);

export default router;
