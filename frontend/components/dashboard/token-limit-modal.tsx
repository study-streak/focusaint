"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, Crown, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TokenLimitModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade?: () => void
  resetAt?: string
  used?: number
  limit?: number
}

export default function TokenLimitModal({
  isOpen,
  onClose,
  onUpgrade,
  resetAt,
  used = 0,
  limit = 0,
}: TokenLimitModalProps) {
  const resetTime = resetAt
    ? new Date(resetAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "midnight UTC"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              Token Limit Reached
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-300 pt-2">
            You've used all your AI tokens for today
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Usage Stats */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Today's Usage</span>
              <span className="text-sm font-semibold text-red-400">
                {used.toLocaleString()} / {limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-red-500 to-red-600"
              />
            </div>
          </div>

          {/* Reset Info */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-300 mb-1">
                Tokens Reset Soon
              </p>
              <p className="text-xs text-slate-400">
                Your daily token limit will reset at {resetTime}. Come back then to
                continue using AI features.
              </p>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Premium Benefits</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Extended daily token limits
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Priority AI responses
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Custom AI persona
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Unlimited cloud sync
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Close
            </Button>
            {onUpgrade && (
              <Button
                onClick={() => {
                  onUpgrade()
                  onClose()
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
