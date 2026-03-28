import { useState, useEffect, useCallback } from 'react';
import {
  ReminderService,
  Reminder,
  CreateReminderData,
  UpdateReminderData,
} from '../reminder-service';

interface UseRemindersOptions {
  autoFetch?: boolean;
  pollInterval?: number; // in milliseconds
  filters?: {
    status?: 'active' | 'snoozed' | 'dismissed' | 'expired';
    upcoming?: boolean;
  };
}

interface UseRemindersReturn {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  createReminder: (data: CreateReminderData) => Promise<Reminder | null>;
  updateReminder: (id: string, data: UpdateReminderData) => Promise<Reminder | null>;
  deleteReminder: (id: string) => Promise<boolean>;
  snoozeReminder: (id: string, durationMinutes: number) => Promise<Reminder | null>;
  dismissReminder: (id: string) => Promise<Reminder | null>;
  refreshReminders: () => Promise<void>;
  dueReminders: Reminder[];
}

export function useReminders(options: UseRemindersOptions = {}): UseRemindersReturn {
  const { autoFetch = true, pollInterval, filters } = options;

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ReminderService.getReminders(filters);
      setReminders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reminders';
      setError(errorMessage);
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create reminder
  const createReminder = useCallback(
    async (data: CreateReminderData): Promise<Reminder | null> => {
      try {
        setError(null);
        const validationErrors = ReminderService.validateReminderData(data);
        if (validationErrors.length > 0) {
          setError(validationErrors.join(', '));
          return null;
        }

        const newReminder = await ReminderService.createReminder(data);
        setReminders((prev) => [...prev, newReminder]);
        return newReminder;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create reminder';
        setError(errorMessage);
        console.error('Error creating reminder:', err);
        return null;
      }
    },
    []
  );

  // Update reminder
  const updateReminder = useCallback(
    async (id: string, data: UpdateReminderData): Promise<Reminder | null> => {
      try {
        setError(null);
        const validationErrors = ReminderService.validateReminderData(data);
        if (validationErrors.length > 0) {
          setError(validationErrors.join(', '));
          return null;
        }

        const updatedReminder = await ReminderService.updateReminder(id, data);
        setReminders((prev) =>
          prev.map((r) => (r._id === id ? updatedReminder : r))
        );
        return updatedReminder;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update reminder';
        setError(errorMessage);
        console.error('Error updating reminder:', err);
        return null;
      }
    },
    []
  );

  // Delete reminder
  const deleteReminder = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await ReminderService.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r._id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reminder';
      setError(errorMessage);
      console.error('Error deleting reminder:', err);
      return false;
    }
  }, []);

  // Snooze reminder
  const snoozeReminder = useCallback(
    async (id: string, durationMinutes: number): Promise<Reminder | null> => {
      try {
        setError(null);
        const snoozedReminder = await ReminderService.snoozeReminder(id, durationMinutes);
        setReminders((prev) =>
          prev.map((r) => (r._id === id ? snoozedReminder : r))
        );
        return snoozedReminder;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to snooze reminder';
        setError(errorMessage);
        console.error('Error snoozing reminder:', err);
        return null;
      }
    },
    []
  );

  // Dismiss reminder
  const dismissReminder = useCallback(async (id: string): Promise<Reminder | null> => {
    try {
      setError(null);
      const dismissedReminder = await ReminderService.dismissReminder(id);
      setReminders((prev) =>
        prev.map((r) => (r._id === id ? dismissedReminder : r))
      );
      return dismissedReminder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss reminder';
      setError(errorMessage);
      console.error('Error dismissing reminder:', err);
      return null;
    }
  }, []);

  // Refresh reminders
  const refreshReminders = useCallback(async () => {
    await fetchReminders();
  }, [fetchReminders]);

  // Get due reminders (client-side filtering)
  const dueReminders = reminders.filter((reminder) =>
    ReminderService.isReminderDue(reminder)
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchReminders();
    }
  }, [autoFetch, fetchReminders]);

  // Polling for updates
  useEffect(() => {
    if (pollInterval && pollInterval > 0) {
      const intervalId = setInterval(() => {
        fetchReminders();
      }, pollInterval);

      return () => clearInterval(intervalId);
    }
  }, [pollInterval, fetchReminders]);

  return {
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    dismissReminder,
    refreshReminders,
    dueReminders,
  };
}
