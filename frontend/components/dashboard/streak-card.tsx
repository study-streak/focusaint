"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"

export default function StreakCard({ stats }: { stats: any }) {
  const currentStreak = stats?.currentStreak || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 shadow-2xl overflow-hidden group relative ring-2 ring-orange-200">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-red-400/20 to-pink-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-orange-800 font-bold">Current Streak</CardTitle>
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              className="p-3 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl shadow-xl"
            >
              <Flame size={30} className="text-white drop-shadow-lg" />
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-full blur-3xl opacity-30" />
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="text-8xl font-black bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl"
              >
                {currentStreak}
              </motion.div>
            </div>
          </motion.div>

          <div className="space-y-3 pt-4 border-t-2 border-orange-300">
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-orange-700">Days in a row</span>
              <span className="text-xs px-3 py-1 bg-orange-200 rounded-full text-orange-800 font-bold">Active</span>
            </motion.div>
            
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-gray-700">Longest Streak:</span>
              <span className="font-bold text-xl text-red-600">{stats?.longestStreak || 0} days</span>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
