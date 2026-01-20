"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import StreakCard from "@/components/dashboard/streak-card"
import SessionTracker from "@/components/dashboard/session-tracker"
import AnalyticsChart from "@/components/dashboard/analytics-chart"
import { Flame, Clock, Target, TrendingUp, Zap } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!userRes.ok) throw new Error("Failed to fetch user data")

        const userData = await userRes.json()
        setUser(userData.user || userData)

        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/habit/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!statsRes.ok) throw new Error("Failed to fetch stats")

        const statsData = await statsRes.json()
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mounted, router])

  // Don't render loading/error until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 relative overflow-hidden" />
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-16 h-16"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-md opacity-60" />
          <div className="absolute inset-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-sm opacity-40" />
          <div className="absolute inset-4 bg-white rounded-full" />
        </motion.div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 flex items-center justify-center px-4">
        <motion.div
          className="bg-red-100 border-2 border-red-500 rounded-xl p-8 max-w-md text-center"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-700 font-semibold text-lg">{error}</p>
        </motion.div>
      </main>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const statCards = [
    { icon: Flame, title: "Current Streak", value: stats?.currentStreak || 0, unit: "days", color: "from-orange-600 to-red-600", glow: "from-orange-500/40" },
    { icon: Target, title: "Sessions This Week", value: stats?.sessionsThisWeek || 0, unit: "sessions", color: "from-blue-600 to-cyan-600", glow: "from-blue-500/40" },
    {
      icon: Clock,
      title: "Total Duration",
      value: stats?.totalDuration || 0,
      unit: "hours",
      color: "from-purple-600 to-pink-600",
      glow: "from-purple-500/40",
    },
    { icon: TrendingUp, title: "Longest Streak", value: stats?.longestStreak || 0, unit: "days", color: "from-green-600 to-emerald-600", glow: "from-green-500/40" },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
        />
      </div>

      <DashboardHeader user={user} />

      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h2>
          <p className="text-gray-600 text-lg">Let's build your perfect focus routine</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className={`bg-gradient-to-br ${stat.color} p-0.5 rounded-2xl shadow-2xl transition-all duration-300`}>
                  <div className="bg-white rounded-2xl p-6 h-full relative overflow-hidden">
                    {/* Glow Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <h3 className="text-gray-700 font-bold text-sm leading-tight">{stat.title}</h3>
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg shadow-lg`}
                      >
                        <Icon size={22} className="text-white" />
                      </motion.div>
                    </div>
                    <div className="relative z-10 flex items-baseline gap-2">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </motion.span>
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.unit}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Streak Card - Larger */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <StreakCard stats={stats} />
          </motion.div>

          {/* Analytics Chart - Full Width on Right */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <AnalyticsChart stats={stats} />
          </motion.div>
        </motion.div>

        {/* Session Tracker */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <SessionTracker user={user} />
        </motion.div>
      </div>
    </main>
  )
}
