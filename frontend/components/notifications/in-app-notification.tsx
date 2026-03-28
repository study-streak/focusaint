'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import notificationManager, { type InAppNotification } from '@/lib/notification-manager';
import { cn } from '@/lib/utils';

interface InAppNotificationProps {
  notification: InAppNotification;
  onAction?: (reminderId: string, action: string) => void;
  onClose?: (notificationId: string) => void;
}

export function InAppNotificationItem({
  notification,
  onAction,
  onClose,
}: InAppNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleAction = async (action: string) => {
    setIsClosing(true);
    
    if (onAction) {
      onAction(notification.reminderId, action);
    } else {
      // Default action handling
      switch (action) {
        case 'open':
          // Navigate to reminders or dashboard
          window.location.href = '/dashboard';
          break;
        case 'snooze':
          await notificationManager.snoozeReminder(notification.reminderId, 10);
          break;
        case 'dismiss':
          await notificationManager.dismissReminder(notification.reminderId);
          break;
      }
    }

    // Close notification after action
    setTimeout(() => {
      onClose?.(notification.id);
    }, 300);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.(notification.id);
    }, 300);
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-4 border-l-primary shadow-lg transition-all duration-300',
        isClosing && 'opacity-0 translate-x-full'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{notification.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {notification.message && (
          <CardDescription className="text-sm mt-1">
            {notification.message}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {notification.actions.map((action) => (
            <Button
              key={action.action}
              variant={action.variant || 'default'}
              size="sm"
              onClick={() => handleAction(action.action)}
              className="text-xs"
            >
              {action.action === 'open' && <CheckCircle className="h-3 w-3 mr-1" />}
              {action.action === 'snooze' && <Clock className="h-3 w-3 mr-1" />}
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface InAppNotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  onAction?: (reminderId: string, action: string) => void;
}

export function InAppNotificationContainer({
  position = 'top-right',
  maxNotifications = 5,
  onAction,
}: InAppNotificationContainerProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    // Subscribe to new notifications
    const unsubscribe = notificationManager.onNotification((notification) => {
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        // Limit number of notifications
        return updated.slice(0, maxNotifications);
      });
    });

    // Load existing notifications
    setNotifications(notificationManager.getInAppNotifications());

    return () => {
      unsubscribe();
    };
  }, [maxNotifications]);

  const handleClose = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  if (notifications.length === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3 w-full max-w-sm p-4 pointer-events-none',
        positionClasses[position]
      )}
    >
      <div className="space-y-3 pointer-events-auto">
        {notifications.map((notification) => (
          <InAppNotificationItem
            key={notification.id}
            notification={notification}
            onAction={onAction}
            onClose={handleClose}
          />
        ))}
      </div>
    </div>
  );
}
