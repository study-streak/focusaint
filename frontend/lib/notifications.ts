/**
 * Notification utility library for managing browser notifications
 * Handles permission requests, status checks, and notification display
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationPreferences {
  browserPermission: NotificationPermissionStatus;
  enabled: boolean;
  lastPromptedAt?: Date;
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission from the user
 * Returns the permission status after the request
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

/**
 * Check if we should prompt the user for notification permission
 * Avoids prompting too frequently
 */
export function shouldPromptForPermission(lastPromptedAt?: Date): boolean {
  if (!isNotificationSupported()) {
    return false;
  }

  const permission = getNotificationPermission();
  
  // Don't prompt if already granted or explicitly denied
  if (permission === 'granted' || permission === 'denied') {
    return false;
  }

  // If never prompted, allow prompting
  if (!lastPromptedAt) {
    return true;
  }

  // Only prompt again after 7 days
  const daysSinceLastPrompt = (Date.now() - new Date(lastPromptedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastPrompt >= 7;
}

/**
 * Store notification preferences in localStorage
 */
export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
}

/**
 * Load notification preferences from localStorage
 */
export function loadNotificationPreferences(): NotificationPreferences | null {
  try {
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading notification preferences:', error);
  }
  return null;
}

/**
 * Test notification to verify permissions are working
 */
export function sendTestNotification(): void {
  showNotification('Focusaint Reminder', {
    body: 'Notifications are working! You\'ll receive reminders for your study sessions.',
    tag: 'test-notification',
  });
}
