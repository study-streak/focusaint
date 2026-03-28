'use client'

import * as React from 'react'
import { AlertCircleIcon, SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SessionLimitBannerProps {
  currentCount: number
  limit: number
  onUpgrade: () => void
  className?: string
}

export function SessionLimitBanner({
  currentCount,
  limit,
  onUpgrade,
  className,
}: SessionLimitBannerProps) {
  const remaining = limit - currentCount
  const isAtLimit = remaining <= 0
  const isNearLimit = remaining === 1

  if (currentCount === 0) return null

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isAtLimit
          ? 'border-destructive/50 bg-destructive/10'
          : isNearLimit
            ? 'border-orange-500/50 bg-orange-500/10'
            : 'border-blue-500/50 bg-blue-500/10',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
            isAtLimit
              ? 'bg-destructive/20'
              : isNearLimit
                ? 'bg-orange-500/20'
                : 'bg-blue-500/20'
          )}
        >
          {isAtLimit ? (
            <AlertCircleIcon
              className={cn(
                'size-4',
                isAtLimit
                  ? 'text-destructive'
                  : isNearLimit
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-blue-600 dark:text-blue-400'
              )}
            />
          ) : (
            <span className="text-sm font-bold">{remaining}</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-semibold">
              {isAtLimit
                ? 'Daily Session Limit Reached'
                : isNearLimit
                  ? 'Last Session Available Today'
                  : 'Session Usage'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAtLimit ? (
                <>
                  You've used all {limit} Quick Mode sessions today. Upgrade to
                  Premium for unlimited sessions.
                </>
              ) : (
                <>
                  You've used {currentCount} of {limit} free sessions today.
                  {isNearLimit && ' One more session remaining.'}
                </>
              )}
            </p>
          </div>

          {(isAtLimit || isNearLimit) && (
            <Button
              onClick={onUpgrade}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <SparklesIcon className="size-3" />
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>

      {!isAtLimit && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-300',
                isNearLimit
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              )}
              style={{ width: `${(currentCount / limit) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Resets daily at midnight UTC
          </p>
        </div>
      )}
    </div>
  )
}
