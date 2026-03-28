# Upgrade Components

This directory contains all components and utilities for managing upgrade prompts and CTAs throughout the application.

## Components

### UpgradeModal
Full-featured modal dialog that displays when users hit feature limits.

**Features:**
- Feature-specific messaging and benefits
- Automatic impression tracking
- 24-hour cooldown on dismissal
- Gradient design with premium feel

**Usage:**
```tsx
import { UpgradeModal } from '@/components/upgrade'

<UpgradeModal
  open={isOpen}
  onOpenChange={setIsOpen}
  feature="sessions"
  onUpgrade={() => router.push('/pricing')}
  onDismiss={() => console.log('User dismissed')}
/>
```

### SessionLimitBanner
Banner component that shows session usage and warns when approaching limits.

**Features:**
- Visual progress bar
- Color-coded warnings (blue → orange → red)
- Automatic hiding when no sessions used
- Upgrade CTA when at or near limit

**Usage:**
```tsx
import { SessionLimitBanner } from '@/components/upgrade'

<SessionLimitBanner
  currentCount={2}
  limit={3}
  onUpgrade={() => showUpgrade('sessions')}
/>
```

### UpgradeCta
Flexible CTA component with multiple variants.

**Variants:**
- `card`: Full card with benefits list (default)
- `banner`: Horizontal banner with quick benefits
- `inline`: Compact inline version

**Usage:**
```tsx
import { UpgradeCta } from '@/components/upgrade'

// Card variant
<UpgradeCta
  variant="card"
  onUpgrade={() => router.push('/pricing')}
/>

// Banner variant
<UpgradeCta
  variant="banner"
  feature="Cloud Sync"
  onUpgrade={() => router.push('/pricing')}
/>

// Inline variant
<UpgradeCta
  variant="inline"
  feature="unlimited sessions"
  onUpgrade={() => router.push('/pricing')}
/>
```

### UpgradeProvider
Context provider that manages upgrade prompts globally.

**Features:**
- Centralized upgrade state management
- Automatic routing to pricing page
- Global access via useUpgrade hook

**Usage:**
```tsx
// In app/layout.tsx
import { UpgradeProvider } from '@/components/upgrade'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <UpgradeProvider>
          {children}
        </UpgradeProvider>
      </body>
    </html>
  )
}

// In any component
import { useUpgrade } from '@/components/upgrade'

function MyComponent() {
  const { showUpgrade, checkCooldown } = useUpgrade()
  
  const handleSessionLimit = () => {
    if (!checkCooldown('sessions')) {
      showUpgrade('sessions')
    }
  }
  
  return <button onClick={handleSessionLimit}>Start Session</button>
}
```

## Hooks

### useUpgradePrompt
Low-level hook for managing upgrade prompt state.

**Usage:**
```tsx
import { useUpgradePrompt } from '@/hooks/use-upgrade-prompt'

const {
  isOpen,
  feature,
  showUpgradePrompt,
  hideUpgradePrompt,
  checkCooldown,
  getImpressionCount,
  clearCooldown,
} = useUpgradePrompt()

// Show prompt
showUpgradePrompt('sessions')

// Check if in cooldown
if (checkCooldown('sessions')) {
  console.log('Still in cooldown period')
}

// Get impression count
const count = getImpressionCount('sessions')
```

## Utilities

### upgrade-tracking.ts
Service for tracking upgrade prompt impressions and analytics.

**Functions:**
- `trackUpgradeImpression(feature, action, metadata?)` - Track an impression
- `getImpressions()` - Get all impressions
- `getFeatureImpressions(feature)` - Get impressions for specific feature
- `getImpressionCount(feature?)` - Get impression count
- `recordDismissal(feature)` - Record dismissal with timestamp
- `isInCooldown(feature, hours?)` - Check cooldown status
- `clearCooldown(feature)` - Clear cooldown for feature
- `getUpgradeStats()` - Get analytics statistics
- `clearTrackingData()` - Clear all tracking data
- `exportTrackingData()` - Export data as JSON

