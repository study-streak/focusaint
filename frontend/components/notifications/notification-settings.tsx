'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  loadNotificationPreferences,
  saveNotificationPreferences,
  isNotificationSupported,
  type NotificationPermissionStatus,
} from '@/lib/notifications';
import { notificationAPI } from '@/lib/notification-api';

interface NotificationSettingsProps {
  onPreferencesChange?: (enabled: boolean) => void;
}

export function NotificationSettings({ onPreferencesChange }: NotificationSettingsProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showTestSuccess, setShowTestSuccess] = useState(false);

  useEffect(() => {
    // Load current status
    const status = getNotificationPermission();
    setPermissionStatus(status);

    // Load preferences
    const preferences = loadNotificationPreferences();
    if (preferences) {
      setNotificationsEnabled(preferences.enabled && status === 'granted');
    }
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled && permissionStatus !== 'granted') {
      // Need to request permission first
      setIsRequesting(true);
      const status = await requestNotificationPermission();
      setPermissionStatus(status);
      setIsRequesting(false);

      if (status === 'granted') {
        setNotificationsEnabled(true);
        const preferences = {
          browserPermission: status,
          enabled: true,
          lastPromptedAt: new Date(),
        };
        saveNotificationPreferences(preferences);
        
        // Sync to backend
        try {
          await notificationAPI.updatePreferences(preferences);
        } catch (error) {
          console.error('Failed to sync notification preferences to server:', error);
        }
        
        onPreferencesChange?.(true);
      }
    } else {
      // Just toggle the preference
      setNotificationsEnabled(enabled);
      const preferences = loadNotificationPreferences() || {
        browserPermission: permissionStatus,
        enabled,
      };
      const updatedPreferences = {
        ...preferences,
        enabled,
      };
      saveNotificationPreferences(updatedPreferences);
      
      // Sync to backend
      try {
        await notificationAPI.updatePreferences(updatedPreferences);
      } catch (error) {
        console.error('Failed to sync notification preferences to server:', error);
      }
      
      onPreferencesChange?.(enabled);
    }
  };

  const handleTestNotification = () => {
    sendTestNotification();
    setShowTestSuccess(true);
    setTimeout(() => setShowTestSuccess(false), 3000);
  };

  const getStatusMessage = () => {
    if (!isNotificationSupported()) {
      return {
        type: 'warning' as const,
        icon: AlertCircle,
        message: 'Your browser does not support notifications. You will see in-app reminders instead when you\'re using the app.',
      };
    }

    if (permissionStatus === 'denied') {
      return {
        type: 'warning' as const,
        icon: BellOff,
        message: 'Browser notifications are blocked. Don\'t worry - you\'ll still see in-app reminders when you\'re using the app. To enable browser notifications (which work even when the app is closed), please update your browser settings.',
      };
    }

    if (permissionStatus === 'granted' && notificationsEnabled) {
      return {
        type: 'success' as const,
        icon: CheckCircle2,
        message: 'Browser notifications are enabled. You will receive reminders even when the app is closed.',
      };
    }

    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how you receive reminders for your study sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-toggle" className="text-base">
              Browser Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive reminders even when the app is closed
            </p>
          </div>
          <Switch
            id="notifications-toggle"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isRequesting || permissionStatus === 'unsupported'}
          />
        </div>

        {statusMessage && (
          <Alert className={
            statusMessage.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
            'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
          }>
            <statusMessage.icon className={`h-4 w-4 ${
              statusMessage.type === 'success' ? 'text-green-600' :
              'text-yellow-600'
            }`} />
            <AlertDescription className={
              statusMessage.type === 'success' ? 'text-green-600 dark:text-green-400' :
              'text-yellow-600 dark:text-yellow-400'
            }>
              {statusMessage.message}
            </AlertDescription>
          </Alert>
        )}

        {showTestSuccess && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Test notification sent! Check your notifications.
            </AlertDescription>
          </Alert>
        )}

        {permissionStatus === 'granted' && notificationsEnabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            className="w-full sm:w-auto"
          >
            Send Test Notification
          </Button>
        )}

        <div className="pt-2 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">About Notifications</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Reminders are sent at your scheduled study times</li>
            <li>You can snooze or dismiss reminders</li>
            <li>Browser notifications work even when the app is closed</li>
            <li>In-app notifications appear when you're using the app</li>
            <li>You can disable notifications anytime</li>
          </ul>
          
          {(permissionStatus === 'denied' || permissionStatus === 'unsupported') && (
            <div className="mt-3 p-3 rounded-md bg-muted">
              <p className="font-medium text-foreground mb-1">In-App Reminders Active</p>
              <p className="text-xs">
                Since browser notifications are {permissionStatus === 'denied' ? 'blocked' : 'not supported'}, 
                you'll see reminder cards in the top-right corner when you're using the app. 
                These work just like browser notifications with snooze and dismiss options.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
