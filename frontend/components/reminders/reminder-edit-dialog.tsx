'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReminderService, type Reminder } from '@/lib/reminder-service';
import { cn } from '@/lib/utils';

interface ReminderEditDialogProps {
  reminder: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReminderEditDialog({
  reminder,
  open,
  onOpenChange,
  onSuccess,
}: ReminderEditDialogProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'custom'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when reminder changes
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setMessage(reminder.message || '');
      
      const scheduledDate = new Date(reminder.scheduledTime);
      setDate(scheduledDate);
      
      const hours = scheduledDate.getHours().toString().padStart(2, '0');
      const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      
      setRecurrence(reminder.recurrence);
      setError(null);
    }
  }, [reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reminder) return;

    // Validation
    if (!title.trim()) {
      setError('Please enter a title for your reminder');
      return;
    }

    if (!date) {
      setError('Please select a date for your reminder');
      return;
    }

    if (!time) {
      setError('Please select a time for your reminder');
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(date);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Check if the time is in the past
      if (scheduledTime < new Date()) {
        setError('Please select a future date and time');
        setLoading(false);
        return;
      }

      // Update reminder
      await ReminderService.updateReminder(reminder._id, {
        title: title.trim(),
        message: message.trim() || undefined,
        scheduledTime: scheduledTime.toISOString(),
        recurrence,
      });

      // Call success callback
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return 'Pick a date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Reminder</DialogTitle>
          <DialogDescription>
            Update your reminder details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder="e.g., Morning Study Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              A short, descriptive title for your reminder
            </p>
          </div>

          {/* Message (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="edit-message">Message (Optional)</Label>
            <Textarea
              id="edit-message"
              placeholder="e.g., Time to review yesterday's notes"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Additional details or motivation for this reminder
            </p>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateForDisplay(date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label htmlFor="edit-time">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="edit-recurrence">Recurrence</Label>
            <Select value={recurrence} onValueChange={(value: any) => setRecurrence(value)} disabled={loading}>
              <SelectTrigger id="edit-recurrence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One time only</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {recurrence === 'none' && 'This reminder will trigger only once'}
              {recurrence === 'daily' && 'This reminder will repeat every day at the same time'}
              {recurrence === 'weekly' && 'This reminder will repeat every week on the same day'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Updating...
                </>
              ) : (
                'Update Reminder'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
