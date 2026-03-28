# History Upgrade Modal

A dedicated upgrade modal component for prompting free users to upgrade when they attempt to access history older than 30 days.

## Overview

This component is part of the tier-based history access control system (Requirement 7). Free users are limited to viewing the last 30 days of session history, while premium users have unlimited access.

## Features

- **Clear Value Proposition**: Explains the 30-day limitation for free users
- **Premium Benefits List**: Highlights what users get with premium
- **Pricing Display**: Shows monthly pricing with guarantee
- **Tracking Integration**: Automatically tracks impressions and conversions
- **Dark Theme**: Matches the existing focusaint dark theme design
- **Responsive Design**: Works on mobile and desktop

## Usage

### Basic Usage

```tsx
import { HistoryUpgradeModal } from '@/components/upgrade'

function MyComponent() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        View Older History
      </button>
      
      <HistoryUpgradeModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  )
}
```

### With Custom Dismiss Handler

```tsx
<HistoryUpgradeModal
  open={showModal}
  onOpenChange={setShowModal}
  onDismiss={() => {
    console.log('User dismissed the modal')
    // Custom logic here
  }}
/>
```

## Integration

The modal is automatically integrated with the `HistoryDateRangeIndicator` component. When free users click the "Upgrade for full history" link, this modal appears.

### Example Integration

```tsx
import HistoryDateRangeIndicator from '@/components/dashboard/history-date-range-indicator'

function HistoryPage() {
  return (
    <div>
      <HistoryDateRangeIndicator variant="alert" />
      {/* History content */}
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controls modal visibility (required) |
| `onOpenChange` | `(open: boolean) => void` | - | Callback when modal open state changes (required) |
| `onDismiss` | `() => void` | `undefined` | Optional callback when user dismisses the modal |

## Premium Benefits Displayed

1. Access your complete history (all time)
2. Advanced analytics and trend analysis
3. Export data to PDF or Markdown
4. Custom date range filtering
5. Detailed performance insights

## Tracking

The modal automatically tracks the following events via `upgrade-tracking.ts`:

- **shown**: When the modal is displayed
- **upgrade_clicked**: When user clicks "View Pricing"
- **closed**: When user closes the modal
- **dismissed**: When user clicks "Maybe Later"

## Navigation

When users click "View Pricing", they are redirected to `/pricing` page where they can view plans and subscribe.

## Design Decisions

### Why a Dedicated Component?

While the generic `UpgradeModal` component already has a 'history' feature configuration, this dedicated component provides:

1. **Specific Context**: Tailored messaging for history access
2. **Cleaner Integration**: Direct integration with history-related components
3. **Easier Maintenance**: Changes to history upgrade flow don't affect other upgrade prompts
4. **Better Tracking**: Separate tracking for history-specific conversions

### Styling

- Uses shadcn/ui Dialog component for consistency
- Gradient purple-to-pink theme matches premium branding
- Dark theme optimized for focusaint's design system
- Framer Motion animations for smooth transitions

## Related Components

- `UpgradeModal`: Generic upgrade modal for other features
- `HistoryDateRangeIndicator`: Shows history limits and triggers this modal
- `UpgradeProvider`: Context provider for upgrade state management

## Requirements

Implements **Requirement 7: History Access Control**
- Acceptance Criteria 7.4: "WHEN a Free_User attempts to access data older than 30 days, THE System SHALL display an upgrade prompt"

## Testing

To test the modal:

1. Log in as a free user
2. Navigate to a page with history data
3. Look for the "Showing last 30 days" indicator
4. Click "Upgrade for full history"
5. Verify the modal appears with correct content
6. Test both "View Pricing" and "Maybe Later" actions

## Future Enhancements

- A/B testing different benefit lists
- Dynamic pricing based on user's region
- Limited-time offers for long-term free users
- Preview of what's in the locked history
