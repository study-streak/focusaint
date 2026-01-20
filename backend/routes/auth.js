import express from "express"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import User from "../models/User.js"
import OTP from "../models/OTP.js"
import StreakRecord from "../models/StreakRecord.js"
import { sendOTP } from "../services/email.js"
import { validateEmail, validatePassword } from "../utils/validation.js"


const router = express.Router()

// Resend OTP (only for existing pending verifications)
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    // Check if there's a pending OTP request
    const existingOTP = await OTP.findOne({ email })
    if (!existingOTP) {
      return res.status(400).json({ error: "No pending verification found. Please sign up or login first." })
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update existing OTP record
    existingOTP.otp = otp
    existingOTP.expiresAt = expiresAt
    await existingOTP.save()

    // Get name from signup data or fetch user
    let name = existingOTP.signupData?.name
    if (!name) {
      const user = await User.findOne({ email })
      name = user?.name
    }

    // Send OTP to email
    await sendOTP(email, otp, name)

    res.json({
      message: "OTP resent to email",
      email,
    })
  } catch (error) {
    console.error("Resend OTP error:", error)
    res.status(500).json({ error: "Failed to resend OTP" })
  }
})

// Verify OTP and mark user email as verified (no user creation)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!validateEmail(email) || !otp) {
      return res.status(400).json({ error: "Invalid email or OTP" })
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp })

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" })
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id })
      return res.status(400).json({ error: "OTP has expired" })
    }

    // Find user (must exist from signup)
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User not found. Please sign up first." })
    }

    // Mark email verified if not already
    if (!user.isEmailVerified) {
      user.isEmailVerified = true
      await user.save()
      // Ensure streak record exists
      const existingStreak = await StreakRecord.findOne({ userId: user._id })
      if (!existingStreak) {
        await StreakRecord.create({ userId: user._id })
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "focusaint_secret_key", {
      expiresIn: "7d",
    })

    // Delete OTP after verification
    await OTP.deleteOne({ _id: otpRecord._id })

    res.json({
      message: "Verification successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        learningGoal: user.learningGoal,
        currentStreak: user.currentStreak,
      },
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    res.status(500).json({ error: "Verification failed" })
  }
})

// Signup with password -> create user, then send OTP to verify email
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, learningGoal } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 chars with a number and uppercase letter" })
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered. Please login instead." })
    }

    // Create user (isEmailVerified remains false by default)
    const user = await User.create({
      email,
      password,
      name: name.trim(),
      learningGoal: learningGoal || undefined,
    })

    // Generate OTP and send for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await OTP.deleteMany({ email })
    await OTP.create({ email, otp, expiresAt })
    await sendOTP(email, otp, user.name)

    res.status(201).json({
      message: "Signup successful. We sent a verification code to your email.",
      email,
      requiresVerification: true,
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Signup failed" })
  }
})

// Password-based login; if unverified, send OTP and require verification
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!validateEmail(email) || !password) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User not found" })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" })
    }

    // If email not verified, send OTP and block login
    if (!user.isEmailVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await OTP.deleteMany({ email })
      await OTP.create({ email, otp, expiresAt })
      await sendOTP(email, otp, user.name)

      return res.status(403).json({
        error: "Email not verified. We've sent a verification code to your email.",
        requiresVerification: true,
        email,
      })
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "focusaint_secret_key", {
      expiresIn: "7d",
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currentStreak: user.currentStreak,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
})

export default router
