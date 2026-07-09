import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbService } from "../services/dbService.js";
import { UserRole } from "../models/User.js";
import { sendMail, isUsingSimulatedEmail, explainSmtpError } from "../services/emailService.js";

const JWT_DEFAULT_SECRET = "super_secret_jwt_key_job_tracker_pro_2026";

// Helper to sign JWT keys
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || JWT_DEFAULT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

/**
 * In-memory OTP store for signup verification.
 * Key: email (lowercase), Value: { otp, expiresAt, name, password, role, avatar }
 * OTP expires in 10 minutes and is deleted after one successful use.
 */
const signupOtpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Generate a random 6-digit OTP
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Build OTP email HTML
const buildOtpEmailHtml = (name, otp) => `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 28px; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #4f46e5; font-size: 22px; font-weight: 800; margin: 0;">🔐 Verify Your Email</h2>
      <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Job Tracker Pro — Account Verification</p>
    </div>
    <p style="color: #334155; font-size: 14px;">Hello <strong>${name}</strong>,</p>
    <p style="color: #334155; font-size: 14px;">Use the code below to complete your registration. This code is valid for <strong>10 minutes</strong>.</p>
    <div style="background: #f5f3ff; border: 2px dashed #a78bfa; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #4f46e5; font-family: monospace;">${otp}</span>
    </div>
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.<br/>Do not share this OTP with anyone.</p>
    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
    <p style="color: #cbd5e1; font-size: 11px; text-align: center;">© 2026 Job Tracker Pro. All Rights Reserved.</p>
  </div>
`;

// ─── Step 1: Send OTP for signup verification ────────────────────────────────
export const sendSignupOtp = async (req, res) => {
  const { name, email, password, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please provide name, email, and password." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
  }

  try {
    // Check for duplicate email before sending OTP
    const existing = await dbService.findUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: "This email is already registered. Please login instead." });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    // Store OTP along with registration data (so Step 2 doesn't need them again)
    signupOtpStore.set(email.toLowerCase(), { otp, expiresAt, name, password, avatar: avatar || "" });

    // Send OTP email
    await sendMail({
      to: email,
      subject: `${otp} — Your Job Tracker Pro Verification Code`,
      text: `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n— Job Tracker Pro`,
      html: buildOtpEmailHtml(name, otp),
    });

    console.log(`[OTP] Sent signup OTP to ${email}`);
    return res.status(200).json({ success: true, message: "OTP sent to your email. Please check your inbox." });
  } catch (err) {
    console.error("[OTP] Error sending signup OTP:", err);
    const hint = explainSmtpError ? explainSmtpError(err) : "";
    return res.status(500).json({ success: false, message: hint || "Failed to send OTP. Check SMTP settings." });
  }
};

// ─── Step 2: Verify OTP + Create Account ─────────────────────────────────────
export const registerUser = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  const record = signupOtpStore.get(email.toLowerCase());

  if (!record) {
    return res.status(400).json({ success: false, message: "No OTP found for this email. Please request a new one." });
  }

  if (Date.now() > record.expiresAt) {
    signupOtpStore.delete(email.toLowerCase());
    return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
  }

  if (record.otp !== String(otp).trim()) {
    return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });
  }

  // OTP verified — delete it (one-time use)
  signupOtpStore.delete(email.toLowerCase());

  try {
    // Double-check email isn't taken (race condition safety)
    const existing = await dbService.findUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(record.password, salt);

    const user = await dbService.createUser({
      name: record.name,
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.USER,
      avatar: record.avatar,
    });

    const token = generateToken({
      id: user.id || user._id,
      email: user.email,
      role: user.role,
    });

    console.log(`[OTP] Account created for ${email}`);
    return res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome aboard.",
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    console.error("[OTP] Error creating user after OTP verify:", err);
    return res.status(500).json({ success: false, message: "Account creation failed. Please try again." });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  try {
    const user = await dbService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const hash = user.passwordHash || user.password || user.password_hash;
    if (!hash) {
      console.warn(`User ${email} found but has no password hash field.`);
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({
      id: user.id || user._id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Log in successful.",
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    console.error("Login failure:", err);
    return res.status(500).json({ success: false, message: "Server error during log in." });
  }
};

// Get profile
export const getUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized. Profile check failed." });
  }

  try {
    const user = await dbService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error loading profile details" });
  }
};

// Update profile details
export const updateUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const { name, avatar } = req.body;

  try {
    const user = await dbService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const db = dbService.useMongo;
    if (db) {
      const updatedUser = await dbService.findUserById(req.user.id);
      if (name) updatedUser.name = name;
      if (avatar !== undefined) updatedUser.avatar = avatar;
      await updatedUser.save();

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
        },
      });
    } else {
      const localDb = dbService.readLocal();
      const userIdx = localDb.users.findIndex((u) => u._id === req.user.id);
      if (userIdx !== -1) {
        if (name) localDb.users[userIdx].name = name;
        if (avatar !== undefined) localDb.users[userIdx].avatar = avatar;
        localDb.users[userIdx].updatedAt = new Date().toISOString();
        dbService.writeLocal(localDb);

        return res.status(200).json({
          success: true,
          message: "Profile updated successfully.",
          user: {
            id: localDb.users[userIdx]._id,
            name: localDb.users[userIdx].name,
            email: localDb.users[userIdx].email,
            role: localDb.users[userIdx].role,
            avatar: localDb.users[userIdx].avatar,
          },
        });
      } else {
        return res.status(404).json({ success: false, message: "Local user match not found" });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error updating profile details" });
  }
};


