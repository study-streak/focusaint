'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { UpgradeModal } from './upgrade-modal'
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt'
import type { UpgradeFeature } from '@/lib/upgrade-tracking'

interface UpgradeProviderProps {
  children: React.ReactNode
}

interface UpgradeContextValue {
  showUpgrade: (feature: UpgradeFeature) => void
  checkCooldown: (feature: UpgradeFeature) => boolean
  getImpressionCount: (feature?: UpgradeFeature) => number
}

const UpgradeContext = React.createContext<UpgradeContextValue | null>(null)

/**
 * Provider component that manages upgrade prompts globally
 */
export function UpgradeProvider({ children }: UpgradeProviderProps) {
  const router = useRouter()
  const {
    isOpen,
    feature,
    showUpgradePrompt,
    hideUpgradePrompt,
    checkCooldown,
    getImpressionCount,
  } = useUpgradePrompt()

  const handleUpgrade = React.useCallback(() => {
    // Navigate to pricing/upgrade page
    router.push('/pricing')
  }, [router])

  const contextValue = React.useMemo(
    () => ({
      showUpgrade: showUpgradePrompt,
      checkCooldown,
      getImpressionCount,
    }),
    [showUpgradePrompt, checkCooldown, getImpressionCount]
  )

  return (
    <UpgradeContext.Provider value={contextValue}>
      {children}
      {feature && (
        <UpgradeModal
          open={isOpen}
          onOpenChange={hideUpgradePrompt}
          feature={feature}
          onUpgrade={handleUpgrade}
          onDismiss={hideUpgradePrompt}
        />
      )}
    </UpgradeContext.Provider>
  )
}

/**
 * Hook to access upgrade functionality
 */
export function useUpgrade() {
  const context = React.useContext(UpgradeContext)
  if (!context) {
    throw new Error('useUpgrade must be used within UpgradeProvider')
  }
  return context
}
