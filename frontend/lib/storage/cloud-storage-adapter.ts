/**
 * Cloud Storage Adapter
 * 
 * Implements storage using backend API for premium tier users.
 * Data is synced to the cloud and accessible across devices.
 * 
 * Requirements: Req 11 - Cloud Sync
 * Design: CloudStorageAdapter implementation
 */

import {
  StorageAdapter,
  StorageUsage,
  StorageError,
  StorageErrorCode,
} from './storage-adapter';
import { APIClient } from '../api-client';

interface SyncQueueItem {
  key: string;
  data: any;
  operation: 'save' | 'delete';
  timestamp: number;
}

export class CloudStorageAdapter implements StorageAdapter {
  private syncQueue: SyncQueueItem[] = [];
  private syncInProgress: boolean = false;
  private syncInterval: number = 5000; // 5 seconds as per Req 11
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start automatic sync on initialization
    this.startAutoSync();
  }

  async save(key: string, data: any): Promise<void> {
    try {
      // Add to sync queue for background sync
      this.addToSyncQueue(key, data, 'save');

      // Attempt immediate save to cloud
      await APIClient.post('/storage/save', { key, data });
    } catch (error) {
      // If immediate save fails, keep in queue for retry
      if (error instanceof Error) {
        throw new StorageError(
          `Failed to save data to cloud: ${error.message}`,
          StorageErrorCode.NETWORK_ERROR,
          { key, originalError: error }
        );
      }
      throw error;
    }
  }

  async load(key: string): Promise<any> {
    try {
      const response = await APIClient.get<{ data: any }>(`/storage/load/${encodeURIComponent(key)}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a 404 (not found)
        if (error.message.includes('404') || error.message.includes('not found')) {
          return null;
        }

        throw new StorageError(
          `Failed to load data from cloud: ${error.message}`,
          StorageErrorCode.NETWORK_ERROR,
          { key, originalError: error }
        );
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // Add to sync queue
      this.addToSyncQueue(key, null, 'delete');

      // Attempt immediate delete
      await APIClient.delete(`/storage/delete/${encodeURIComponent(key)}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(
          `Failed to delete data from cloud: ${error.message}`,
          StorageErrorCode.NETWORK_ERROR,
          { key, originalError: error }
        );
      }
      throw error;
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const response = await APIClient.get<{ keys: string[] }>(
        `/storage/list?prefix=${encodeURIComponent(prefix)}`
      );
      return response.keys;
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(
          `Failed to list keys from cloud: ${error.message}`,
          StorageErrorCode.NETWORK_ERROR,
          { prefix, originalError: error }
        );
      }
      throw error;
    }
  }

  async sync(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Process all queued operations
      const operations = [...this.syncQueue];
      this.syncQueue = [];

      for (const item of operations) {
        try {
          if (item.operation === 'save') {
            await APIClient.post('/storage/save', {
              key: item.key,
              data: item.data,
            });
          } else if (item.operation === 'delete') {
            await APIClient.delete(`/storage/delete/${encodeURIComponent(item.key)}`);
          }
        } catch (error) {
          // Re-add failed operations to queue for retry
          this.syncQueue.push(item);
          console.error(`Failed to sync ${item.operation} for key ${item.key}:`, error);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async getUsage(): Promise<StorageUsage> {
    try {
      const response = await APIClient.get<StorageUsage>('/storage/usage');
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(
          `Failed to get storage usage: ${error.message}`,
          StorageErrorCode.NETWORK_ERROR,
          { originalError: error }
        );
      }
      throw error;
    }
  }

  /**
   * Start automatic background sync
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      return;
    }

    this.syncTimer = setInterval(() => {
      this.sync().catch((error) => {
        console.error('Auto-sync failed:', error);
      });
    }, this.syncInterval);
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Add operation to sync queue
   */
  private addToSyncQueue(key: string, data: any, operation: 'save' | 'delete'): void {
    // Remove any existing operations for the same key
    this.syncQueue = this.syncQueue.filter((item) => item.key !== key);

    // Add new operation
    this.syncQueue.push({
      key,
      data,
      operation,
      timestamp: Date.now(),
    });
  }

  /**
   * Get sync queue status
   */
  getSyncStatus(): { pending: number; inProgress: boolean } {
    return {
      pending: this.syncQueue.length,
      inProgress: this.syncInProgress,
    };
  }

  /**
   * Force immediate sync of all pending operations
   */
  async forceSyncNow(): Promise<void> {
    await this.sync();
  }
}
