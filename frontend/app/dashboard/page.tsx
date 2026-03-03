"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import SessionTracker from "@/components/dashboard/session-tracker"
import AnalyticsChart from "@/components/dashboard/analytics-chart"
import { clearAuthToken } from "@/lib/auth-cookie"
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

        if (!userRes.ok) {
          throw new Error("Failed to fetch user data")
          
        }


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
        clearAuthToken()
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mounted, router])

  // Don't render loading/error until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden" />
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
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
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
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
    { icon: Flame, title: "Current Streak", value: stats?.currentStreak || 0, unit: "days", color: "from-orange-500 via-red-500 to-pink-500", glow: "from-orange-400" },
    { icon: Target, title: "Sessions This Week", value: stats?.sessionsThisWeek || 0, unit: "sessions", color: "from-blue-500 via-indigo-500 to-purple-500", glow: "from-blue-400" },
    {
      icon: Clock,
      title: "Total Duration",
      value: stats?.totalDuration || 0,
      unit: "hours",
      color: "from-purple-500 via-pink-500 to-rose-500",
      glow: "from-purple-400",
    },
    { icon: TrendingUp, title: "Longest Streak", value: stats?.longestStreak || 0, unit: "days", color: "from-emerald-500 via-teal-500 to-cyan-500", glow: "from-emerald-400" },
  ]

  return (
    <main className="min-h-screen bg-[#070b14] relative overflow-x-hidden text-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 left-1/4 w-[520px] h-[520px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-24 right-1/4 w-[560px] h-[560px] bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -15, 0], x: [0, 15, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-1/2 w-[430px] h-[430px] bg-gradient-to-br from-blue-500/10 to-teal-500/10 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.14)_1px,transparent_0)] bg-[size:24px_24px] opacity-25" />
      </div>

      <DashboardHeader user={user} stats={stats} />

      <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-3 md:py-4 space-y-4 relative z-10 pb-6">

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
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
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-all duration-300 h-full min-h-[112px]">
                  <div className="rounded-xl p-4 h-full relative overflow-hidden">
                    {/* Glow Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                    
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <h3 className="text-slate-200 font-semibold text-xs md:text-sm leading-tight">{stat.title}</h3>
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-1.5 bg-gradient-to-br ${stat.color} rounded-md shadow-[0_8px_20px_rgba(0,0,0,0.35)]`}
                      >
                        <Icon size={16} className="text-white" />
                      </motion.div>
                    </div>
                    <div className="relative z-10 flex items-baseline gap-2">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </motion.span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{stat.unit}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          className="grid grid-cols-1 xl:grid-cols-5 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="xl:col-span-3">
            <AnalyticsChart stats={stats} />
          </motion.div>

          <motion.div variants={itemVariants} className="xl:col-span-2">
            <SessionTracker user={user} />
          </motion.div>
        </motion.div>
      </div>

      
    </main>
  )
}