// Request password reset token
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Please provide your email address." });
  }

  const emailNormalized = email.trim().toLowerCase();

  try {
    const user = await dbService.findUserByEmail(emailNormalized);
    if (!user) {
      return res.status(404).json({ success: false, message: "No account registered with this email address." });
    }

    // Generate a secure 6-digit random token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const isMongo = dbService.useMongo;
    if (isMongo) {
      const dbUser = await dbService.findUserById(user._id || user.id);
      dbUser.resetToken = resetToken;
      dbUser.resetTokenExpiry = resetTokenExpiry;
      await dbUser.save();
    } else {
      const localDb = dbService.readLocal();
      const userIdx = localDb.users.findIndex((u) => u.email.toLowerCase() === emailNormalized);
      if (userIdx !== -1) {
        localDb.users[userIdx].resetToken = resetToken;
        localDb.users[userIdx].resetTokenExpiry = resetTokenExpiry.toISOString();
        localDb.users[userIdx].updatedAt = new Date().toISOString();
        dbService.writeLocal(localDb);
      }
    }

    // Simulation log setup
    const emailSubject = `🔑 PASSWORD RESET: Security Verification Code for Job Tracker Pro`;
    const emailBody = `Hello ${user.name || "User"},\n\nWe received a request to reset the password for your Job Tracker Pro account.\n\nYour secure 6-digit security verification code is:\n👉 ${resetToken} 👈\n\nThis code is valid for 10 minutes. If you did not initiate this request, you can safely ignore this email; your credentials remain secure.\n\nBest regards,\nThe Job Tracker Pro Security Team`;
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 40px;">🔑</span>
          <h2 style="color: #1e293b; margin-top: 10px; font-weight: 800; font-size: 22px;">Reset Your Password</h2>
          <p style="color: #64748b; font-size: 13px;">Job Tracker Pro Security Service</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${user.name || "User"}</strong>,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your Job Tracker Pro account. Use the secure 6-digit verification code below to authorize this action:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; padding: 12px 30px; background-color: #eff6ff; border: 1px dashed #3b82f6; border-radius: 12px; font-size: 26px; font-weight: 850; letter-spacing: 5px; color: #1d4ed8; font-family: monospace;">
            ${resetToken}
          </div>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 8px;">Valid for 10 minutes</p>
        </div>

        <p style="color: #ef4444; font-size: 12px; line-height: 1.5; background-color: #fef2f2; padding: 10px; border-radius: 8px;">
          <strong>Security Notice:</strong> If you did not initiate this request, you can safely ignore this email; your credentials remain secure.
        </p>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 25px; margin-bottom: 15px;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4;">
          This is an automated security system notification.<br />
          &copy; 2026 Job Tracker Pro. All Rights Reserved.
        </p>
      </div>
    `;

    // Send actual email via SMTP
    try {
      await sendMail({
        to: emailNormalized,
        subject: emailSubject,
        text: emailBody,
        html: emailHtml,
      });
    } catch (smtpErr) {
      console.error("SMTP email dispatch failed:", smtpErr);
      const userMessage = explainSmtpError(smtpErr);
      return res.status(400).json({
        success: false,
        message: userMessage
      });
    }

    return res.status(200).json({
      success: true,
      message: `A secure 6-digit verification code has been successfully sent to ${emailNormalized}. Please check your inbox!`,
      isSimulated: false
    });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    return res.status(500).json({ success: false, message: "Failed to generate password reset request." });
  }
};

// Reset password using verified token
export const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ success: false, message: "Please provide email, verification code, and new password." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
  }

  const emailNormalized = email.trim().toLowerCase();

  try {
    const user = await dbService.findUserByEmail(emailNormalized);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Check code match and expiry
    const userToken = user.resetToken;
    const userTokenExpiry = user.resetTokenExpiry;

    if (!userToken || userToken !== String(token).trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code." });
    }

    if (!userTokenExpiry || new Date(userTokenExpiry) < new Date()) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const isMongo = dbService.useMongo;
    if (isMongo) {
      const dbUser = await dbService.findUserById(user._id || user.id);
      dbUser.passwordHash = passwordHash;
      dbUser.resetToken = "";
      dbUser.resetTokenExpiry = null;
      // Clean up legacy password fields if present
      dbUser.password = undefined;
      dbUser.password_hash = undefined;
      await dbUser.save();
    } else {
      const localDb = dbService.readLocal();
      const userIdx = localDb.users.findIndex((u) => u.email.toLowerCase() === emailNormalized);
      if (userIdx !== -1) {
        localDb.users[userIdx].passwordHash = passwordHash;
        localDb.users[userIdx].resetToken = "";
        localDb.users[userIdx].resetTokenExpiry = null;
        localDb.users[userIdx].updatedAt = new Date().toISOString();
        dbService.writeLocal(localDb);
      }
    }

    console.log(`[PASSWORD UPDATED SUCCESSFULLY] Password for user ${emailNormalized} was successfully changed.`);

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. You can now log in with your new credentials.",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};

