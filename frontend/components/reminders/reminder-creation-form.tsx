'use client';

import { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReminderService } from '@/lib/reminder-service';
import { cn } from '@/lib/utils';

interface ReminderCreationFormProps {
  onSuccess?: () => void;
}

export function ReminderCreationForm({ onSuccess }: ReminderCreationFormProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'weekdays'>('once');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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

      // Create reminder
      await ReminderService.createReminder({
        title: title.trim(),
        message: message.trim() || undefined,
        scheduledTime,
        recurrence,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setDate(undefined);
      setTime('09:00');
      setRecurrence('once');
      setSuccess(true);

      // Call success callback
      onSuccess?.();

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create reminder. Please try again.');
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
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
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
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
          <Label htmlFor="time">
            Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Recurrence */}
      <div className="space-y-2">
        <Label htmlFor="recurrence">Recurrence</Label>
        <Select value={recurrence} onValueChange={(value: any) => setRecurrence(value)} disabled={loading}>
          <SelectTrigger id="recurrence">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">One time only</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {recurrence === 'once' && 'This reminder will trigger only once'}
          {recurrence === 'daily' && 'This reminder will repeat every day at the same time'}
          {recurrence === 'weekdays' && 'This reminder will repeat Monday through Friday'}
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

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            Reminder created successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Creating...
          </>
        ) : (
          'Create Reminder'
        )}
      </Button>
    </form>
  );
}
