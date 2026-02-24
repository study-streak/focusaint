import express from "express"
import mongoose from "mongoose"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import HabitTask from "../models/HabitTask.js"
import User from "../models/User.js"
import StreakRecord from "../models/StreakRecord.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isVercel = Boolean(process.env.VERCEL)
const uploadsDir = isVercel ? path.join("/tmp", "uploads") : path.join(__dirname, "..", "uploads")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const safeBase = path
      .parse(file.originalname)
      .name
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
    const ext = path.extname(file.originalname) || ""
    cb(null, `${Date.now()}-${safeBase}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
})

function decodeXmlEntities(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function getPlaylistId(input = "") {
  const trimmed = String(input).trim()
  if (!trimmed) return null

  if (/^PL[\w-]+$/i.test(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const list = url.searchParams.get("list")
    if (list) return list
  } catch (_error) {
    return null
  }

  return null
}

function parsePlaylistFeed(xml = "") {
  const feedTitleMatch = xml.match(/<title>([\s\S]*?)<\/title>/)
  const feedTitle = feedTitleMatch ? decodeXmlEntities(feedTitleMatch[1].trim()) : "YouTube Playlist"

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  const videos = []
  let match

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]
    const videoIdMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/)
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
    const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/)

    if (!videoIdMatch || !titleMatch) continue

    const videoId = videoIdMatch[1].trim()
    const title = decodeXmlEntities(titleMatch[1].trim())
    const publishedAt = publishedMatch ? publishedMatch[1].trim() : null

    videos.push({
      videoId,
      title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt,
    })
  }

  return {
    feedTitle,
    videos,
  }
}

function buildStudyRoutine(videos = [], startDate, days) {
  const routine = []
  const parsedStartDate = new Date(startDate)

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const date = new Date(parsedStartDate)
    date.setDate(parsedStartDate.getDate() + dayIndex)
    routine.push({
      day: dayIndex + 1,
      date: date.toISOString().split("T")[0],
      videos: [],
    })
  }

  videos.forEach((video, index) => {
    const dayIndex = index % days
    routine[dayIndex].videos.push(video)
  })

  return routine.map((item) => ({
    ...item,
    taskCount: item.videos.length,
  }))
}

/**
 * CREATE: Add a new task to monthly/daily plan
 * POST /plan/task
 * Body: { title, description?, duration, category, assignedDate (YYYY-MM-DD), monthYear (YYYY-MM) }
 */
router.post("/task", authenticateToken, async (req, res) => {
  try {
    const { title, description, duration, category, assignedDate, monthYear } = req.body

    if (!title || !assignedDate || !monthYear || !duration) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const task = await HabitTask.create({
      userId: req.user.userId,
      title,
      description: description || "",
      duration: Number(duration),
      category: category || "other",
      assignedDate,
      monthYear,
      completed: false,
    })

    res.status(201).json({
      message: "Task created",
      task,
    })
  } catch (error) {
    console.error("Create task error:", error)
    res.status(500).json({ error: "Failed to create task" })
  }
})

/**
 * READ: Get all tasks for a specific date (daily plan)
 * GET /plan/daily?date=YYYY-MM-DD
 */
router.get("/daily", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: "Date parameter required (YYYY-MM-DD)" })
    }

    const tasks = await HabitTask.find({
      userId: req.user.userId,
      assignedDate: date,
    }).sort({ createdAt: 1 })

    const completedTasks = tasks.filter((t) => t.completed).length
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0)
    const completedDuration = tasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + t.duration, 0)

    res.json({
      date,
      tasks,
      stats: {
        total: tasks.length,
        completed: completedTasks,
        pending: tasks.length - completedTasks,
        totalDuration,
        completedDuration,
      },
    })
  } catch (error) {
    console.error("Get daily tasks error:", error)
    res.status(500).json({ error: "Failed to fetch daily tasks" })
  }
})

/**
 * READ: Get all tasks for a specific month (monthly plan)
 * GET /plan/monthly?month=YYYY-MM
 */
router.get("/monthly", authenticateToken, async (req, res) => {
  try {
    const { month } = req.query

    if (!month) {
      return res.status(400).json({ error: "Month parameter required (YYYY-MM)" })
    }

    const tasks = await HabitTask.find({
      userId: req.user.userId,
      monthYear: month,
    }).sort({ assignedDate: 1 })

    // Group tasks by assigned date
    const tasksByDay = {}
    tasks.forEach((task) => {
      if (!tasksByDay[task.assignedDate]) {
        tasksByDay[task.assignedDate] = []
      }
      tasksByDay[task.assignedDate].push(task)
    })

    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      pending: tasks.filter((t) => !t.completed).length,
      totalDuration: tasks.reduce((sum, t) => sum + t.duration, 0),
      completedDuration: tasks
        .filter((t) => t.completed)
        .reduce((sum, t) => sum + t.duration, 0),
      daysWithTasks: Object.keys(tasksByDay).length,
    }

    res.json({
      month,
      tasks,
      tasksByDay,
      stats,
    })
  } catch (error) {
    console.error("Get monthly tasks error:", error)
    res.status(500).json({ error: "Failed to fetch monthly tasks" })
  }
})

/**
 * UPDATE: Mark a task as complete and update streak if completed today
 * PATCH /plan/task/:taskId/complete
 */
router.patch("/task/:taskId/complete", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await HabitTask.findOne({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const today = new Date()
    const todayString = today.toISOString().split("T")[0]

    task.completed = true
    task.completedAt = new Date()
    await task.save()

    // Update streak if task is from today and hasn't already triggered a streak update
    let streakUpdated = false
    if (task.assignedDate === todayString && !task.streakUpdated) {
      await updateStreakFromTask(req.user.userId)
      streakUpdated = true
      task.streakUpdated = true
      await task.save()
    }

    // Fetch updated user data for response
    const user = await User.findById(req.user.userId)

    res.json({
      message: "Task completed",
      task,
      streakUpdated,
      currentStreak: user.currentStreak,
    })
  } catch (error) {
    console.error("Complete task error:", error)
    res.status(500).json({ error: "Failed to complete task" })
  }
})

/**
 * UPDATE: Mark a task as incomplete
 * PATCH /plan/task/:taskId/uncomplete
 */
router.patch("/task/:taskId/uncomplete", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await HabitTask.findOne({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.completed = false
    task.completedAt = null
    // Note: We don't decrement streak here; streaks are tracked per day, not per task
    await task.save()

    res.json({
      message: "Task marked as incomplete",
      task,
    })
  } catch (error) {
    console.error("Uncomplete task error:", error)
    res.status(500).json({ error: "Failed to uncomplete task" })
  }
})

/**
 * UPDATE: Edit an existing task
 * PATCH /plan/task/:taskId
 * Body: { title?, description?, duration?, category?, assignedDate?, monthYear? }
 */
router.patch("/task/:taskId", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const { title, description, duration, category, assignedDate, monthYear } = req.body

    const task = await HabitTask.findOne({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    if (title) task.title = title
    if (description !== undefined) task.description = description
    if (duration) task.duration = Number(duration)
    if (category) task.category = category
    if (assignedDate) task.assignedDate = assignedDate
    if (monthYear) task.monthYear = monthYear

    await task.save()

    res.json({
      message: "Task updated",
      task,
    })
  } catch (error) {
    console.error("Update task error:", error)
    res.status(500).json({ error: "Failed to update task" })
  }
})

/**
 * DELETE: Remove a task
 * DELETE /plan/task/:taskId
 */
router.delete("/task/:taskId", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await HabitTask.findOneAndDelete({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json({
      message: "Task deleted",
      task,
    })
  } catch (error) {
    console.error("Delete task error:", error)
    res.status(500).json({ error: "Failed to delete task" })
  }
})

/**
 * BULK CREATE: Create multiple tasks for a month (create all tasks at once)
 * POST /plan/bulk
 * Body: { monthYear, tasks: [{ title, duration, category, assignedDate }, ...] }
 */
router.post("/bulk", authenticateToken, async (req, res) => {
  try {
    const { monthYear, tasks } = req.body

    if (!monthYear || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Invalid monthYear or tasks array" })
    }

    const preparedTasks = tasks.map((t) => ({
      ...t,
      userId: req.user.userId,
      monthYear,
      duration: Number(t.duration) || 25,
      completed: false,
    }))

    const createdTasks = await HabitTask.insertMany(preparedTasks)

    res.status(201).json({
      message: "Bulk tasks created",
      count: createdTasks.length,
      tasks: createdTasks,
    })
  } catch (error) {
    console.error("Bulk create error:", error)
    res.status(500).json({ error: "Failed to create bulk tasks" })
  }
})

/**
 * YOUTUBE ROUTINE: Build study routine by splitting playlist videos into days
 * POST /plan/youtube-playlist/routine
 * Body: { playlistUrlOrId, days, startDate?, createTasks?, durationPerVideo? }
 */
router.post("/youtube-playlist/routine", authenticateToken, async (req, res) => {
  try {
    const { playlistUrlOrId, days, startDate, createTasks, durationPerVideo } = req.body

    const playlistId = getPlaylistId(playlistUrlOrId)
    const parsedDays = Number(days)
    const parsedDuration = Number(durationPerVideo) || 25
    const start = startDate || new Date().toISOString().split("T")[0]

    if (!playlistId) {
      return res.status(400).json({ error: "Valid YouTube playlist URL or playlist ID is required" })
    }

    if (!parsedDays || parsedDays < 1 || parsedDays > 365) {
      return res.status(400).json({ error: "days must be between 1 and 365" })
    }

    if (Number.isNaN(new Date(start).getTime())) {
      return res.status(400).json({ error: "startDate must be a valid date (YYYY-MM-DD)" })
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`
    const response = await fetch(feedUrl)

    if (!response.ok) {
      return res.status(400).json({ error: "Unable to fetch playlist feed. Check if playlist ID is valid and public." })
    }

    const xml = await response.text()
    const { feedTitle, videos } = parsePlaylistFeed(xml)

    if (videos.length === 0) {
      return res.status(404).json({ error: "No videos found. The playlist may be empty or private." })
    }

    const studyPlan = buildStudyRoutine(videos, start, parsedDays)
    let createdTasks = []

    if (Boolean(createTasks)) {
      const tasksToCreate = studyPlan.flatMap((dayPlan) =>
        dayPlan.videos.map((video) => ({
          userId: req.user.userId,
          title: `Watch: ${video.title}`,
          description: video.url,
          duration: parsedDuration,
          category: "reading",
          assignedDate: dayPlan.date,
          monthYear: dayPlan.date.slice(0, 7),
          completed: false,
        }))
      )

      createdTasks = await HabitTask.insertMany(tasksToCreate)
    }

    res.json({
      message: createTasks ? "Routine generated and tasks created" : "Routine generated",
      playlist: {
        id: playlistId,
        title: feedTitle,
        totalVideos: videos.length,
      },
      days: parsedDays,
      startDate: start,
      durationPerVideo: parsedDuration,
      studyPlan,
      createdTasksCount: createdTasks.length,
    })
  } catch (error) {
    console.error("YouTube routine error:", error)
    res.status(500).json({ error: "Failed to generate playlist routine" })
  }
})

