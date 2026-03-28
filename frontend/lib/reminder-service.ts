import { APIClient } from './api-client';

export interface ReminderPreferences {
  sound?: boolean;
  vibration?: boolean;
  badge?: boolean;
}

export interface CustomRecurrence {
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  interval?: number;
  unit?: 'days' | 'weeks' | 'months';
}

export interface Reminder {
  _id: string;
  userId: string;
  title: string;
  message?: string;
  scheduledTime: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'custom';
  customRecurrence?: CustomRecurrence;
  status: 'active' | 'snoozed' | 'dismissed' | 'expired';
  preferences?: ReminderPreferences;
  snoozeUntil?: string;
  snoozeDuration?: number;
  lastTriggeredAt?: string;
  dismissedAt?: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderData {
  title: string;
  message?: string;
  scheduledTime: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'custom';
  customRecurrence?: CustomRecurrence;
  preferences?: ReminderPreferences;
  snoozeDuration?: number;
}

export interface UpdateReminderData {
  title?: string;
  message?: string;
  scheduledTime?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'custom';
  customRecurrence?: CustomRecurrence;
  preferences?: ReminderPreferences;
  snoozeDuration?: number;
  status?: 'active' | 'snoozed' | 'dismissed' | 'expired';
}

export interface ReminderListResponse {
  success: boolean;
  data: Reminder[];
  count: number;
}

export interface ReminderResponse {
  success: boolean;
  data: Reminder;
  message?: string;
}

export class ReminderService {
  /**
   * Create a new reminder
   */
  static async createReminder(data: CreateReminderData): Promise<Reminder> {
    const response = await APIClient.request<ReminderResponse>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Get all reminders for the authenticated user
   */
  static async getReminders(filters?: {
    status?: 'active' | 'snoozed' | 'dismissed' | 'expired';
    upcoming?: boolean;
  }): Promise<Reminder[]> {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.upcoming !== undefined) {
      params.append('upcoming', filters.upcoming.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/reminders?${queryString}` : '/reminders';

    const response = await APIClient.request<ReminderListResponse>(endpoint);
    return response.data;
  }

  /**
   * Get a specific reminder by ID
   */
  static async getReminder(id: string): Promise<Reminder> {
    const response = await APIClient.request<ReminderResponse>(`/reminders/${id}`);
    return response.data;
  }

  /**
   * Update a reminder
   */
  static async updateReminder(id: string, data: UpdateReminderData): Promise<Reminder> {
    const response = await APIClient.request<ReminderResponse>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Delete a reminder
   */
  static async deleteReminder(id: string): Promise<void> {
    await APIClient.request<{ success: boolean; message: string }>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Snooze a reminder
   */
  static async snoozeReminder(id: string, durationMinutes: number): Promise<Reminder> {
    const response = await APIClient.request<ReminderResponse>(`/reminders/${id}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ duration: durationMinutes }),
    });
    return response.data;
  }

  /**
   * Dismiss a reminder
   */
  static async dismissReminder(id: string): Promise<Reminder> {
    const response = await APIClient.request<ReminderResponse>(`/reminders/${id}/dismiss`, {
      method: 'POST',
    });
    return response.data;
  }

  /**
   * Get upcoming reminders (next 24 hours)
   */
  static async getUpcomingReminders(): Promise<Reminder[]> {
    return this.getReminders({ upcoming: true });
  }

  /**
   * Get active reminders
   */
  static async getActiveReminders(): Promise<Reminder[]> {
    return this.getReminders({ status: 'active' });
  }

  /**
   * Get due reminders (reminders that should trigger now)
   */
  static async getDueReminders(): Promise<Reminder[]> {
    const response = await APIClient.request<ReminderListResponse>('/reminders/due');
    return response.data;
  }

  /**
   * Get upcoming reminders (next 24 hours)
   */
  static async getUpcomingRemindersDetailed(): Promise<Reminder[]> {
    const response = await APIClient.request<ReminderListResponse>('/reminders/upcoming');
    return response.data;
  }

  /**
   * Mark reminders as notified (track delivery)
   */
  static async markAsNotified(reminderIds: string[]): Promise<void> {
    await APIClient.request<{ success: boolean; message: string }>('/reminders/notified', {
      method: 'POST',
      body: JSON.stringify({ reminderIds }),
    });
  }

  /**
   * Check if a reminder is due (client-side check)
   */
  static isReminderDue(reminder: Reminder): boolean {
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledTime);

    if (reminder.status === 'snoozed' && reminder.snoozeUntil) {
      const snoozeUntil = new Date(reminder.snoozeUntil);
      return now >= snoozeUntil;
    }

    if (reminder.status === 'active') {
      return now >= scheduledTime;
    }

    return false;
  }

  /**
   * Format reminder time for display
   */
  static formatReminderTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 0) {
      return 'Overdue';
    } else if (diffMins < 60) {
      return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Get recurrence description
   */
  static getRecurrenceDescription(reminder: Reminder): string {
    switch (reminder.recurrence) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'custom':
        if (reminder.customRecurrence?.daysOfWeek && reminder.customRecurrence.daysOfWeek.length > 0) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const days = reminder.customRecurrence.daysOfWeek
            .map(d => dayNames[d])
            .join(', ');
          return `Every ${days}`;
        } else if (reminder.customRecurrence?.interval && reminder.customRecurrence?.unit) {
          const { interval, unit } = reminder.customRecurrence;
          return `Every ${interval} ${unit}`;
        }
        return 'Custom';
      default:
        return 'Once';
    }
  }

  /**
   * Validate reminder data before submission
   */
  static validateReminderData(data: CreateReminderData | UpdateReminderData): string[] {
    const errors: string[] = [];

    if ('title' in data && data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push('Title is required');
      } else if (data.title.length > 100) {
        errors.push('Title must be 100 characters or less');
      }
    }

    if ('message' in data && data.message && data.message.length > 500) {
      errors.push('Message must be 500 characters or less');
    }

    if ('scheduledTime' in data && data.scheduledTime) {
      const scheduledDate = new Date(data.scheduledTime);
      if (isNaN(scheduledDate.getTime())) {
        errors.push('Invalid scheduled time');
      } else if (scheduledDate <= new Date()) {
        errors.push('Scheduled time must be in the future');
      }
    }

    if ('snoozeDuration' in data && data.snoozeDuration !== undefined) {
      if (data.snoozeDuration < 1 || data.snoozeDuration > 1440) {
        errors.push('Snooze duration must be between 1 and 1440 minutes');
      }
    }

    return errors;
  }
}
