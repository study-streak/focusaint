/**
 * Notification Manager
 * Handles browser notification API integration, polling for due reminders,
 * and displaying notifications with action buttons
 */

import { ReminderService, type Reminder } from './reminder-service';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  showNotification 
} from './notifications';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  data?: any;
}

export interface InAppNotification {
  id: string;
  reminderId: string;
  title: string;
  message?: string;
  timestamp: Date;
  actions: Array<{
    label: string;
    action: 'open' | 'snooze' | 'dismiss';
    variant?: 'default' | 'secondary' | 'outline';
  }>;
}

type NotificationCallback = (notification: InAppNotification) => void;
type NotificationClickCallback = (reminderId: string, action: string) => void;

class NotificationManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private pollingFrequency = 60000; // 1 minute
  private processedReminders = new Set<string>();
  private inAppNotifications: InAppNotification[] = [];
  private listeners: NotificationCallback[] = [];
  private clickListeners: NotificationClickCallback[] = [];
  private isPolling = false;

  /**
   * Start polling for due reminders
   */
  startPolling(frequencyMs: number = 60000): void {
    if (this.isPolling) {
      console.warn('Notification polling is already active');
      return;
    }

    this.pollingFrequency = frequencyMs;
    this.isPolling = true;

    // Check immediately
    this.checkDueReminders();

    // Then check at intervals
    this.pollingInterval = setInterval(() => {
      this.checkDueReminders();
    }, this.pollingFrequency);

    console.log(`Notification polling started (every ${frequencyMs}ms)`);
  }

  /**
   * Stop polling for reminders
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('Notification polling stopped');
    }
  }

  /**
   * Check for due reminders and display notifications
   */
  private async checkDueReminders(): Promise<void> {
    try {
      // Get due reminders from the API
      const dueReminders = await ReminderService.getDueReminders();

      // Filter for reminders we haven't processed yet
      const newDueReminders = dueReminders.filter(reminder => {
        return !this.processedReminders.has(reminder._id);
      });

      if (newDueReminders.length === 0) {
        return;
      }

      console.log(`Found ${newDueReminders.length} new due reminders`);

      // Display notifications for due reminders
      const notifiedIds: string[] = [];
      for (const reminder of newDueReminders) {
        await this.displayNotification(reminder);
        this.processedReminders.add(reminder._id);
        notifiedIds.push(reminder._id);
      }

      // Mark reminders as notified on the server
      if (notifiedIds.length > 0) {
        try {
          await ReminderService.markAsNotified(notifiedIds);
        } catch (error) {
          console.error('Error marking reminders as notified:', error);
        }
      }

      // Clean up processed reminders
      this.cleanupProcessedReminders(dueReminders);
    } catch (error) {
      console.error('Error checking due reminders:', error);
    }
  }

  /**
   * Display a notification for a reminder
   */
  private async displayNotification(reminder: Reminder): Promise<void> {
    const permission = getNotificationPermission();

    if (permission === 'granted' && isNotificationSupported()) {
      // Display browser notification
      this.displayBrowserNotification(reminder);
    } else {
      // Fallback to in-app notification
      this.displayInAppNotification(reminder);
    }
  }

  /**
   * Display a browser notification with action buttons
   */
  private displayBrowserNotification(reminder: Reminder): void {
    try {
      const options: NotificationOptions = {
        body: reminder.message || 'Time for your scheduled activity',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `reminder-${reminder._id}`,
        requireInteraction: true,
        silent: !reminder.preferences?.sound,
        vibrate: reminder.preferences?.vibration ? [200, 100, 200] : undefined,
        data: {
          reminderId: reminder._id,
          timestamp: new Date().toISOString(),
        },
        actions: [
          { action: 'open', title: 'Open', icon: '/icons/open.png' },
          { action: 'snooze', title: 'Snooze 10m', icon: '/icons/snooze.png' },
          { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
        ],
      };

      const notification = new Notification(reminder.title, options);

      // Handle notification click
      notification.onclick = () => {
        this.handleNotificationClick(reminder._id, 'open');
        notification.close();
      };

      // Handle action button clicks (requires service worker)
      // Note: Action buttons only work with service worker notifications
      // For now, we'll handle clicks in the service worker

      console.log('Browser notification displayed:', reminder.title);
    } catch (error) {
      console.error('Error displaying browser notification:', error);
      // Fallback to in-app notification
      this.displayInAppNotification(reminder);
    }
  }

  /**
   * Display an in-app notification (fallback)
   */
  private displayInAppNotification(reminder: Reminder): void {
    const inAppNotification: InAppNotification = {
      id: `in-app-${reminder._id}-${Date.now()}`,
      reminderId: reminder._id,
      title: reminder.title,
      message: reminder.message,
      timestamp: new Date(),
      actions: [
        { label: 'Open', action: 'open', variant: 'default' },
        { label: 'Snooze 10m', action: 'snooze', variant: 'secondary' },
        { label: 'Dismiss', action: 'dismiss', variant: 'outline' },
      ],
    };

    this.inAppNotifications.push(inAppNotification);
    this.notifyListeners(inAppNotification);

    console.log('In-app notification displayed:', reminder.title);
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(reminderId: string, action: string): void {
    console.log(`Notification clicked: ${reminderId}, action: ${action}`);

    // Notify click listeners
    this.clickListeners.forEach(listener => {
      try {
        listener(reminderId, action);
      } catch (error) {
        console.error('Error in notification click listener:', error);
      }
    });

    // Handle default actions
    switch (action) {
      case 'open':
        // Open the app or navigate to reminders page
        if (typeof window !== 'undefined') {
          window.focus();
          // You can navigate to a specific page here
          // window.location.href = '/dashboard/reminders';
        }
        break;

      case 'snooze':
        this.snoozeReminder(reminderId, 10);
        break;

      case 'dismiss':
        this.dismissReminder(reminderId);
        break;
    }
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId: string, durationMinutes: number = 10): Promise<void> {
    try {
      await ReminderService.snoozeReminder(reminderId, durationMinutes);
      
      // Remove from processed set so it can trigger again
      this.processedReminders.delete(reminderId);
      
      // Remove from in-app notifications
      this.removeInAppNotification(reminderId);
      
      console.log(`Reminder snoozed: ${reminderId} for ${durationMinutes} minutes`);
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  }

  /**
   * Dismiss a reminder
   */
  async dismissReminder(reminderId: string): Promise<void> {
    try {
      await ReminderService.dismissReminder(reminderId);
      
      // Remove from in-app notifications
      this.removeInAppNotification(reminderId);
      
      console.log(`Reminder dismissed: ${reminderId}`);
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  }

  /**
   * Remove an in-app notification
   */
  private removeInAppNotification(reminderId: string): void {
    this.inAppNotifications = this.inAppNotifications.filter(
      n => n.reminderId !== reminderId
    );
  }

  /**
   * Clean up old processed reminders
   */
  private cleanupProcessedReminders(currentReminders: Reminder[]): void {
    const currentReminderIds = new Set(currentReminders.map(r => r._id));
    
    // Remove processed reminders that no longer exist
    this.processedReminders.forEach(id => {
      if (!currentReminderIds.has(id)) {
        this.processedReminders.delete(id);
      }
    });

    // Limit size to prevent memory issues
    if (this.processedReminders.size > 1000) {
      const idsArray = Array.from(this.processedReminders);
      const toKeep = idsArray.slice(-500);
      this.processedReminders = new Set(toKeep);
    }
  }

  /**
   * Subscribe to in-app notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Subscribe to notification click events
   */
  onNotificationClick(callback: NotificationClickCallback): () => void {
    this.clickListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.clickListeners = this.clickListeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of a new in-app notification
   */
  private notifyListeners(notification: InAppNotification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Get all current in-app notifications
   */
  getInAppNotifications(): InAppNotification[] {
    return [...this.inAppNotifications];
  }

  /**
   * Clear all in-app notifications
   */
  clearInAppNotifications(): void {
    this.inAppNotifications = [];
  }

  /**
   * Manually trigger a check for due reminders
   */
  async checkNow(): Promise<void> {
    await this.checkDueReminders();
  }

  /**
   * Reset the manager (useful for testing or logout)
   */
  reset(): void {
    this.stopPolling();
    this.processedReminders.clear();
    this.inAppNotifications = [];
    this.listeners = [];
    this.clickListeners = [];
  }

  /**
   * Get polling status
   */
  isActive(): boolean {
    return this.isPolling;
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