/**
 * Helper: Update streak when a task is completed on its assigned date
 * Only triggers streak update once per day (per user)
 */
async function updateStreakFromTask(userId) {
  const user = await User.findById(userId)
  const streakRecord = await StreakRecord.findOne({ userId })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastActiveDate = streakRecord?.lastActiveDate
  const todayString = today.toISOString().split("T")[0]

  // Check if user has ANY completed task today
  const completedTaskToday = await HabitTask.findOne({
    userId,
    assignedDate: todayString,
    completed: true,
  })

  if (!completedTaskToday) return

  if (!lastActiveDate || lastActiveDate.toDateString() === yesterday.toDateString()) {
    // Increment streak
    user.currentStreak += 1
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak
    }
  } else if (lastActiveDate.toDateString() !== today.toDateString()) {
    // Reset streak (gap day - no activity yesterday)
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

  await user.save()
  await streakRecord.save()
}

/**
 * ATTACHMENTS: Add file or link to task
 * POST /plan/task/:taskId/attachment
 * Body: { type: "file"|"link", name, url, fileSize?, mimeType? }
 */
router.post("/task/:taskId/attachment", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const { type, name, url, fileSize, mimeType } = req.body

    if (!type || !name || !url) {
      return res.status(400).json({ error: "Missing required fields: type, name, url" })
    }

    if (!["file", "link"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'file' or 'link'" })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const attachment = {
      _id: new mongoose.Types.ObjectId(),
      type,
      name,
      url,
      fileSize: fileSize || null,
      mimeType: mimeType || null,
      uploadedAt: new Date(),
      openCount: 0,
    }

    task.attachments.push(attachment)
    await task.save()

    res.status(201).json({
      message: "Attachment added",
      attachment,
      task,
    })
  } catch (error) {
    console.error("Add attachment error:", error)
    res.status(500).json({ error: "Failed to add attachment" })
  }
})

