'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Repeat,
  Bell,
  Edit
} from 'lucide-react';
import { ReminderService, type Reminder } from '@/lib/reminder-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ReminderEditDialog } from './reminder-edit-dialog';

export function ReminderList() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editReminder, setEditReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    loadReminders();
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

  const handleDelete = async (reminderId: string) => {
    try {
      await ReminderService.deleteReminder(reminderId);
      await loadReminders();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleEditSuccess = async () => {
    await loadReminders();
    setEditReminder(null);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      active: { variant: 'default', label: 'Active' },
      snoozed: { variant: 'secondary', label: 'Snoozed' },
      dismissed: { variant: 'outline', label: 'Dismissed' },
      expired: { variant: 'destructive', label: 'Expired' },
    };
    
    const { variant, label } = config[status] || { variant: 'default', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading reminders...</p>
        </div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No reminders yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first reminder to get notified about your study sessions
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {reminders.map((reminder) => (
          <Card key={reminder._id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Title and Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base">{reminder.title}</h3>
                    {getStatusBadge(reminder.status)}
                  </div>

                  {/* Message */}
                  {reminder.message && (
                    <p className="text-sm text-muted-foreground">
                      {reminder.message}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    {/* Scheduled Time */}
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(reminder.scheduledTime)}
                    </span>

                    {/* Recurrence */}
                    {reminder.recurrence && reminder.recurrence !== 'once' && (
                      <span className="flex items-center gap-1.5">
                        <Repeat className="h-3.5 w-3.5" />
                        {ReminderService.getRecurrenceDescription(reminder)}
                      </span>
                    )}

                    {/* Trigger Count */}
                    {reminder.triggerCount > 0 && (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Triggered {reminder.triggerCount}x
                      </span>
                    )}

                    {/* Created Date */}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Created {new Date(reminder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditReminder(reminder)}
                    className="shrink-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(reminder._id)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <ReminderEditDialog
        reminder={editReminder}
        open={!!editReminder}
        onOpenChange={(open) => !open && setEditReminder(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
