/**
 * Upgrade Prompt Tracking Service
 * 
 * Tracks user interactions with upgrade prompts for analytics and optimization.
 * Stores data in localStorage and optionally syncs to backend.
 */

export type UpgradeFeature = 'sessions' | 'tokens' | 'storage' | 'history' | 'export' | 'general'
export type UpgradeAction = 'shown' | 'upgrade_clicked' | 'dismissed' | 'closed'

export interface UpgradeImpression {
  feature: UpgradeFeature
  action: UpgradeAction
  timestamp: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface UpgradeDismissal {
  [feature: string]: string // feature -> ISO timestamp
}

export interface UpgradeStats {
  totalImpressions: number
  impressionsByFeature: Record<UpgradeFeature, number>
  impressionsByAction: Record<UpgradeAction, number>
  conversionRate: number
  dismissalRate: number
}

const STORAGE_KEYS = {
  IMPRESSIONS: 'upgrade_impressions',
  DISMISSALS: 'upgrade_dismissals',
  SESSION_ID: 'upgrade_session_id',
} as const

/**
 * Generate or retrieve session ID for tracking
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID)
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId)
  }
  return sessionId
}

/**
 * Track an upgrade prompt impression
 */
export function trackUpgradeImpression(
  feature: UpgradeFeature,
  action: UpgradeAction,
  metadata?: Record<string, any>
): void {
  if (typeof window === 'undefined') return

  const impression: UpgradeImpression = {
    feature,
    action,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    metadata,
  }

  const impressions = getImpressions()
  impressions.push(impression)
  localStorage.setItem(STORAGE_KEYS.IMPRESSIONS, JSON.stringify(impressions))

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Upgrade Tracking]', impression)
  }

  // TODO: Send to backend analytics endpoint
  // sendToAnalytics(impression)
}

/**
 * Get all tracked impressions
 */
export function getImpressions(): UpgradeImpression[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEYS.IMPRESSIONS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to parse impressions:', error)
    return []
  }
}

/**
 * Get impressions for a specific feature
 */
export function getFeatureImpressions(feature: UpgradeFeature): UpgradeImpression[] {
  return getImpressions().filter((i) => i.feature === feature)
}

/**
 * Get impression count
 */
export function getImpressionCount(feature?: UpgradeFeature): number {
  const impressions = getImpressions()
  if (feature) {
    return impressions.filter((i) => i.feature === feature).length
  }
  return impressions.length
}

/**
 * Record a dismissal with timestamp
 */
export function recordDismissal(feature: UpgradeFeature): void {
  if (typeof window === 'undefined') return

  const dismissals = getDismissals()
  dismissals[feature] = new Date().toISOString()
  localStorage.setItem(STORAGE_KEYS.DISMISSALS, JSON.stringify(dismissals))

  // Track as impression
  trackUpgradeImpression(feature, 'dismissed')
}

/**
 * Get all dismissals
 */
export function getDismissals(): UpgradeDismissal {
  if (typeof window === 'undefined') return {}

  try {
    const data = localStorage.getItem(STORAGE_KEYS.DISMISSALS)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Failed to parse dismissals:', error)
    return {}
  }
}

/**
 * Check if a feature is in cooldown period
 */
export function isInCooldown(feature: UpgradeFeature, cooldownHours: number = 24): boolean {
  if (typeof window === 'undefined') return false

  const dismissals = getDismissals()
  const lastDismissal = dismissals[feature]

  if (!lastDismissal) return false

  const dismissalTime = new Date(lastDismissal).getTime()
  const now = new Date().getTime()
  const hoursSinceDismissal = (now - dismissalTime) / (1000 * 60 * 60)

  return hoursSinceDismissal < cooldownHours
}

/**
 * Clear cooldown for a feature
 */
export function clearCooldown(feature: UpgradeFeature): void {
  if (typeof window === 'undefined') return

  const dismissals = getDismissals()
  delete dismissals[feature]
  localStorage.setItem(STORAGE_KEYS.DISMISSALS, JSON.stringify(dismissals))
}

/**
 * Get upgrade statistics
 */
export function getUpgradeStats(): UpgradeStats {
  const impressions = getImpressions()

  const impressionsByFeature: Record<UpgradeFeature, number> = {
    sessions: 0,
    tokens: 0,
    storage: 0,
    history: 0,
    export: 0,
    general: 0,
  }

  const impressionsByAction: Record<UpgradeAction, number> = {
    shown: 0,
    upgrade_clicked: 0,
    dismissed: 0,
    closed: 0,
  }

  impressions.forEach((impression) => {
    impressionsByFeature[impression.feature]++
    impressionsByAction[impression.action]++
  })

  const totalShown = impressionsByAction.shown
  const totalUpgradeClicked = impressionsByAction.upgrade_clicked
  const totalDismissed = impressionsByAction.dismissed

  return {
    totalImpressions: impressions.length,
    impressionsByFeature,
    impressionsByAction,
    conversionRate: totalShown > 0 ? totalUpgradeClicked / totalShown : 0,
    dismissalRate: totalShown > 0 ? totalDismissed / totalShown : 0,
  }
}

/**
 * Clear all tracking data (for testing or user privacy)
 */
export function clearTrackingData(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(STORAGE_KEYS.IMPRESSIONS)
  localStorage.removeItem(STORAGE_KEYS.DISMISSALS)
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID)
}

/**
 * Export tracking data for analysis
 */
export function exportTrackingData(): string {
  const data = {
    impressions: getImpressions(),
    dismissals: getDismissals(),
    stats: getUpgradeStats(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}
