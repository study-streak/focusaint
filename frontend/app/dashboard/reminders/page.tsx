'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Clock, CheckCircle, Trash2, Plus, Settings } from 'lucide-react';
import { ReminderService, type Reminder } from '@/lib/reminder-service';
import { useRouter } from 'next/navigation';
import { useNotificationManager } from '@/hooks/use-notification-manager';
import { 
  getNotificationPermission, 
  requestNotificationPermission,
  sendTestNotification 
} from '@/lib/notifications';

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  const {
    isActive,
    inAppNotifications,
    start,
    stop,
    checkNow,
    snooze,
    dismiss,
  } = useNotificationManager({
    autoStart: true,
    pollingFrequency: 60000, // Check every minute
  });

  useEffect(() => {
    loadReminders();
    // Set permission status on client side only
    setPermissionStatus(getNotificationPermission());
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await ReminderService.getReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      sendTestNotification();
    }
  };

  const handleTestNotification = () => {
    sendTestNotification();
  };

  const handleCheckNow = async () => {
    await checkNow();
  };

  const handleSnooze = async (reminderId: string) => {
    await snooze(reminderId, 10);
    await loadReminders();
  };

  const handleDismiss = async (reminderId: string) => {
    await dismiss(reminderId);
    await loadReminders();
  };

  const handleDelete = async (reminderId: string) => {
    try {
      await ReminderService.deleteReminder(reminderId);
      await loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      snoozed: 'secondary',
      dismissed: 'outline',
      expired: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">Manage your study reminders and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/reminders/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Reminder
          </Button>
        </div>
      </div>

      {/* Notification Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Status
          </CardTitle>
          <CardDescription>
            Manage your notification preferences and test notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-muted-foreground">
                Status: {permissionStatus === 'granted' ? 'Enabled' : 
                         permissionStatus === 'denied' ? 'Blocked' : 
                         permissionStatus === 'unsupported' ? 'Not Supported' : 'Not Enabled'}
              </p>
            </div>
            {permissionStatus === 'default' && (
              <Button onClick={handleRequestPermission}>
                Enable Notifications
              </Button>
            )}
            {permissionStatus === 'granted' && (
              <Button variant="outline" onClick={handleTestNotification}>
                Test Notification
              </Button>
            )}
          </div>

          {(permissionStatus === 'denied' || permissionStatus === 'unsupported') && (
            <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <div className="flex gap-2">
                <Bell className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">
                    In-App Reminders Active
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    {permissionStatus === 'denied' 
                      ? 'Browser notifications are blocked. You\'ll see reminder cards in the top-right corner when using the app.'
                      : 'Your browser doesn\'t support notifications. You\'ll see reminder cards in the top-right corner when using the app.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reminder Polling</p>
              <p className="text-sm text-muted-foreground">
                Status: {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="flex gap-2">
              {isActive ? (
                <Button variant="outline" onClick={stop}>
                  <BellOff className="h-4 w-4 mr-2" />
                  Stop Polling
                </Button>
              ) : (
                <Button onClick={start}>
                  <Bell className="h-4 w-4 mr-2" />
                  Start Polling
                </Button>
              )}
              <Button variant="secondary" onClick={handleCheckNow}>
                Check Now
              </Button>
            </div>
          </div>

          {inAppNotifications.length > 0 && (
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                Active In-App Notifications: {inAppNotifications.length}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Check the top-right corner of your screen to see and interact with your reminders.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Reminders</CardTitle>
          <CardDescription>
            {reminders.length} reminder(s) total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading reminders...</p>
          ) : reminders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reminders yet. Create your first reminder to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <Card key={reminder._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{reminder.title}</h3>
                          {getStatusBadge(reminder.status)}
                        </div>
                        {reminder.message && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {reminder.message}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {ReminderService.formatReminderTime(reminder.scheduledTime)}
                          </span>
                          <span>
                            {ReminderService.getRecurrenceDescription(reminder)}
                          </span>
                          {reminder.triggerCount > 0 && (
                            <span>Triggered {reminder.triggerCount} time(s)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {reminder.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSnooze(reminder._id)}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Snooze
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDismiss(reminder._id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Dismiss
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reminder._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
