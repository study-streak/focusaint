import express from "express"
import User from "../models/User.js"
import StreakRecord from "../models/StreakRecord.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const streakRecord = await StreakRecord.findOne({ userId: user._id })

    res.json({
      user,
      streak: streakRecord,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ error: "Failed to fetch profile" })
  }
})

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, learningGoal, preferredStudyTime, modePreference } = req.body

    const updateData = {}
    if (name) updateData.name = name
    if (learningGoal) updateData.learningGoal = learningGoal
    if (preferredStudyTime) updateData.preferredStudyTime = preferredStudyTime
    if (modePreference) updateData.modePreference = modePreference

    const user = await User.findByIdAndUpdate(req.user.userId, updateData, { new: true }).select("-password")

    res.json({
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ error: "Failed to update profile" })
  }
})

// Get dashboard data
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email currentStreak longestStreak totalSessions lastSessionDate",
    )

    const streakRecord = await StreakRecord.findOne({ userId: req.user.userId })

    // Calculate weekly consistency
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const HabitSession = require("../models/HabitSession.js").default
    const weeklySessions = await HabitSession.countDocuments({
      userId: req.user.userId,
      sessionDate: { $gte: oneWeekAgo },
      status: "completed",
    })

    res.json({
      user,
      streak: streakRecord,
      weeklySessions,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({ error: "Failed to fetch dashboard" })
  }
})

export default router
