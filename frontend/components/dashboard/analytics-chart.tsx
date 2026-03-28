"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import HistoryDateRangeIndicator from "./history-date-range-indicator"

export default function AnalyticsChart({ stats }: { stats: any }) {
  const fallbackData = [
    { day: "Sun", sessions: 0 },
    { day: "Mon", sessions: 0 },
    { day: "Tue", sessions: 0 },
    { day: "Wed", sessions: 0 },
    { day: "Thu", sessions: 0 },
    { day: "Fri", sessions: 0 },
    { day: "Sat", sessions: 0 },
  ]

  const data = (stats?.weeklyData?.length ? stats.weeklyData : fallbackData).map((entry: any) => ({
    day: entry.day,
    sessions: Number(entry.sessions) || 0,
  }))

  const colors = ["#ec4899", "#a855f7", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]
  const maxValue = Math.max(...data.map((d: any) => d.sessions), 1)

  const handleUpgradeClick = () => {
    window.location.href = "/pricing"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full border border-white/15 bg-white/6 backdrop-blur-xl shadow-[0_14px_45px_rgba(0,0,0,0.45)] overflow-hidden group relative rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-cyan-500/10 to-violet-500/10 opacity-80" />
        
        <CardHeader className="relative z-10 pb-1 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-slate-100 font-bold">Weekly Activity</CardTitle>
              <p className="text-xs text-slate-300 mt-1 font-medium">Your focus sessions this week</p>
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="p-2 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-lg"
            >
              <TrendingUp size={22} className="text-white drop-shadow-lg" />
            </motion.div>
          </div>
          <div className="mt-3">
            <HistoryDateRangeIndicator 
              variant="badge" 
              showUpgradeLink={true}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-0 pb-3">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={data}
              margin={{ top: 12, right: 8, left: -12, bottom: 0 }}
            >
              <defs>
                {colors.map((color, i) => (
                  <linearGradient key={i} id={`gradient${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.2)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="rgb(107, 114, 128)"
                style={{ fontSize: "12px", fontWeight: "600", fill: "#cbd5e1" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(148, 163, 184, 0.6)"
                style={{ fontSize: "12px", fontWeight: "600", fill: "#94a3b8" }}
                domain={[0, Math.max(maxValue, 5)]}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
                  fontWeight: "600",
                }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#93c5fd" }}
                cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              />
              <Bar
                dataKey="sessions"
                fill="var(--color-accent)"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
              >
                {data.map((_entry: any, index: any) => (
                  <Cell key={`cell-${index}`} fill={`url(#gradient${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-300"
          >
            <p>
              Total: <span className="text-cyan-300">{data.reduce((sum: number, d: any) => sum + d.sessions, 0)}</span>
            </p>
            <p>
              Avg/day: <span className="text-violet-300">{(data.reduce((sum: number, d: any) => sum + d.sessions, 0) / data.length).toFixed(1)}</span>
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
