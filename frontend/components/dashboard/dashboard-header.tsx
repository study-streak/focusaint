"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Settings, LogOut, Flame, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardHeader({ user, stats }: { user: any; stats?: any }) {
  const router = useRouter()
  const currentStreak = stats?.currentStreak || 0
  const initials = (user?.name || "User")
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50 shadow-[0_12px_35px_rgba(0,0,0,0.45)]">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 flex items-center justify-between gap-3">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-200 bg-clip-text text-transparent tracking-tight">
              focusaint
            </h1>
            <p className="text-[11px] md:text-xs text-slate-300">Welcome back, <span className="font-semibold text-indigo-200">{user?.name || "User"}</span></p>
          </div>
        </motion.div>
        <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-200/10 px-3 py-1.5 backdrop-blur-md">
            <Flame size={16} className="text-amber-300" />
            <span className="text-xs font-semibold text-amber-200">Streak</span>
            <span className="text-sm font-bold text-amber-100">{currentStreak} days</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 hover:bg-white/20 transition-colors"
              >
                <Avatar className="size-8 border border-white/20">
                  <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-violet-200/20 text-violet-100 text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown size={14} className="text-slate-200" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-[#121727]/95 border-white/10 text-slate-100">
              <DropdownMenuLabel className="text-xs text-slate-400">Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <Settings size={16} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut size={16} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </header>
  )
}
