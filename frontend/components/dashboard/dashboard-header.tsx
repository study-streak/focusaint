"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Settings, LogOut } from "lucide-react"

export default function DashboardHeader({ user }: { user: any }) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <header className="border-b-2 border-purple-200 bg-gradient-to-r from-white via-blue-50 to-purple-50 backdrop-blur-xl sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              focusaint
            </h1>
            <p className="text-sm text-gray-600">Welcome back, <span className="font-semibold text-purple-700">{user?.name || "User"}</span></p>
          </div>
        </motion.div>
        <motion.div className="flex gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              onClick={() => router.push("/profile")}
              className="border-purple-300 hover:bg-purple-100 text-purple-700 hover:text-purple-900 gap-2"
            >
              <Settings size={18} />
              Profile
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </header>
  )
}
