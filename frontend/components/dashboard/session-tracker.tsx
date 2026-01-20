"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Zap } from "lucide-react"

export default function SessionTracker({ user }: { user: any }) {
  const [duration, setDuration] = useState("")
  const [mode, setMode] = useState("habit")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleStartSession = async () => {
    if (!duration) return

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
        body: JSON.stringify({ duration: Number.parseInt(duration), mode }),
      })

      if (!response.ok) throw new Error("Failed to log session")

      setSuccess("Session logged successfully!")
      setDuration("")

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log session")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const modes = [
    { value: "habit", label: "Habit Mode", color: "from-blue-500 to-cyan-500" },
    { value: "deep", label: "Deep Mode", color: "from-purple-500 to-pink-500" },
    { value: "quiz", label: "Quiz Mode", color: "from-green-500 to-emerald-500" },
    { value: "recall", label: "Recall Mode", color: "from-amber-500 to-orange-500" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-3 border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-300/0 via-purple-200/10 to-pink-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-purple-700 font-bold">Log Today's Session</CardTitle>
              <CardDescription className="text-gray-600 mt-2 font-semibold">Track your daily focus time and build your streak</CardDescription>
            </div>
            <motion.div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg">
              <Zap size={28} className="text-white" />
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-lg font-bold text-gray-800">Learning Mode</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {modes.map((m) => (
                <motion.button
                  key={m.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode(m.value)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all duration-300 ${
                    mode === m.value
                      ? `bg-gradient-to-r ${m.color} text-white shadow-lg`
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {m.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Duration Input */}
          <div className="space-y-3">
            <Label htmlFor="duration" className="text-lg font-bold text-gray-800">Duration (minutes)</Label>
            <div className="relative">
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-300 text-lg font-semibold py-2"
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

          {/* Feedback Messages */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-100 border-2 border-green-500 rounded-lg flex gap-3 items-start"
            >
              <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 mt-0.5 font-bold" />
              <p className="text-green-700 font-bold text-lg">{success}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-100 border-2 border-red-500 rounded-lg flex gap-3 items-start"
            >
              <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5 font-bold" />
              <p className="text-red-700 font-bold text-lg">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleStartSession}
              disabled={loading || !duration}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                  ⏳
                </motion.div>
              ) : (
                "Log Session"
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
