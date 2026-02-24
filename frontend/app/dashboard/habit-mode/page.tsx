"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AttachmentUpload } from "@/components/attachment-upload"
import { APIClient } from "@/lib/api-client"
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle, Flame, TrendingUp, Link as LinkIcon, FileText, Calendar, X } from "lucide-react"

type Task = {
  _id: string
  title: string
  description: string
  duration: number
  category: string
  assignedDate: string
  deadline?: string
  completed: boolean
  completedAt: string | null
  attachments?: Array<{
    _id: string
    type: "file" | "link"
    name: string
    url: string
    uploadedAt: string
  }>
  distributedAcrossDays?: Array<{
    date: string
    portion: number
    completed: boolean
  }>
  proctoredMode?: boolean
}

type ViewType = "daily" | "monthly"

type YoutubeRoutineDay = {
  day: number
  date: string
  taskCount: number
  videos: Array<{
    videoId: string
    title: string
    url: string
    publishedAt: string | null
  }>
}

export default function HabitModePlannerPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewType>("daily")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDuration, setNewTaskDuration] = useState("25")
  const [newTaskCategory, setNewTaskCategory] = useState("other")
  const [currentStreak, setCurrentStreak] = useState(0)
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalDuration: 0,
    completedDuration: 0,
  })
  const [dailyStats, setDailyStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalDuration: 0,
    completedDuration: 0,
  })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [deadline, setDeadline] = useState("")
  const [showDeadlineModal, setShowDeadlineModal] = useState(false)
  const [proctoredMode, setProctoredMode] = useState(false)
  const [showDistributionModal, setShowDistributionModal] = useState(false)
  const [distributionDays, setDistributionDays] = useState<Array<{ date: string; portion: number }>>([{ date: "", portion: 50 }, { date: "", portion: 50 }])
  const [playlistUrlOrId, setPlaylistUrlOrId] = useState("")
  const [routineDays, setRoutineDays] = useState("7")
  const [routineStartDate, setRoutineStartDate] = useState(new Date().toISOString().split("T")[0])
  const [routineDurationPerVideo, setRoutineDurationPerVideo] = useState("25")
  const [routineLoading, setRoutineLoading] = useState(false)
  const [routineError, setRoutineError] = useState("")
  const [youtubeRoutine, setYoutubeRoutine] = useState<YoutubeRoutineDay[]>([])
  const [routinePlaylistTitle, setRoutinePlaylistTitle] = useState("")
  const [routineCreatedCount, setRoutineCreatedCount] = useState(0)
  const [showYoutubePlanner, setShowYoutubePlanner] = useState(false)

  // Fetch user streak on mount
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/habit/streak`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        setCurrentStreak(data.currentStreak)
      } catch (error) {
        console.error("Failed to fetch streak:", error)
      }
    }
    fetchStreak()
  }, [])

  // Fetch tasks whenever date or view changes
  useEffect(() => {
    if (view === "daily") {
      fetchDailyTasks()
    } else {
      fetchMonthlyTasks()
    }
  }, [currentDate, view])

  const fetchDailyTasks = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const dateStr = currentDate.toISOString().split("T")[0]
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/daily?date=${dateStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()
      setTasks(data.tasks)
      setDailyStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch daily tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyTasks = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const monthStr = currentDate.toISOString().slice(0, 7)
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/monthly?month=${monthStr}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()
      setTasks(data.tasks)
      setMonthlyStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch monthly tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const assignedDate = currentDate.toISOString().split("T")[0]
      const monthYear = currentDate.toISOString().slice(0, 7)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newTaskTitle,
            description: "",
            duration: Number(newTaskDuration),
            category: newTaskCategory,
            assignedDate,
            monthYear,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to create task")

      setNewTaskTitle("")
      setNewTaskDuration("25")
      setNewTaskCategory("other")

      // Refetch tasks
      if (view === "daily") {
        fetchDailyTasks()
      } else {
        fetchMonthlyTasks()
      }
    } catch (error) {
      console.error("Failed to add task:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = completed ? `/plan/task/${taskId}/uncomplete` : `/plan/task/${taskId}/complete`

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error("Failed to update task")

      const data = await response.json()
      
      // If streak was updated, refresh the display
      if (data.streakUpdated) {
        setCurrentStreak(data.currentStreak)
      }

      // Refetch tasks
      if (view === "daily") {
        fetchDailyTasks()
      } else {
        fetchMonthlyTasks()
      }
    } catch (error) {
      console.error("Failed to toggle task:", error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${taskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error("Failed to delete task")

      // Refetch tasks
      if (view === "daily") {
        fetchDailyTasks()
      } else {
        fetchMonthlyTasks()
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const goToPreviousDay = () => {
    const prev = new Date(currentDate)
    prev.setDate(prev.getDate() - 1)
    setCurrentDate(prev)
  }

  const goToNextDay = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 1)
    setCurrentDate(next)
  }

  const goToPreviousMonth = () => {
    const prev = new Date(currentDate)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentDate(prev)
  }

  const goToNextMonth = () => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    setCurrentDate(next)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const setTaskDeadline = async () => {
    if (!selectedTask || !deadline) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${selectedTask._id}/deadline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deadline,
            proctoredSettings: proctoredMode ? {
              disableCopyPaste: true,
              requireFullScreen: true,
              trackActivity: true,
            } : undefined,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to set deadline")

      // Update selected task
      const updated = await response.json()
      setSelectedTask(updated)
      setShowDeadlineModal(false)

      // Refetch tasks
      if (view === "daily") {
        fetchDailyTasks()
      } else {
        fetchMonthlyTasks()
      }
    } catch (error) {
      console.error("Failed to set deadline:", error)
    }
  }

  const openAttachmentProctored = async (taskId: string, attachmentId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${taskId}/proctored/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ attachmentId }),
        }
      )

      if (!response.ok) throw new Error("Failed to start proctored session")

      // Redirect to proctored viewer
      router.push(`/dashboard/habit-mode/proctored?taskId=${taskId}&attachmentId=${attachmentId}`)
    } catch (error) {
      console.error("Failed to open attachment:", error)
    }
  }

  const saveTaskDistribution = async () => {
    if (!selectedTask) return

    // Validate portions sum to 100
    const totalPortion = distributionDays.reduce((sum, day) => sum + day.portion, 0)
    if (Math.abs(totalPortion - 100) > 0.01) {
      alert("Distribution portions must sum to 100%")
      return
    }

    // Validate all dates are filled
    if (distributionDays.some(day => !day.date)) {
      alert("Please fill in all dates")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${selectedTask._id}/distribute`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            distributedAcrossDays: distributionDays,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to save distribution")

      // Close modal and refresh
      setShowDistributionModal(false)
      setSelectedTask(null)
      
      if (view === "daily") {
        fetchDailyTasks()
      } else {
        fetchMonthlyTasks()
      }
    } catch (error) {
      console.error("Failed to save distribution:", error)
      alert("Failed to save distribution")
    }
  }

  const addDistributionDay = () => {
    setDistributionDays([...distributionDays, { date: "", portion: 0 }])
  }

  const removeDistributionDay = (index: number) => {
    if (distributionDays.length > 1) {
      setDistributionDays(distributionDays.filter((_, i) => i !== index))
    }
  }

  const updateDistributionDay = (index: number, field: "date" | "portion", value: string | number) => {
    const updated = [...distributionDays]
    if (field === "date") {
      updated[index].date = value as string
    } else {
      updated[index].portion = Number(value)
    }
    setDistributionDays(updated)
  }

  const generateYoutubeRoutine = async () => {
    if (!playlistUrlOrId.trim()) {
      setRoutineError("Please enter a YouTube playlist URL or playlist ID")
      return
    }

    setRoutineLoading(true)
    setRoutineError("")
    setRoutineCreatedCount(0)

    try {
      const response = await APIClient.post<{
        playlist: { title: string }
        studyPlan: YoutubeRoutineDay[]
      }>("/plan/youtube-playlist/routine", {
        playlistUrlOrId,
        days: Number(routineDays),
        startDate: routineStartDate,
        createTasks: false,
      })

      setYoutubeRoutine(response.studyPlan)
      setRoutinePlaylistTitle(response.playlist.title)
    } catch (error) {
      setYoutubeRoutine([])
      setRoutinePlaylistTitle("")
      setRoutineError(error instanceof Error ? error.message : "Failed to generate playlist routine")
    } finally {
      setRoutineLoading(false)
    }
  }

  const createRoutineTasks = async () => {
    if (!playlistUrlOrId.trim()) {
      setRoutineError("Please enter a YouTube playlist URL or playlist ID")
      return
    }

    const parsedDuration = Number(routineDurationPerVideo)
    if (!parsedDuration || parsedDuration < 1) {
      setRoutineError("Minutes per video must be at least 1")
      return
    }

    setRoutineLoading(true)
    setRoutineError("")

    try {
      const response = await APIClient.post<{
        playlist: { title: string }
        studyPlan: YoutubeRoutineDay[]
        createdTasksCount: number
      }>("/plan/youtube-playlist/routine", {
        playlistUrlOrId,
        days: Number(routineDays),
        startDate: routineStartDate,
        createTasks: true,
        durationPerVideo: parsedDuration,
      })

      setYoutubeRoutine(response.studyPlan)
      setRoutinePlaylistTitle(response.playlist.title)
      setRoutineCreatedCount(response.createdTasksCount || 0)

      if (view === "daily") {
        fetchDailyTasks()
      } else {
        fetchMonthlyTasks()
      }
    } catch (error) {
      setRoutineError(error instanceof Error ? error.message : "Failed to create tasks")
    } finally {
      setRoutineLoading(false)
    }
  }

  const categoryColors = {
    coding: "bg-blue-500/20 text-blue-200",
    reading: "bg-purple-500/20 text-purple-200",
    writing: "bg-amber-500/20 text-amber-200",
    "problem-solving": "bg-green-500/20 text-green-200",
    project: "bg-cyan-500/20 text-cyan-200",
    review: "bg-pink-500/20 text-pink-200",
    other: "bg-slate-500/20 text-slate-200",
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-[#070b14] pt-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-500/30 to-cyan-500/0 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-500/20 to-violet-600/0 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 flex flex-col min-h-[calc(100vh-16px)]">
        {/* Header with back button and streak */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-white/15 hover:bg-white/10 text-white"
              onClick={() => router.back()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100">Habit Planner</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/6 border border-white/15 backdrop-blur-xl">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs md:text-sm font-semibold text-slate-100">{currentStreak} day streak</span>
          </div>
        </motion.div>

        {/* View toggle buttons */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-3"
        >
          <Button
            variant={view === "daily" ? "default" : "outline"}
            onClick={() => setView("daily")}
            className={view === "daily" ? "bg-gradient-to-r from-violet-500 to-pink-500 border-0" : "border-white/15 text-white"}
          >
            Daily Plan
          </Button>
          <Button
            variant={view === "monthly" ? "default" : "outline"}
            onClick={() => setView("monthly")}
            className={view === "monthly" ? "bg-gradient-to-r from-violet-500 to-pink-500 border-0" : "border-white/15 text-white"}
          >
            Monthly Plan
          </Button>
        </motion.div>

        {/* Date navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-white/6 border border-white/15 backdrop-blur-xl"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={view === "daily" ? goToPreviousDay : goToPreviousMonth}
            className="hover:bg-white/10 text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <p className="text-sm text-slate-300">
              {view === "daily"
                ? currentDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
            </p>
          </div>

          <div className="flex gap-2">
           
            <Button
              variant="ghost"
              size="icon"
              onClick={view === "daily" ? goToNextDay : goToNextMonth}
              className="hover:bg-white/10 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Stats panel */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3"
        >
          <Card className="bg-white/6 border border-white/15 backdrop-blur-xl p-2.5">
            <p className="text-xs text-slate-400 mb-1">Total Tasks</p>
            <p className="text-lg font-bold text-slate-100">
              {view === "daily" ? dailyStats.total : monthlyStats.total}
            </p>
          </Card>
          <Card className="bg-white/6 border border-white/15 backdrop-blur-xl p-2.5">
            <p className="text-xs text-slate-400 mb-1">Completed</p>
            <p className="text-lg font-bold text-green-400">
              {view === "daily" ? dailyStats.completed : monthlyStats.completed}
            </p>
          </Card>
          <Card className="bg-white/6 border border-white/15 backdrop-blur-xl p-2.5">
            <p className="text-xs text-slate-400 mb-1">Pending</p>
            <p className="text-lg font-bold text-amber-400">
              {view === "daily" ? dailyStats.pending : monthlyStats.pending}
            </p>
          </Card>
          <Card className="bg-white/6 border border-white/15 backdrop-blur-xl p-2.5">
            <p className="text-xs text-slate-400 mb-1">Duration</p>
            <p className="text-lg font-bold text-cyan-400">
              {view === "daily"
                ? `${dailyStats.completedDuration}/${dailyStats.totalDuration}m`
                : `${monthlyStats.completedDuration}/${monthlyStats.totalDuration}m`}
            </p>
          </Card>
        </motion.div>

        {/* Add task form */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-3 p-3 rounded-lg bg-white/6 border border-white/15 backdrop-blur-xl"
        >
          <p className="text-xs text-slate-400 mb-2 font-semibold">ADD NEW TASK</p>
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Task title (e.g., Complete Math Problems)"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-slate-900/45 border-white/15 text-slate-100 placeholder:text-slate-500 flex-1"
              />
              <Input
                type="number"
                placeholder="25"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(e.target.value)}
                min="5"
                max="240"
                className="bg-slate-900/45 border-white/15 text-slate-100 w-20"
              />
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="bg-slate-900/45 border border-white/15 text-slate-100 rounded-md px-3 h-9 text-sm"
              >
                <option value="coding">Coding</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
                <option value="problem-solving">Problem-solving</option>
                <option value="project">Project</option>
                <option value="review">Review</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button
              onClick={addTask}
              disabled={loading || !newTaskTitle.trim()}
              className="bg-gradient-to-r from-violet-500 to-pink-500 border-0 gap-2 h-9 text-sm md:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-3"
        >
          <Button
            onClick={() => setShowYoutubePlanner((prev) => !prev)}
            variant="outline"
            className="w-full border-white/15 text-slate-100 hover:bg-white/10 h-9 text-sm"
          >
            {showYoutubePlanner ? "Hide Playlist Planner" : "Show Playlist Planner"}
          </Button>

          {showYoutubePlanner && (
            <div className="mt-2 p-3 rounded-lg bg-white/6 border border-white/15 backdrop-blur-xl">
              <p className="text-xs text-slate-400 mb-2 font-semibold">YOUTUBE PLAYLIST STUDY ROUTINE</p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                <Input
                  placeholder="Playlist URL or ID"
                  value={playlistUrlOrId}
                  onChange={(e) => setPlaylistUrlOrId(e.target.value)}
                  className="bg-slate-900/45 border-white/15 text-slate-100 placeholder:text-slate-500 md:col-span-2"
                />
                <Input
                  type="number"
                  min="1"
                  max="365"
                  placeholder="Days"
                  value={routineDays}
                  onChange={(e) => setRoutineDays(e.target.value)}
                  className="bg-slate-900/45 border-white/15 text-slate-100"
                />
                <Input
                  type="date"
                  value={routineStartDate}
                  onChange={(e) => setRoutineStartDate(e.target.value)}
                  className="bg-slate-900/45 border-white/15 text-slate-100"
                />
                <Input
                  type="number"
                  min="1"
                  max="600"
                  placeholder="Minutes/video"
                  value={routineDurationPerVideo}
                  onChange={(e) => setRoutineDurationPerVideo(e.target.value)}
                  className="bg-slate-900/45 border-white/15 text-slate-100"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <Button
                  onClick={generateYoutubeRoutine}
                  disabled={routineLoading || !playlistUrlOrId.trim()}
                  className="bg-gradient-to-r from-violet-500 to-pink-500 border-0 h-9 text-sm"
                >
                  Generate Routine
                </Button>
                <Button
                  onClick={createRoutineTasks}
                  disabled={routineLoading || !playlistUrlOrId.trim()}
                  variant="outline"
                  className="border-white/15 text-slate-100 hover:bg-white/10 h-9 text-sm"
                >
                  Create Tasks from Routine
                </Button>
              </div>

              {routineError && <p className="text-xs text-red-400 mb-2">{routineError}</p>}
              {routineLoading && <p className="text-xs text-slate-400 mb-2">Generating playlist routine...</p>}
              {routinePlaylistTitle && (
                <p className="text-xs text-cyan-300 mb-2">
                  Playlist: {routinePlaylistTitle}
                  {routineCreatedCount > 0 ? ` • ${routineCreatedCount} tasks created` : ""}
                </p>
              )}

              {youtubeRoutine.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {youtubeRoutine.map((dayPlan) => (
                    <div key={`${dayPlan.day}-${dayPlan.date}`} className="p-2 rounded bg-white/5 border border-white/10">
                      <p className="text-xs text-slate-200 font-semibold mb-1">
                        Day {dayPlan.day} • {new Date(dayPlan.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {dayPlan.taskCount} videos
                      </p>
                      <div className="space-y-1">
                        {dayPlan.videos.map((video) => (
                          <a
                            key={video.videoId}
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-xs text-slate-300 hover:text-cyan-300 truncate"
                          >
                            • {video.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Tasks list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-1 min-h-0"
        >
          <div className="h-full overflow-y-auto pr-1 space-y-2 pb-2">
            {loading ? (
              <p className="text-center text-slate-400 py-8">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="text-center py-10 rounded-lg bg-white/6 border border-white/15 backdrop-blur-xl">
                <TrendingUp className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-slate-400">No tasks {view === "daily" ? "today" : "this month"}</p>
                <p className="text-xs text-slate-500 mt-1">Add your first task to get started</p>
              </div>
            ) : (
              tasks.map((task) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-2.5 rounded-lg border backdrop-blur-xl transition-all ${
                    task.completed
                      ? "bg-white/3 border-white/10"
                      : "bg-white/6 border-white/15 hover:bg-white/10"
                  }`}
                >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskComplete(task._id, task.completed)}
                    className="mt-0.5 flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 hover:text-slate-300" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        task.completed ? "text-slate-400 line-through" : "text-slate-100"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[task.category as keyof typeof categoryColors]}`}>
                        {task.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {task.duration}m
                      </span>
                      {task.deadline && (
                        <span className="text-xs flex items-center gap-1 text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {task.attachments && task.attachments.length > 0 && (
                        <span className="text-xs flex items-center gap-1 text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                          <FileText className="w-3 h-3" />
                          {task.attachments.length}
                        </span>
                      )}
                    </div>

                    {task.attachments && task.attachments.length > 0 && (
                      <div className="mt-1.5 flex gap-1 flex-wrap">
                        {task.attachments.slice(0, 3).map((attachment) => (
                          <button
                            key={attachment._id}
                            onClick={() => openAttachmentProctored(task._id, attachment._id)}
                            className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                          >
                            {attachment.type === "link" ? (
                              <LinkIcon className="w-3 h-3" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {attachment.name}
                          </button>
                        ))}
                        {task.attachments.length > 3 && (
                          <span className="text-xs px-2 py-1 text-slate-400">+{task.attachments.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedTask(task)
                        setDeadline(task.deadline || "")
                        setShowDeadlineModal(true)
                      }}
                      className="p-1 hover:bg-cyan-500/20 rounded opacity-40 hover:opacity-100 transition-all"
                      title="Set deadline"
                    >
                      <Calendar className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTask(task)
                        setDistributionDays(task.distributedAcrossDays?.map(d => ({ date: d.date, portion: d.portion })) || [{ date: "", portion: 50 }, { date: "", portion: 50 }])
                        setShowDistributionModal(true)
                      }}
                      className="p-1 hover:bg-purple-500/20 rounded opacity-40 hover:opacity-100 transition-all"
                      title="Distribute across days"
                    >
                      <Plus className="w-4 h-4 text-purple-400" />
                    </button>
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="p-1 hover:bg-red-500/20 rounded opacity-40 hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Deadline modal */}
      {showDeadlineModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/15 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-slate-100 mb-4">{selectedTask.title}</h2>
            
            <div className="space-y-4">
              {/* Deadline section */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold">DEADLINE</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-800 border border-white/15 rounded px-3 py-2 text-slate-100 text-sm"
                />
              </div>

              {/* Proctored mode toggle */}
              <div className="flex items-center gap-3 p-3 rounded bg-white/6 border border-white/10">
                <input
                  type="checkbox"
                  id="proctored"
                  checked={proctoredMode}
                  onChange={(e) => setProctoredMode(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <label htmlFor="proctored" className="text-xs text-slate-200 cursor-pointer flex-1">
                  <span className="font-semibold block">Proctored Mode</span>
                  <span className="text-slate-400">Disable copy/paste and require fullscreen</span>
                </label>
              </div>

              {/* Attachments section */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold">ATTACHMENTS ({selectedTask.attachments?.length || 0})</label>
                
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div className="space-y-2 mb-3 p-3 rounded bg-white/6 border border-white/10 max-h-40 overflow-y-auto">
                    {selectedTask.attachments.map((att) => (
                      <div key={att._id} className="flex items-center justify-between text-xs p-2 rounded bg-white/3 border border-white/5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {att.type === "link" ? (
                            <LinkIcon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          )}
                          <span className="text-slate-200 truncate">{att.name}</span>
                        </div>
                        <button
                          onClick={async () => {
                            const token = localStorage.getItem("token")
                            await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/plan/task/${selectedTask._id}/attachment/${att._id}`,
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            )
                            if (view === "daily") {
                              fetchDailyTasks()
                            } else {
                              fetchMonthlyTasks()
                            }
                            setSelectedTask(null)
                            setShowDeadlineModal(false)
                          }}
                          className="text-red-400 hover:text-red-300 flex-shrink-0 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTask._id && <AttachmentUpload 
                  taskId={selectedTask._id} 
                  onAttachmentAdded={() => {
                    if (view === "daily") {
                      fetchDailyTasks()
                    } else {
                      fetchMonthlyTasks()
                    }
                  }} 
                />}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeadlineModal(false)
                    setSelectedTask(null)
                    setDeadline("")
                    setProctoredMode(false)
                  }}
                  className="border-white/15 flex-1 h-9"
                >
                  Close
                </Button>
                <Button
                  onClick={setTaskDeadline}
                  disabled={!deadline}
                  className="bg-gradient-to-r from-violet-500 to-pink-500 border-0 flex-1 h-9"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Distribution modal */}
      {showDistributionModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/15 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-slate-100 mb-1">{selectedTask.title}</h2>
            <p className="text-xs text-slate-400 mb-4">Split task across multiple days</p>
            
            <div className="space-y-3">
              {/* Distribution summary */}
              {distributionDays.length > 0 && (
                <div className="p-3 rounded bg-white/6 border border-white/10">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Total:</span>
                    <span className={`font-semibold ${
                      Math.abs(distributionDays.reduce((sum, day) => sum + day.portion, 0) - 100) < 0.01
                        ? "text-green-400"
                        : "text-red-400"
                    }`}>
                      {distributionDays.reduce((sum, day) => sum + day.portion, 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        Math.abs(distributionDays.reduce((sum, day) => sum + day.portion, 0) - 100) < 0.01
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-red-500 to-orange-500"
                      }`}
                      style={{ width: `${Math.min(distributionDays.reduce((sum, day) => sum + day.portion, 0), 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Distribution days */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {distributionDays.map((day, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 rounded bg-white/6 border border-white/10">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-slate-400 block">Date</label>
                      <input
                        type="date"
                        value={day.date}
                        onChange={(e) => updateDistributionDay(index, "date", e.target.value)}
                        className="w-full bg-slate-800 border border-white/15 rounded px-2 py-1.5 text-slate-100 text-xs"
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <label className="text-xs text-slate-400 block">%</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={day.portion}
                        onChange={(e) => updateDistributionDay(index, "portion", e.target.value)}
                        className="w-full bg-slate-800 border border-white/15 rounded px-2 py-1.5 text-slate-100 text-xs"
                      />
                    </div>
                    {distributionDays.length > 1 && (
                      <button
                        onClick={() => removeDistributionDay(index)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors flex-shrink-0 mb-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add day button */}
              <Button
                onClick={addDistributionDay}
                variant="outline"
                className="w-full border-white/15 text-slate-200 hover:bg-white/10 h-8 text-xs gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Day
              </Button>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDistributionModal(false)
                    setSelectedTask(null)
                  }}
                  className="border-white/15 flex-1 h-9"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveTaskDistribution}
                  disabled={Math.abs(distributionDays.reduce((sum, day) => sum + day.portion, 0) - 100) > 0.01 || distributionDays.some(d => !d.date)}
                  className="bg-gradient-to-r from-violet-500 to-pink-500 border-0 flex-1 h-9"
                >
                  Save Distribution
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  )
}