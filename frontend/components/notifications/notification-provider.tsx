'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { InAppNotificationDisplay } from './in-app-notification-display';
import { useNotificationManager } from '@/hooks/use-notification-manager';
import { ReminderService } from '@/lib/reminder-service';

/**
 * Global notification provider that displays in-app notifications
 * when browser notifications are denied or unsupported
 */
export function NotificationProvider() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const {
    inAppNotifications,
    permissionStatus,
    snooze,
    dismiss,
  } = useNotificationManager({
    autoStart: true,
    pollingFrequency: 60000, // Check every minute
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAction = async (reminderId: string, action: 'open' | 'snooze' | 'dismiss') => {
    switch (action) {
      case 'open':
        // Navigate to reminders page
        window.location.href = '/dashboard/reminders';
        break;

      case 'snooze':
        await snooze(reminderId, 10);
        break;

      case 'dismiss':
        await dismiss(reminderId);
        break;
    }
  };

  const handleClose = (notificationId: string) => {
    // Remove the notification from the display
    // The notification manager will handle cleanup
  };

  // Only show in-app notifications when:
  // 1. Browser notifications are denied or unsupported
  // 2. User is logged in (has token)
  // 3. Not on login/signup pages
  const shouldShowInApp = mounted && 
    (permissionStatus === 'denied' || permissionStatus === 'unsupported') &&
    typeof window !== 'undefined' &&
    localStorage.getItem('token') &&
    !pathname?.startsWith('/login') &&
    !pathname?.startsWith('/signup');

  if (!shouldShowInApp) {
    return null;
  }

  return (
    <InAppNotificationDisplay
      notifications={inAppNotifications}
      onAction={handleAction}
      onClose={handleClose}
    />
  );
}