/**
 * ATTACHMENTS: Upload local file and attach to task
 * POST /plan/task/:taskId/attachment/upload
 * FormData: file, name?
 */
router.post("/task/:taskId/attachment/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const { taskId } = req.params
    const customName = req.body?.name
    const uploadedFile = req.file

    if (!uploadedFile) {
      return res.status(400).json({ error: "File is required" })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const attachment = {
      _id: new mongoose.Types.ObjectId(),
      type: "file",
      name: customName || uploadedFile.originalname,
      url: `/uploads/${uploadedFile.filename}`,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
      uploadedAt: new Date(),
      openCount: 0,
    }

    task.attachments.push(attachment)
    await task.save()

    res.status(201).json({
      message: "File uploaded and attached",
      attachment,
      task,
    })
  } catch (error) {
    console.error("Upload attachment error:", error)
    res.status(500).json({ error: "Failed to upload attachment" })
  }
})

/**
 * ATTACHMENTS: Remove file or link from task
 * DELETE /plan/task/:taskId/attachment/:attachmentId
 */
router.delete("/task/:taskId/attachment/:attachmentId", authenticateToken, async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.attachments = task.attachments.filter((a) => a._id.toString() !== attachmentId)
    await task.save()

    res.json({
      message: "Attachment removed",
      task,
    })
  } catch (error) {
    console.error("Remove attachment error:", error)
    res.status(500).json({ error: "Failed to remove attachment" })
  }
})

