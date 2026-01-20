"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"

export default function AnalyticsChart({ stats }: { stats: any }) {
  const data = stats?.weeklyData || [
    { day: "Sun", sessions: 2 },
    { day: "Mon", sessions: 2 },
    { day: "Tue", sessions: 3 },
    { day: "Wed", sessions: 2 },
    { day: "Thu", sessions: 4 },
    { day: "Fri", sessions: 3 },
    { day: "Sat", sessions: 1 },
  ]

  const colors = ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1"]
  const maxValue = Math.max(...data.map((d: any) => d.sessions), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-3 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300/0 via-blue-200/10 to-cyan-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-700 font-bold">Weekly Activity</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Your focus sessions this week</p>
            </div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-lg"
            >
              <TrendingUp size={28} className="text-white" />
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
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
                style={{ fontSize: "14px", fontWeight: "600" }}
              />
              <YAxis
                stroke="rgb(107, 114, 128)"
                style={{ fontSize: "14px", fontWeight: "600" }}
                domain={[0, Math.max(maxValue, 5)]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "3px solid rgb(96, 165, 250)",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
                  fontWeight: "600",
                }}
                labelStyle={{ color: "rgb(37, 99, 235)" }}
                itemStyle={{ color: "rgb(59, 130, 246)" }}
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              />
              <Bar
                dataKey="sessions"
                fill="var(--color-accent)"
                radius={[12, 12, 0, 0]}
                isAnimationActive={true}
              >
                {data.map((_entry: any, index: any) => (
                  <Cell key={`cell-${index}`} fill={`url(#gradient${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Stats Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-6 border-t-2 border-blue-300 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">Total Sessions This Week</p>
              <p className="text-3xl font-bold text-blue-600">
                {data.reduce((sum: number, d: any) => sum + d.sessions, 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">Average Per Day</p>
              <p className="text-3xl font-bold text-cyan-600">
                {(data.reduce((sum: number, d: any) => sum + d.sessions, 0) / data.length).toFixed(1)}
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
