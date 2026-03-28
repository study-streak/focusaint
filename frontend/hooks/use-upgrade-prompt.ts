'use client'

import { useState, useCallback } from 'react'
import {
  isInCooldown,
  clearCooldown as clearFeatureCooldown,
  getImpressionCount as getTrackingImpressionCount,
  type UpgradeFeature,
} from '@/lib/upgrade-tracking'

interface UpgradePromptState {
  isOpen: boolean
  feature: UpgradeFeature | null
}

const COOLDOWN_HOURS = 24

export function useUpgradePrompt() {
  const [state, setState] = useState<UpgradePromptState>({
    isOpen: false,
    feature: null,
  })

  const checkCooldown = useCallback((feature: UpgradeFeature): boolean => {
    return isInCooldown(feature, COOLDOWN_HOURS)
  }, [])

  const showUpgradePrompt = useCallback(
    (feature: UpgradeFeature) => {
      // Check if we're in cooldown period
      if (checkCooldown(feature)) {
        console.log(`Upgrade prompt for ${feature} is in cooldown period`)
        return
      }

      setState({ isOpen: true, feature })
    },
    [checkCooldown]
  )

  const hideUpgradePrompt = useCallback(() => {
    setState({ isOpen: false, feature: null })
  }, [])

  const getImpressionCount = useCallback((feature?: UpgradeFeature): number => {
    return getTrackingImpressionCount(feature)
  }, [])

  const clearCooldown = useCallback((feature: UpgradeFeature) => {
    clearFeatureCooldown(feature)
  }, [])

  return {
    isOpen: state.isOpen,
    feature: state.feature,
    showUpgradePrompt,
    hideUpgradePrompt,
    checkCooldown,
    getImpressionCount,
    clearCooldown,
  }
}
