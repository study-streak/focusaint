"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Zap, AlertCircle, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TokenUsageData {
  current: {
    used: number
    remaining: number
    limit: number
    resetAt: string
  }
  stats?: {
    last30Days: number
    history: Array<{ date: string; tokens: number }>
  }
}

interface TokenUsageIndicatorProps {
  compact?: boolean
  showUpgradePrompt?: boolean
  onUpgradeClick?: () => void
}

export default function TokenUsageIndicator({
  compact = false,
  showUpgradePrompt = true,
  onUpgradeClick,
}: TokenUsageIndicatorProps) {
  const [tokenData, setTokenData] = useState<TokenUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTokenUsage()
  }, [])

  const fetchTokenUsage = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/token-usage`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch token usage")
      }

      const data = await response.json()
      setTokenData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load token usage")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-white/5 rounded-lg" />
      </div>
    )
  }

  if (error || !tokenData) {
    return null
  }

  const { used, remaining, limit } = tokenData.current
  const percentage = (used / limit) * 100
  const isLow = percentage > 80
  const isExhausted = remaining === 0

  // Compact version for inline display
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Zap
                size={14}
                className={`${
                  isExhausted
                    ? "text-red-400"
                    : isLow
                    ? "text-yellow-400"
                    : "text-emerald-400"
                }`}
              />
              <span className="text-xs font-medium text-slate-200">
                {remaining.toLocaleString()} / {limit.toLocaleString()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {remaining.toLocaleString()} AI tokens remaining today
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Full card version for dashboard
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-hidden"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">AI Tokens</h3>
              <p className="text-xs text-slate-400">Daily usage</p>
            </div>
          </div>
          {isExhausted && (
            <AlertCircle size={18} className="text-red-400" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {remaining.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">
              of {limit.toLocaleString()} remaining
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-2 bg-white/10"
            indicatorClassName={`${
              isExhausted
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : isLow
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-emerald-500 to-teal-500"
            }`}
          />
          <p className="text-xs text-slate-400">
            Resets at{" "}
            {new Date(tokenData.current.resetAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Warning or Upgrade Prompt */}
        {isExhausted && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-300 mb-2">
              You've used all your AI tokens for today. They'll reset at midnight UTC.
            </p>
            {showUpgradePrompt && (
              <Button
                size="sm"
                onClick={onUpgradeClick}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Crown size={14} className="mr-1" />
                Upgrade for More Tokens
              </Button>
            )}
          </div>
        )}

        {isLow && !isExhausted && showUpgradePrompt && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-300 mb-2">
              Running low on tokens. Upgrade to premium for extended limits.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onUpgradeClick}
              className="w-full border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
            >
              <Crown size={14} className="mr-1" />
              View Premium Plans
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
