'use client'

import * as React from 'react'
import {
  SparklesIcon,
  CheckIcon,
  ZapIcon,
  CloudIcon,
  TrendingUpIcon,
  ShieldIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UpgradeCtaProps {
  variant?: 'card' | 'banner' | 'inline'
  feature?: string
  onUpgrade: () => void
  className?: string
}

const PREMIUM_BENEFITS = [
  {
    icon: ZapIcon,
    title: 'Unlimited Sessions',
    description: 'No daily limits on Quick Mode or Deep Mode sessions',
  },
  {
    icon: CloudIcon,
    title: 'Cloud Sync',
    description: 'Access your data across all devices with automatic backup',
  },
  {
    icon: TrendingUpIcon,
    title: 'Advanced Analytics',
    description: 'Full history access and detailed performance insights',
  },
  {
    icon: ShieldIcon,
    title: 'Premium Features',
    description: 'AI persona, streak insurance, data export, and more',
  },
]

export function UpgradeCta({
  variant = 'card',
  feature,
  onUpgrade,
  className,
}: UpgradeCtaProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {feature ? `Unlock ${feature}` : 'Upgrade to Premium'}
          </p>
          <p className="text-xs text-muted-foreground">
            Get unlimited access and premium features
          </p>
        </div>
        <Button
          onClick={onUpgrade}
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <SparklesIcon className="size-3" />
          Upgrade
        </Button>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 p-6',
          className
        )}
      >
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <SparklesIcon className="size-5 text-purple-500" />
              <h3 className="font-semibold">Upgrade to Premium</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock unlimited sessions, cloud sync, advanced analytics, and
              more premium features.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Unlimited Sessions', 'Cloud Sync', 'No Ads', 'Priority Support'].map(
                (benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center gap-1 rounded-full bg-background/50 px-2 py-1 text-xs"
                  >
                    <CheckIcon className="size-3 text-green-500" />
                    {benefit}
                  </span>
                )
              )}
            </div>
          </div>
          <Button
            onClick={onUpgrade}
            size="lg"
            className="shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <SparklesIcon className="size-4" />
            Upgrade Now
          </Button>
        </div>
      </div>
    )
  }

  // Card variant (default)
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card p-6',
        className
      )}
    >
      <div className="absolute right-0 top-0 size-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <SparklesIcon className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Upgrade to Premium</h3>
            <p className="text-xs text-muted-foreground">
              Starting at $9.99/month
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {PREMIUM_BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <Button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          size="lg"
        >
          <SparklesIcon className="size-4" />
          Upgrade to Premium
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Cancel anytime • 7-day money-back guarantee
        </p>
      </div>
    </div>
  )
}
