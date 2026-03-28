'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  type NotificationPermissionStatus,
} from '@/lib/notifications';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: (status: NotificationPermissionStatus) => void;
  onPermissionDenied?: () => void;
}

export function NotificationPermissionDialog({
  open,
  onOpenChange,
  onPermissionGranted,
  onPermissionDenied,
}: NotificationPermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default');
  const [showTestSuccess, setShowTestSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setPermissionStatus(getNotificationPermission());
    }
  }, [open]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const status = await requestNotificationPermission();
      setPermissionStatus(status);

      if (status === 'granted') {
        // Send a test notification
        sendTestNotification();
        setShowTestSuccess(true);
        
        // Call success callback
        onPermissionGranted?.(status);

        // Close dialog after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
          setShowTestSuccess(false);
        }, 2000);
      } else if (status === 'denied') {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <DialogTitle>Enable Study Reminders</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Stay on track with your study goals by enabling browser notifications.
            We'll remind you when it's time for your scheduled study sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {permissionStatus === 'unsupported' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your browser doesn't support notifications. You'll see in-app reminders instead.
              </AlertDescription>
            </Alert>
          )}

          {permissionStatus === 'denied' && (
            <Alert>
              <BellOff className="h-4 w-4" />
              <AlertDescription>
                Notifications are blocked. To enable them, please update your browser settings
                and allow notifications for this site.
              </AlertDescription>
            </Alert>
          )}

          {showTestSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <Bell className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                Success! Check your notification to see how reminders will appear.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Why enable notifications?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Never miss a scheduled study session</li>
              <li>Build consistent study habits</li>
              <li>Get timely reminders even when the app is closed</li>
              <li>Maintain your streak with gentle nudges</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isRequesting}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleRequestPermission}
            disabled={isRequesting || permissionStatus === 'granted' || permissionStatus === 'unsupported'}
            className="w-full sm:w-auto"
          >
            {isRequesting ? (
              <>Requesting...</>
            ) : permissionStatus === 'granted' ? (
              <>Enabled</>
            ) : (
              <>Enable Notifications</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
