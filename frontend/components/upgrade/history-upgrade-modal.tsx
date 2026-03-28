'use client'

import * as React from 'react'
import { CheckIcon, SparklesIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  trackUpgradeImpression,
  recordDismissal,
} from '@/lib/upgrade-tracking'

interface HistoryUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: () => void
}

const PREMIUM_BENEFITS = [
  'Access your complete history (all time)',
  'Advanced analytics and trend analysis',
  'Export data to PDF or Markdown',
  'Custom date range filtering',
  'Detailed performance insights',
]

export function HistoryUpgradeModal({
  open,
  onOpenChange,
  onDismiss,
}: HistoryUpgradeModalProps) {
  const router = useRouter()

  // Track when modal is shown
  React.useEffect(() => {
    if (open) {
      trackUpgradeImpression('history', 'shown')
    }
  }, [open])

  const handleUpgrade = () => {
    trackUpgradeImpression('history', 'upgrade_clicked')
    router.push('/pricing')
    onOpenChange(false)
  }

  const handleDismiss = () => {
    recordDismissal('history')
    onDismiss?.()
    onOpenChange(false)
  }

  const handleClose = () => {
    trackUpgradeImpression('history', 'closed')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl">
            📊
          </div>
          <DialogTitle className="text-center text-2xl">
            Unlock Your Complete History
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Free users can view the last 30 days of history. Upgrade to premium for unlimited access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3">
            <SparklesIcon className="size-5 text-purple-500" />
            <p className="text-sm font-medium">
              Premium unlocks:
            </p>
          </div>

          <ul className="space-y-3">
            {PREMIUM_BENEFITS.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                  <CheckIcon className="size-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Cancel anytime • 7-day money-back guarantee
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            <SparklesIcon className="size-4" />
            View Pricing
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-full"
            size="sm"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By upgrading, you agree to our Terms of Service
        </p>
      </DialogContent>
    </Dialog>
  )
}