**Usage:**
```tsx
import {
  trackUpgradeImpression,
  getUpgradeStats,
  isInCooldown,
} from '@/lib/upgrade-tracking'

// Track custom impression
trackUpgradeImpression('sessions', 'shown', {
  source: 'dashboard',
  sessionCount: 3,
})

// Check cooldown
if (isInCooldown('sessions', 24)) {
  console.log('In cooldown period')
}

// Get analytics
const stats = getUpgradeStats()
console.log('Conversion rate:', stats.conversionRate)
console.log('Total impressions:', stats.totalImpressions)
```

## Integration Examples

### Example 1: Session Creation with Limit Check

```tsx
'use client'

import { useState } from 'react'
import { useUpgrade } from '@/components/upgrade'
import { SessionLimitBanner } from '@/components/upgrade'
import { Button } from '@/components/ui/button'

export function SessionCreator() {
  const { showUpgrade } = useUpgrade()
  const [sessionCount, setSessionCount] = useState(2)
  const SESSION_LIMIT = 3

  const handleCreateSession = async () => {
    if (sessionCount >= SESSION_LIMIT) {
      showUpgrade('sessions')
      return
    }

    // Create session logic
    setSessionCount(prev => prev + 1)
  }

  return (
    <div className="space-y-4">
      <SessionLimitBanner
        currentCount={sessionCount}
        limit={SESSION_LIMIT}
        onUpgrade={() => showUpgrade('sessions')}
      />
      
      <Button
        onClick={handleCreateSession}
        disabled={sessionCount >= SESSION_LIMIT}
      >
        Start New Session
      </Button>
    </div>
  )
}
```

### Example 2: Dashboard with Upgrade CTA

```tsx
'use client'

import { UpgradeCta } from '@/components/upgrade'
import { useUpgrade } from '@/components/upgrade'

export function Dashboard() {
  const { showUpgrade } = useUpgrade()
  const userTier = 'free' // Get from user context

  return (
    <div className="grid gap-6">
      {/* Dashboard content */}
      
      {userTier === 'free' && (
        <UpgradeCta
          variant="banner"
          onUpgrade={() => showUpgrade('general')}
        />
      )}
    </div>
  )
}
```

### Example 3: Feature Gate with Upgrade Prompt

```tsx
'use client'

import { useUpgrade } from '@/components/upgrade'
import { Button } from '@/components/ui/button'

export function ExportButton() {
  const { showUpgrade } = useUpgrade()
  const userTier = 'free' // Get from user context

  const handleExport = () => {
    if (userTier === 'free') {
      showUpgrade('export')
      return
    }

    // Export logic for premium users
    console.log('Exporting data...')
  }

  return (
    <Button onClick={handleExport}>
      Export Data
    </Button>
  )
}
```

## Feature Types

The following feature types are supported:

- `sessions` - Session limit reached
- `tokens` - AI token limit reached
- `storage` - Cloud storage upgrade
- `history` - Full history access
- `export` - Data export feature
- `general` - General upgrade prompt

## Cooldown System

The cooldown system prevents upgrade prompt fatigue:

- **Duration**: 24 hours by default
- **Scope**: Per-feature (dismissing "sessions" doesn't affect "tokens")
- **Storage**: localStorage with ISO timestamps
- **Bypass**: Can be cleared programmatically for testing

## Analytics & Tracking

All upgrade interactions are tracked:

- **Impressions**: When prompts are shown
- **Actions**: upgrade_clicked, dismissed, closed
- **Metadata**: Feature, timestamp, session ID
- **Statistics**: Conversion rate, dismissal rate, impressions by feature

Data is stored in localStorage and can be exported for analysis.

## Best Practices

1. **Always check cooldown** before showing prompts
2. **Use appropriate feature types** for accurate tracking
3. **Provide context** in upgrade messages
4. **Test cooldown behavior** in development
5. **Monitor conversion rates** to optimize messaging
6. **Respect user dismissals** - don't be too aggressive
7. **Clear benefits** - always show what users get

## Testing

To test upgrade prompts in development:

```tsx
import { clearCooldown, clearTrackingData } from '@/lib/upgrade-tracking'

// Clear cooldown for a feature
clearCooldown('sessions')

// Clear all tracking data
clearTrackingData()

// Force show prompt (bypasses cooldown in hook)
const { showUpgradePrompt } = useUpgradePrompt()
showUpgradePrompt('sessions')
```
