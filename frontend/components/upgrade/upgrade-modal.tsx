'use client'

import * as React from 'react'
import { CheckIcon, SparklesIcon, XIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  trackUpgradeImpression,
  recordDismissal,
  type UpgradeFeature,
} from '@/lib/upgrade-tracking'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: UpgradeFeature
  onUpgrade?: () => void
  onDismiss?: () => void
}

const FEATURE_CONFIG = {
  sessions: {
    title: 'Session Limit Reached',
    description: "You've reached your daily limit of 3 Quick Mode sessions.",
    icon: '🎯',
    benefits: [
      'Unlimited Quick Mode sessions',
      'Access to Deep Mode for extended focus',
      'Multi-device session sync',
      'Advanced session analytics',
      'Priority AI responses',
    ],
  },
  tokens: {
    title: 'AI Token Limit Reached',
    description: "You've used all your daily AI tokens.",
    icon: '🤖',
    benefits: [
      'Extended AI token limits',
      'Custom AI persona settings',
      'Priority AI response times',
      'Advanced AI study coach features',
      'Unlimited conversation history',
    ],
  },
  storage: {
    title: 'Upgrade for Cloud Storage',
    description: 'Your data is currently stored locally on this device.',
    icon: '☁️',
    benefits: [
      'Full cloud sync across devices',
      'Automatic backup & recovery',
      'Access your data anywhere',
      'Unlimited storage space',
      'Offline sync capability',
    ],
  },
  history: {
    title: 'Access Full History',
    description: 'Free users can view the last 30 days of history.',
    icon: '📊',
    benefits: [
      'Unlimited history access',
      'Advanced analytics & insights',
      'Export data to PDF/Markdown',
      'Trend analysis over time',
      'Custom date range filtering',
    ],
  },
  export: {
    title: 'Export Your Data',
    description: 'Data export is a premium feature.',
    icon: '📥',
    benefits: [
      'Export to PDF & Markdown',
      'Weekly export allowance',
      'Include all session data',
      'Formatted for readability',
      'Backup your progress',
    ],
  },
  general: {
    title: 'Upgrade to Premium',
    description: 'Unlock the full potential of focusaint.',
    icon: '⭐',
    benefits: [
      'Unlimited sessions & AI tokens',
      'Cloud sync across devices',
      'Full history & analytics',
      'Export data anytime',
      'No ads, priority support',
    ],
  },
}

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  onUpgrade,
  onDismiss,
}: UpgradeModalProps) {
  const config = FEATURE_CONFIG[feature]

  // Track when modal is shown
  React.useEffect(() => {
    if (open) {
      trackUpgradeImpression(feature, 'shown')
    }
  }, [open, feature])

  const handleUpgrade = () => {
    trackUpgradeImpression(feature, 'upgrade_clicked')
    onUpgrade?.()
    onOpenChange(false)
  }

  const handleDismiss = () => {
    recordDismissal(feature)
    onDismiss?.()
    onOpenChange(false)
  }

  const handleClose = () => {
    trackUpgradeImpression(feature, 'closed')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl">
            {config.icon}
          </div>
          <DialogTitle className="text-center text-2xl">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3">
            <SparklesIcon className="size-5 text-purple-500" />
            <p className="text-sm font-medium">
              Upgrade to Premium and unlock:
            </p>
          </div>

          <ul className="space-y-3">
            {config.benefits.map((benefit, index) => (
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
            Upgrade to Premium
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
