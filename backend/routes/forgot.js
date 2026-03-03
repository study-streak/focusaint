import express from "express"
import User from "../models/User.js"
import OTP from "../models/OTP.js"
import { sendOTP } from "../services/email.js"
import jwt from "jsonwebtoken"
import { validateEmail, validatePassword } from "../utils/validation.js"
import { connectToMongo } from "../utils/db.js"
import crypto from "crypto"

const router = express.Router()

// Request password reset
// Helper to create a JWT reset token
function createResetToken(email, code) {
  return jwt.sign({ email, code }, process.env.JWT_SECRET || "focusaint_secret_key", { expiresIn: "15m" });
}

// Helper to verify a JWT reset token
function verifyResetToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "focusaint_secret_key");
  } catch {
    return null;
  }
}

router.post("/forgot-password", async (req, res) => {
  await connectToMongo()
  try {
    const { email } = req.body
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "No user found with this email" })
    }
    // Generate 6-digit numeric reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min
    // Save code to OTP collection (reuse for simplicity)
    const otpDoc = await OTP.findOneAndUpdate(
      { email, type: "reset" },
      { otp: code, expiresAt, type: "reset", attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("[FORGOT PASSWORD] OTP saved:", otpDoc);
    // Create JWT token for link
    const resetToken = createResetToken(email, code)
    // Send email (pass token as third arg)
    await sendOTP(email, code, user.name, true, resetToken)
    res.json({ message: "Password reset code sent to email" })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ error: "Failed to send reset code" })
  }
})

// Reset password
// New endpoint: POST /forgot/reset-password-token { token, newPassword }
router.post("/reset-password-token", async (req, res) => {
  await connectToMongo()
  try {
    const { token, newPassword } = req.body
    if (!token || !validatePassword(newPassword)) {
      return res.status(400).json({ error: "Invalid input" })
    }
    const decoded = verifyResetToken(token)
    if (!decoded || !decoded.email || !decoded.code) {
      return res.status(400).json({ error: "Invalid or expired reset token" })
    }
    const { email, code } = decoded
    const otpRecord = await OTP.findOne({ email, otp: code, type: "reset" })
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset token" })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User not found" })
    }
    user.password = newPassword
    await user.save()
    await OTP.deleteOne({ _id: otpRecord._id })
    res.json({ message: "Password reset successful" })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ error: "Failed to reset password" })
  }
})

export default router
