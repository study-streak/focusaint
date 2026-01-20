import express from "express"
import mongoose from "mongoose"
import HabitSession from "../models/HabitSession.js"
import StreakRecord from "../models/StreakRecord.js"
import User from "../models/User.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Start habit session
router.post("/start", authenticateToken, async (req, res) => {
  try {
    const { minDurationMinutes = 25 } = req.body

    // Check if session already active today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingSession = await HabitSession.findOne({
      userId: req.user.userId,
      sessionDate: { $gte: today },
      status: "active",
    })

    if (existingSession) {
      return res.status(400).json({ error: "Session already active today" })
    }

    const session = await HabitSession.create({
      userId: req.user.userId,
      startTime: new Date(),
      sessionDate: today,
      status: "active",
    })

    res.status(201).json({
      message: "Habit session started",
      session,
    })
  } catch (error) {
    console.error("Start session error:", error)
    res.status(500).json({ error: "Failed to start session" })
  }
})

// End habit session
router.post("/:sessionId/end", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = await HabitSession.findOne({
      _id: sessionId,
      userId: req.user.userId,
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    const endTime = new Date()
    const duration = Math.floor((endTime - session.startTime) / (1000 * 60))

    session.endTime = endTime
    session.duration = duration
    session.status = "completed"
    await session.save()

    // Update streak
    await updateStreak(req.user.userId)

    // Update user stats
    const user = await User.findById(req.user.userId)
    user.totalSessions += 1
    user.lastSessionDate = new Date()
    await user.save()

    res.json({
      message: "Session completed",
      session,
      duration,
    })
  } catch (error) {
    console.error("End session error:", error)
    res.status(500).json({ error: "Failed to end session" })
  }
})

// Get session history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const { daysBack = 30 } = req.query
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

    const sessions = await HabitSession.find({
      userId: req.user.userId,
      sessionDate: { $gte: startDate },
    }).sort({ sessionDate: -1 })

    res.json({
      sessions,
      daysBack,
    })
  } catch (error) {
    console.error("History error:", error)
    res.status(500).json({ error: "Failed to fetch history" })
  }
})

// Get streak info
router.get("/streak", authenticateToken, async (req, res) => {
  try {
    const streak = await StreakRecord.findOne({ userId: req.user.userId })
    const user = await User.findById(req.user.userId)

    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalSessions: user.totalSessions,
      lastSessionDate: user.lastSessionDate,
      streakHistory: streak?.streakHistory || [],
    })
  } catch (error) {
    console.error("Streak error:", error)
    res.status(500).json({ error: "Failed to fetch streak" })
  }
})

router.post("/session", authenticateToken, async (req, res) => {
  try {
    const { duration, mode } = req.body

    if (!duration || duration < 1) {
      return res.status(400).json({ error: "Invalid duration" })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const session = await HabitSession.create({
      userId: req.user.userId,
      startTime: new Date(Date.now() - duration * 60000),
      endTime: new Date(),
      duration,
      sessionDate: today,
      status: "completed",
      notes: `${mode} mode session`,
    })

    // Update user stats
    const user = await User.findById(req.user.userId)
    user.totalSessions += 1
    user.lastSessionDate = new Date()
    user.preferredMode = mode
    await user.save()

    // Update streak
    await updateStreak(req.user.userId)

    res.status(201).json({
      message: "Session logged successfully",
      session,
    })
  } catch (error) {
    console.error("Log session error:", error)
    res.status(500).json({ error: "Failed to log session" })
  }
})

router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    const streakRecord = await StreakRecord.findOne({ userId: req.user.userId })

    // Get this week's sessions
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const sessionsThisWeek = await HabitSession.countDocuments({
      userId: req.user.userId,
      sessionDate: { $gte: sevenDaysAgo },
      status: "completed",
    })

    // Get total duration this week
    const weekSessions = await HabitSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.userId),
          sessionDate: { $gte: sevenDaysAgo },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$duration" },
        },
      },
    ])

    const totalDuration = weekSessions[0]?.totalDuration || 0

    // Get weekly data for chart
    const today = new Date()
    const weeklyData = []
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayIndex = date.getDay()
      const dayName = daysOfWeek[dayIndex]

      const sessionsCount = await HabitSession.countDocuments({
        userId: req.user.userId,
        sessionDate: { $gte: date, $lt: nextDate },
        status: "completed",
      })

      weeklyData.push({
        day: dayName,
        sessions: sessionsCount,
      })
    }

    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalSessions: user.totalSessions,
      sessionsThisWeek,
      totalDuration: Math.round(totalDuration / 60), // Convert to hours
      weeklyData,
      lastSessionDate: user.lastSessionDate,
    })
  } catch (error) {
    console.error("Stats error:", error)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
})

// Helper function to update streak
async function updateStreak(userId) {
  const user = await User.findById(userId)
  const streakRecord = await StreakRecord.findOne({ userId })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todaySession = await HabitSession.findOne({
    userId,
    sessionDate: today,
    status: "completed",
  })

  if (!todaySession) return

  const lastActiveDate = streakRecord?.lastActiveDate

  if (!lastActiveDate || lastActiveDate.toDateString() === yesterday.toDateString()) {
    // Increment streak
    user.currentStreak += 1
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak
    }
  } else if (lastActiveDate.toDateString() !== today.toDateString()) {
    // Reset streak
    if (streakRecord && streakRecord.currentStreak > 0) {
      streakRecord.streakHistory.push({
        startDate: streakRecord.lastActiveDate,
        endDate: new Date(),
        length: streakRecord.currentStreak,
      })
    }
    user.currentStreak = 1
  }

  streakRecord.currentStreak = user.currentStreak
  streakRecord.longestStreak = user.longestStreak
  streakRecord.lastActiveDate = new Date()
  streakRecord.totalSessions = user.totalSessions

  await user.save()
  await streakRecord.save()
}

export default router
