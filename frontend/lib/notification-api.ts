import { APIClient } from './api-client';
import type { NotificationPreferences } from './notifications';

interface NotificationPreferencesResponse {
  preferences: NotificationPreferences;
}

interface UpdateNotificationPreferencesResponse {
  message: string;
  preferences: NotificationPreferences;
}

/**
 * API client for notification preferences
 */
export const notificationAPI = {
  /**
   * Get user's notification preferences from the server
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await APIClient.get<NotificationPreferencesResponse>(
      '/user/notification-preferences'
    );
    return response.preferences;
  },

  /**
   * Update user's notification preferences on the server
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const response = await APIClient.put<UpdateNotificationPreferencesResponse>(
      '/user/notification-preferences',
      preferences
    );
    return response.preferences;
  },

  /**
   * Sync local preferences to server
   */
  async syncPreferences(preferences: NotificationPreferences): Promise<void> {
    await this.updatePreferences(preferences);
  },
};
