'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getNotificationPermission,
  shouldPromptForPermission,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/notifications';
import { notificationAPI } from '@/lib/notification-api';
import { NotificationPermissionDialog } from './notification-permission-dialog';

export function NotificationPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    const preferences = loadNotificationPreferences();
    const permission = getNotificationPermission();

    // Don't show if already granted, denied, or unsupported
    if (permission === 'granted' || permission === 'denied' || permission === 'unsupported') {
      return;
    }

    // Check if we should prompt based on last prompt time
    if (shouldPromptForPermission(preferences?.lastPromptedAt)) {
      setShowBanner(true);
    }
  }, []);

  const handleEnableClick = () => {
    setShowDialog(true);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);

    // Save that we prompted the user
    const preferences = loadNotificationPreferences() || {
      browserPermission: 'default',
      enabled: false,
    };
    
    saveNotificationPreferences({
      ...preferences,
      lastPromptedAt: new Date(),
    });
  };

  const handlePermissionGranted = async () => {
    const preferences = loadNotificationPreferences() || {
      browserPermission: 'granted',
      enabled: true,
    };
    
    const updatedPreferences = {
      ...preferences,
      browserPermission: 'granted' as const,
      enabled: true,
      lastPromptedAt: new Date(),
    };
    
    saveNotificationPreferences(updatedPreferences);
    
    // Sync to backend
    try {
      await notificationAPI.updatePreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to sync notification preferences to server:', error);
    }
  };

  const handlePermissionDenied = async () => {
    const preferences = loadNotificationPreferences() || {
      browserPermission: 'denied',
      enabled: false,
    };
    
    const updatedPreferences = {
      ...preferences,
      browserPermission: 'denied' as const,
      enabled: false,
      lastPromptedAt: new Date(),
    };
    
    saveNotificationPreferences(updatedPreferences);
    
    // Sync to backend
    try {
      await notificationAPI.updatePreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to sync notification preferences to server:', error);
    }
  };

  if (!showBanner || dismissed) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/20 bg-primary/5 p-4 mb-4">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-sm">Enable Study Reminders</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when it's time for your scheduled study sessions and never miss a day.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEnableClick}>
                Enable Notifications
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Not Now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <NotificationPermissionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    </>
  );
}
