"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Crown } from "lucide-react"
import { motion } from "framer-motion"
import { HistoryUpgradeModal } from "@/components/upgrade"

/**
 * Date Range Indicator Component
 * 
 * Displays the user's history access limits based on their subscription tier.
 * - Free users: Shows "Showing last 30 days" with upgrade link
 * - Premium users: Shows "Showing all history" with premium badge
 * 
 * Fetches tier information from /api/habit/history endpoint.
 * 
 * @param variant - Display style: "badge" (compact) or "alert" (full-width)
 * @param showUpgradeLink - Whether to show upgrade link for free users
 * @param onUpgradeClick - Callback when upgrade link is clicked
 */

interface DateRangeInfo {
  tier: "free" | "premium"
  dateRange: {
    isLimited: boolean
    oldestAllowed: string | null
  }
}

interface HistoryDateRangeIndicatorProps {
  variant?: "badge" | "alert"
  showUpgradeLink?: boolean
  onUpgradeClick?: () => void
}

export default function HistoryDateRangeIndicator({
  variant = "badge",
  showUpgradeLink = true,
  onUpgradeClick,
}: HistoryDateRangeIndicatorProps) {
  const [dateRangeInfo, setDateRangeInfo] = useState<DateRangeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    const fetchDateRangeInfo = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/habit/history`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          console.error("Failed to fetch history date range info")
          return
        }

        const data = await response.json()
        setDateRangeInfo({
          tier: data.tier,
          dateRange: data.dateRange,
        })
      } catch (error) {
        console.error("Error fetching date range info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDateRangeInfo()
  }, [])

  if (loading || !dateRangeInfo) {
    return null
  }

  const isFree = dateRangeInfo.tier === "free"
  const message = isFree ? "Showing last 30 days" : "Showing all history"

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      setShowUpgradeModal(true)
    }
  }

  if (variant === "badge") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2"
        >
          <Badge
            variant={isFree ? "secondary" : "default"}
            className={
              isFree
                ? "bg-slate-700/50 text-slate-200 border border-slate-600/50 backdrop-blur-sm"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg"
            }
          >
            {isFree ? (
              <Info className="w-3 h-3 mr-1" />
            ) : (
              <Crown className="w-3 h-3 mr-1" />
            )}
            {message}
          </Badge>
          {isFree && showUpgradeLink && (
            <button
              onClick={handleUpgradeClick}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-medium"
            >
              Upgrade for full history
            </button>
          )}
        </motion.div>
        
        <HistoryUpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
        />
      </>
    )
  }

  // Alert variant
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert
        className={
          isFree
            ? "border-slate-600/50 bg-slate-800/30 backdrop-blur-sm"
            : "border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm"
        }
      >
        <div className="flex items-start gap-2">
          {isFree ? (
            <Info className="w-4 h-4 text-slate-300 mt-0.5" />
          ) : (
            <Crown className="w-4 h-4 text-amber-400 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertDescription className="text-sm text-slate-200">
              {message}
              {isFree && showUpgradeLink && (
                <>
                  {" · "}
                  <button
                    onClick={handleUpgradeClick}
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-medium"
                  >
                    Upgrade to premium
                  </button>
                  {" "}
                  for unlimited access to your complete history.
                </>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
      
      <HistoryUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />
    </motion.div>
  )
}
