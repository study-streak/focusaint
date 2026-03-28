'use client';

import { useEffect, useCallback, useState } from 'react';
import notificationManager, { type InAppNotification } from '@/lib/notification-manager';
import { getNotificationPermission } from '@/lib/notifications';

interface UseNotificationManagerOptions {
  autoStart?: boolean;
  pollingFrequency?: number;
  onNotificationClick?: (reminderId: string, action: string) => void;
}

export function useNotificationManager(options: UseNotificationManagerOptions = {}) {
  const {
    autoStart = true,
    pollingFrequency = 60000,
    onNotificationClick,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  // Start polling
  const start = useCallback(() => {
    if (!isActive) {
      notificationManager.startPolling(pollingFrequency);
      setIsActive(true);
    }
  }, [isActive, pollingFrequency]);

  // Stop polling
  const stop = useCallback(() => {
    if (isActive) {
      notificationManager.stopPolling();
      setIsActive(false);
    }
  }, [isActive]);

  // Check for due reminders now
  const checkNow = useCallback(async () => {
    await notificationManager.checkNow();
  }, []);

  // Snooze a reminder
  const snooze = useCallback(async (reminderId: string, durationMinutes: number = 10) => {
    await notificationManager.snoozeReminder(reminderId, durationMinutes);
  }, []);

  // Dismiss a reminder
  const dismiss = useCallback(async (reminderId: string) => {
    await notificationManager.dismissReminder(reminderId);
  }, []);

  // Clear all in-app notifications
  const clearAll = useCallback(() => {
    notificationManager.clearInAppNotifications();
    setInAppNotifications([]);
  }, []);

  useEffect(() => {
    // Set permission status on client side only
    setPermissionStatus(getNotificationPermission());
    
    // Subscribe to in-app notifications
    const unsubscribeNotifications = notificationManager.onNotification((notification) => {
      setInAppNotifications((prev) => [notification, ...prev]);
    });

    // Subscribe to notification clicks
    const unsubscribeClicks = notificationManager.onNotificationClick((reminderId, action) => {
      if (onNotificationClick) {
        onNotificationClick(reminderId, action);
      }
    });

    // Load existing notifications
    setInAppNotifications(notificationManager.getInAppNotifications());

    // Auto-start if enabled
    if (autoStart) {
      start();
    }

    // Update permission status periodically
    const permissionInterval = setInterval(() => {
      setPermissionStatus(getNotificationPermission());
    }, 5000);

    return () => {
      unsubscribeNotifications();
      unsubscribeClicks();
      clearInterval(permissionInterval);
      
      // Don't stop polling on unmount - let it continue in background
      // Only stop when explicitly called or on logout
    };
  }, [autoStart, start, onNotificationClick]);

  return {
    isActive,
    inAppNotifications,
    permissionStatus,
    start,
    stop,
    checkNow,
    snooze,
    dismiss,
    clearAll,
  };
}
