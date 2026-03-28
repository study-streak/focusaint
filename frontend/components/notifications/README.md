# Notification System

This directory contains the notification system components for focusaint, including browser notifications and in-app notification fallback.

## Components

### NotificationSettings
Location: `notification-settings.tsx`

A settings panel that allows users to:
- Enable/disable browser notifications
- View current notification permission status
- Test notifications
- See information about in-app fallback

### InAppNotificationDisplay
Location: `in-app-notification-display.tsx`

Displays in-app notification cards when browser notifications are denied or unsupported. Features:
- Animated notification cards in top-right corner
- Action buttons (Open, Snooze, Dismiss)
- Auto-dismiss on action
- Stacked display for multiple notifications
- Responsive design with backdrop blur

### NotificationProvider
Location: `notification-provider.tsx`

Global provider that:
- Automatically starts notification polling
- Shows in-app notifications when browser notifications are unavailable
- Handles notification actions (open, snooze, dismiss)
- Only displays on authenticated pages

## Usage

### Basic Setup

The NotificationProvider is already included in the root layout (`app/layout.tsx`):

```tsx
import { NotificationProvider } from "@/components/notifications/notification-provider"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <NotificationProvider />
      </body>
    </html>
  )
}
```

### Using in a Page

```tsx
import { NotificationSettings } from '@/components/notifications/notification-settings'

export default function SettingsPage() {
  return (
    <div>
      <NotificationSettings 
        onPreferencesChange={(enabled) => {
          console.log('Notifications enabled:', enabled)
        }}
      />
    </div>
  )
}
```

### Using the Hook

```tsx
import { useNotificationManager } from '@/hooks/use-notification-manager'

function MyComponent() {
  const {
    isActive,
    inAppNotifications,
    permissionStatus,
    start,
    stop,
    checkNow,
    snooze,
    dismiss,
  } = useNotificationManager({
    autoStart: true,
    pollingFrequency: 60000,
  })

  return (
    <div>
      <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
      <p>Permission: {permissionStatus}</p>
      <p>In-app notifications: {inAppNotifications.length}</p>
    </div>
  )
}
```

## Notification Flow

### Browser Notifications Granted
1. User enables browser notifications
2. Notification manager polls for due reminders
3. Browser notifications are displayed (even when app is closed)
4. User can interact with notification actions

### Browser Notifications Denied/Unsupported
1. User denies notifications or browser doesn't support them
2. Notification manager polls for due reminders
3. In-app notification cards are displayed in top-right corner
4. User can interact with notification actions
5. Notifications only appear when user is actively using the app

## Features

### In-App Notification Fallback
- **Automatic Detection**: System automatically detects when browser notifications are unavailable
- **Visual Feedback**: Clear messaging about in-app notification mode
- **Full Functionality**: All notification actions work (open, snooze, dismiss)
- **Animated Display**: Smooth animations for notification appearance/dismissal
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Keyboard navigation and screen reader support

### Notification Actions
- **Open**: Navigates to reminders page
- **Snooze**: Delays reminder by 10 minutes
- **Dismiss**: Marks reminder as dismissed

## Styling

The in-app notifications use:
- Tailwind CSS for styling
- Framer Motion for animations
- shadcn/ui components (Card, Button, Badge)
- Backdrop blur for modern glass effect
- Color-coded status indicators

## Browser Support

### Browser Notifications
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with user permission)
- Mobile browsers: Limited support

### In-App Notifications
- All modern browsers
- Works as fallback for unsupported browsers
- No special permissions required

## Testing

### Test Browser Notifications
1. Go to Notification Settings
2. Enable browser notifications
3. Click "Send Test Notification"
4. Check system notifications

### Test In-App Notifications
1. Block browser notifications in browser settings
2. Create a reminder
3. Wait for reminder time or click "Check Now"
4. See in-app notification card in top-right corner

## Configuration

### Polling Frequency
Default: 60000ms (1 minute)

Change in `useNotificationManager`:
```tsx
useNotificationManager({
  pollingFrequency: 30000, // 30 seconds
})
```

### Snooze Duration
Default: 10 minutes

Change in action handler:
```tsx
await snooze(reminderId, 15) // 15 minutes
```

## Troubleshooting

### Notifications Not Appearing
1. Check if notification polling is active
2. Verify reminders are scheduled correctly
3. Check browser console for errors
4. Ensure user is authenticated

### In-App Notifications Not Showing
1. Verify browser notifications are denied/unsupported
2. Check if user is on login/signup page (excluded)
3. Ensure NotificationProvider is in layout
4. Check browser console for errors

### Permission Issues
1. Clear browser cache and cookies
2. Reset notification permissions in browser settings
3. Try in incognito/private mode
4. Check browser notification settings

## Future Enhancements

- [ ] Sound notifications for in-app alerts
- [ ] Custom notification sounds
- [ ] Notification history
- [ ] Batch notification actions
- [ ] Notification preferences per reminder type
- [ ] Desktop app integration
- [ ] Mobile push notifications
