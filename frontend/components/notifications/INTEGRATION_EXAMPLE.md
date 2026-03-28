# Integration Example

## How to integrate the notification permission system into your app

### 1. Add the banner to the dashboard

In `frontend/app/dashboard/page.tsx` or your main dashboard component:

```tsx
import { NotificationPermissionBanner } from '@/components/notifications';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Add the banner at the top of the dashboard */}
      <NotificationPermissionBanner />
      
      {/* Rest of your dashboard content */}
      <div className="grid gap-6">
        {/* Your existing dashboard components */}
      </div>
    </div>
  );
}
```

### 2. Add settings to the profile page

In `frontend/app/profile/page.tsx`:

```tsx
import { NotificationSettings } from '@/components/notifications';

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>
      
      {/* Add notification settings card */}
      <NotificationSettings 
        onPreferencesChange={(enabled) => {
          console.log('Notifications enabled:', enabled);
        }}
      />
      
      {/* Other profile settings */}
    </div>
  );
}
```

### 3. Programmatically trigger the permission dialog

If you want to show the dialog when a user tries to create a reminder:

```tsx
'use client';

import { useState } from 'react';
import { NotificationPermissionDialog } from '@/components/notifications';
import { getNotificationPermission } from '@/lib/notifications';
import { Button } from '@/components/ui/button';

export function CreateReminderButton() {
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const handleCreateReminder = () => {
    const permission = getNotificationPermission();
    
    if (permission !== 'granted') {
      // Show permission dialog first
      setShowPermissionDialog(true);
    } else {
      // Proceed with creating reminder
      createReminder();
    }
  };

  const handlePermissionGranted = () => {
    // Permission granted, now create the reminder
    createReminder();
  };

  const createReminder = () => {
    // Your reminder creation logic here
    console.log('Creating reminder...');
  };

  return (
    <>
      <Button onClick={handleCreateReminder}>
        Create Reminder
      </Button>

      <NotificationPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onPermissionGranted={handlePermissionGranted}
      />
    </>
  );
}
```

### 4. Check notification status before showing reminder features

```tsx
import { getNotificationPermission, isNotificationSupported } from '@/lib/notifications';

export function ReminderFeature() {
  const permission = getNotificationPermission();
  const isSupported = isNotificationSupported();

  if (!isSupported) {
    return (
      <div className="text-muted-foreground">
        Your browser doesn't support notifications. 
        You'll see in-app reminders instead.
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="text-muted-foreground">
        Notifications are blocked. Please enable them in your browser settings.
      </div>
    );
  }

  // Show normal reminder UI
  return <div>Reminder feature UI...</div>;
}
```

### 5. Send notifications from your reminder logic

```tsx
import { showNotification } from '@/lib/notifications';

// When a reminder time is reached
function triggerReminder(reminderData) {
  showNotification('Study Session Reminder', {
    body: `Time for your ${reminderData.subject} study session!`,
    icon: '/icon-192x192.png',
    tag: `reminder-${reminderData.id}`,
    requireInteraction: true,
    actions: [
      { action: 'start', title: 'Start Now' },
      { action: 'snooze', title: 'Snooze 10 min' },
    ],
  });
}
```

## Testing the Implementation

1. **Test in development:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to the dashboard** - You should see the notification banner if you haven't been prompted before

3. **Click "Enable Notifications"** - The dialog should appear

4. **Grant permission** - You should receive a test notification

5. **Check the profile page** - The notification settings should reflect the granted permission

6. **Test the toggle** - Disable and re-enable notifications to verify the sync works

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (iOS 16.4+)
- ❌ IE: Not supported (gracefully degrades)

## Troubleshooting

### Notifications not showing?
1. Check browser permissions in settings
2. Verify the site is served over HTTPS (required for notifications)
3. Check browser console for errors

### Permission dialog not appearing?
1. Clear localStorage and try again
2. Check if permission was already granted/denied
3. Verify the banner logic in browser DevTools

### Backend sync failing?
1. Check if user is authenticated
2. Verify API endpoint is accessible
3. Check network tab for API errors
