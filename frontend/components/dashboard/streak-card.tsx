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
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-3 border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl overflow-hidden group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-300/0 via-orange-200/10 to-red-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-orange-700 font-bold">Current Streak</CardTitle>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg"
            >
              <Flame size={28} className="text-white" />
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
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-2xl opacity-20" />
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent"
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
