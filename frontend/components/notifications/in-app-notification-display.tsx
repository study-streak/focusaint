'use client';

import { useEffect, useState } from 'react';
import { X, Bell, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import type { InAppNotification } from '@/lib/notification-manager';

interface InAppNotificationDisplayProps {
  notifications: InAppNotification[];
  onAction: (reminderId: string, action: 'open' | 'snooze' | 'dismiss') => void;
  onClose: (notificationId: string) => void;
}

export function InAppNotificationDisplay({
  notifications,
  onAction,
  onClose,
}: InAppNotificationDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <Card className="shadow-lg border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm leading-tight mb-1">
                          {notification.title}
                        </h4>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground leading-snug">
                            {notification.message}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={() => onClose(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(notification.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        In-App Reminder
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {notification.actions.map((action) => (
                        <Button
                          key={action.action}
                          variant={action.variant || 'default'}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            onAction(notification.reminderId, action.action);
                            onClose(notification.id);
                          }}
                        >
                          {action.action === 'open' && <Bell className="h-3 w-3 mr-1" />}
                          {action.action === 'snooze' && <Clock className="h-3 w-3 mr-1" />}
                          {action.action === 'dismiss' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