/**
 * DEADLINE: Set task deadline
 * POST /plan/task/:taskId/deadline
 * Body: { deadline: "YYYY-MM-DD", proctoredMode?: boolean, proctoredSettings?: {...} }
 */
router.post("/task/:taskId/deadline", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const { deadline, proctoredMode, proctoredSettings } = req.body

    if (!deadline) {
      return res.status(400).json({ error: "Deadline required (YYYY-MM-DD)" })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.deadline = deadline
    if (proctoredMode !== undefined) {
      task.proctoredMode = proctoredMode
    }
    if (proctoredSettings) {
      task.proctoredSettings = {
        ...task.proctoredSettings,
        ...proctoredSettings,
      }
    }

    await task.save()

    res.json({
      message: "Deadline set",
      task,
    })
  } catch (error) {
    console.error("Set deadline error:", error)
    res.status(500).json({ error: "Failed to set deadline" })
  }
})

/**
 * DISTRIBUTION: Distribute task across multiple days
 * POST /plan/task/:taskId/distribute
 * Body: { distributedAcrossDays: [{ date: "YYYY-MM-DD", portion: 50 }, ...] }
 */
router.post("/task/:taskId/distribute", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const { distributedAcrossDays } = req.body

    if (!Array.isArray(distributedAcrossDays) || distributedAcrossDays.length === 0) {
      return res.status(400).json({ error: "distributedAcrossDays must be non-empty array" })
    }

    // Validate that portions add up to ~100
    const totalPortion = distributedAcrossDays.reduce((sum, day) => sum + (day.portion || 0), 0)
    if (totalPortion !== 100) {
      return res.status(400).json({ error: `Portions must sum to 100% (got ${totalPortion}%)` })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.distributedAcrossDays = distributedAcrossDays.map((day) => ({
      date: day.date,
      portion: day.portion,
      completed: false,
      completedAt: null,
    }))

    await task.save()

    res.json({
      message: "Task distributed across days",
      task,
    })
  } catch (error) {
    console.error("Distribute task error:", error)
    res.status(500).json({ error: "Failed to distribute task" })
  }
})

/**
 * PROCTORED: Get task with proctored settings
 * GET /plan/task/:taskId/proctored
 */
router.get("/task/:taskId/proctored", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json({
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        attachments: task.attachments,
        deadline: task.deadline,
        proctoredMode: task.proctoredMode,
        proctoredSettings: task.proctoredSettings,
        proctoredSessions: task.proctoredSessions,
      },
    })
  } catch (error) {
    console.error("Get proctored task error:", error)
    res.status(500).json({ error: "Failed to fetch task" })
  }
})

/**
 * PROCTORED: Start proctored session
 * POST /plan/task/:taskId/proctored/start
 * Body: { attachmentId: "id" }
 */
router.post("/task/:taskId/proctored/start", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const { attachmentId } = req.body

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const attachment = task.attachments.find((a) => a._id.toString() === attachmentId)
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" })
    }

    // Mark attachment as opened
    if (!attachment.openedAt) {
      attachment.openedAt = new Date()
    }
    attachment.openCount += 1

    // Create session record
    const session = {
      startedAt: new Date(),
      endedAt: null,
      duration: null,
      attachmentId,
      violations: [],
    }

    task.proctoredSessions.push(session)
    await task.save()

    res.json({
      message: "Proctored session started",
      sessionId: session._id || session.startedAt.getTime(),
      sessionStartTime: session.startedAt,
      proctoredSettings: task.proctoredSettings,
    })
  } catch (error) {
    console.error("Start proctored session error:", error)
    res.status(500).json({ error: "Failed to start proctored session" })
  }
})

/**
 * PROCTORED: End proctored session and log violations
 * POST /plan/task/:taskId/proctored/end
 * Body: { attachmentId: "id", violations?: ["violation1", "violation2"], duration?: minutes }
 */
router.post("/task/:taskId/proctored/end", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params
    const { attachmentId, violations, duration } = req.body

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    // Find the last session for this attachment
    const session = task.proctoredSessions[task.proctoredSessions.length - 1]
    if (!session) {
      return res.status(404).json({ error: "No active session found" })
    }

    session.endedAt = new Date()
    session.duration = duration || Math.round((session.endedAt - session.startedAt) / 60000)
    session.violations = violations || []

    await task.save()

    res.json({
      message: "Proctored session ended",
      session,
      violationCount: session.violations.length,
    })
  } catch (error) {
    console.error("End proctored session error:", error)
    res.status(500).json({ error: "Failed to end proctored session" })
  }
})

export default router
