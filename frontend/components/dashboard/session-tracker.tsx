"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SessionTracker({ user }: { user: any }) {
  const [duration, setDuration] = useState("")
  const [mode, setMode] = useState("habit")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogSession = async () => {
    if (mode === "habit") {
      router.push("/dashboard/habit-mode")
      return
    }

    const parsedDuration = Number.parseInt(duration)
    if (!parsedDuration || parsedDuration < 1) {
      setError("Please enter a valid duration in minutes")
      return
    }

    setLoading(true)
    setSuccess("")
    setError("")
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/habit/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration: parsedDuration, mode }),
      })

      if (!response.ok) throw new Error("Failed to log session")

      setSuccess("Session logged successfully!")
      setDuration("")

      setTimeout(() => {
        router.refresh()
      }, 1500)

      // your current "log session" API / save logic for normal mode
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log session")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const modes = [
    { value: "habit", label: "Habit Mode", color: "from-blue-500 via-indigo-500 to-purple-500" },
    { value: "deep", label: "Deep Mode", color: "from-purple-500 via-pink-500 to-rose-500" },
    { value: "quiz", label: "Quiz Mode", color: "from-emerald-500 via-teal-500 to-cyan-500" },
    { value: "recall", label: "Recall Mode", color: "from-amber-500 via-orange-500 to-red-500" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full border border-white/15 bg-white/6 backdrop-blur-xl shadow-[0_14px_45px_rgba(0,0,0,0.45)] overflow-hidden group relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-rose-500/10" />
        
        <CardHeader className="relative z-10 pb-2 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-slate-100 font-bold">Log Today's Session</CardTitle>
              <CardDescription className="text-slate-300 mt-1 text-xs font-semibold">Track your daily focus time and build your streak 🎯</CardDescription>
            </div>
            <motion.div 
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="p-2 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-lg shadow-lg"
            >
              <Zap size={22} className="text-white drop-shadow-lg" />
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10 pt-0 pb-4">
          {/* Mode Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-200">Learning Mode</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {modes.map((m) => (
                <motion.button
                  key={m.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode(m.value)}
                  className={`p-1.5 rounded-md font-bold text-xs transition-all duration-300 ${
                    mode === m.value
                      ? `bg-gradient-to-r ${m.color} text-white shadow-lg`
                      : "bg-slate-900/40 border border-white/15 text-slate-200 hover:border-violet-300/40"
                  }`}
                >
                  {m.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Duration Input */}
          {mode !== "habit" ? (
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs font-bold text-slate-200">Duration (minutes)</Label>
              <div className="relative">
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-slate-900/45 border border-white/20 text-slate-100 placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 text-sm font-semibold h-9"
                  min="1"
                />
                <motion.div
                  animate={{ opacity: duration ? 1 : 0 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Zap size={20} className="text-purple-500" />
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-indigo-300/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
              Habit Mode runs with your planner flow. Click below to open the full planner.
            </div>
          )}

          {/* Feedback Messages */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-green-100 border-2 border-green-500 rounded-lg flex gap-2 items-start"
            >
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5 font-bold" />
              <p className="text-green-700 font-bold text-sm">{success}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-100 border-2 border-red-500 rounded-lg flex gap-2 items-start"
            >
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5 font-bold" />
              <p className="text-red-700 font-bold text-sm">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleLogSession}
              disabled={loading || (mode !== "habit" && !duration)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-9 text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                  ⏳
                </motion.div>
              ) : (
                mode === "habit" ? "Open Habit Mode" : "Log Session"
              )}
            </Button>
          </motion.div>

        
        </CardContent>
      </Card>
    </motion.div>
  )
}
