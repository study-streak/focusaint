/**
 * Storage Factory
 * 
 * Creates the appropriate storage adapter based on user tier.
 * Free users get LocalStorageAdapter, premium users get CloudStorageAdapter.
 * 
 * Requirements: Req 4 - Local Storage Preference, Req 11 - Cloud Sync
 * Design: StorageFactory pattern for tier-based storage selection
 */

import { StorageAdapter } from './storage-adapter';
import { LocalStorageAdapter } from './local-storage-adapter';
import { CloudStorageAdapter } from './cloud-storage-adapter';

export type UserTier = 'free' | 'premium';

export class StorageFactory {
  private static instance: StorageAdapter | null = null;
  private static currentTier: UserTier | null = null;

  /**
   * Create storage adapter based on user tier
   * @param userTier - User's subscription tier
   * @returns Appropriate storage adapter instance
   */
  static create(userTier: UserTier): StorageAdapter {
    // If tier hasn't changed and we have an instance, reuse it
    if (this.instance && this.currentTier === userTier) {
      return this.instance;
    }

    // Clean up old instance if tier changed
    if (this.instance && this.currentTier !== userTier) {
      this.cleanup();
    }

    // Create new instance based on tier
    this.currentTier = userTier;
    this.instance = userTier === 'premium'
      ? new CloudStorageAdapter()
      : new LocalStorageAdapter();

    return this.instance;
  }

  /**
   * Get current storage adapter instance
   * @throws Error if no adapter has been created yet
   */
  static getInstance(): StorageAdapter {
    if (!this.instance) {
      throw new Error('Storage adapter not initialized. Call StorageFactory.create() first.');
    }
    return this.instance;
  }

  /**
   * Check if storage adapter is initialized
   */
  static isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Get current user tier
   */
  static getCurrentTier(): UserTier | null {
    return this.currentTier;
  }

  /**
   * Cleanup current storage adapter
   */
  static cleanup(): void {
    if (this.instance instanceof CloudStorageAdapter) {
      this.instance.stopAutoSync();
    }
    this.instance = null;
    this.currentTier = null;
  }

  /**
   * Migrate data from local storage to cloud storage
   * Used when user upgrades from free to premium
   * @param localAdapter - Source local storage adapter
   * @param cloudAdapter - Target cloud storage adapter
   * @param progressCallback - Optional callback for migration progress
   */
  static async migrateToCloud(
    localAdapter: LocalStorageAdapter,
    cloudAdapter: CloudStorageAdapter,
    progressCallback?: (current: number, total: number) => void
  ): Promise<void> {
    try {
      // Get all keys from local storage
      const keys = await localAdapter.list('');
      const total = keys.length;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        // Load data from local storage
        const data = await localAdapter.load(key);
        
        if (data !== null) {
          // Save to cloud storage
          await cloudAdapter.save(key, data);
        }

        // Report progress
        if (progressCallback) {
          progressCallback(i + 1, total);
        }
      }

      // Force sync to ensure all data is uploaded
      await cloudAdapter.forceSyncNow();
    } catch (error) {
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Migrate data from cloud storage to local storage
   * Used when user downgrades from premium to free
   * @param cloudAdapter - Source cloud storage adapter
   * @param localAdapter - Target local storage adapter
   * @param progressCallback - Optional callback for migration progress
   */
  static async migrateToLocal(
    cloudAdapter: CloudStorageAdapter,
    localAdapter: LocalStorageAdapter,
    progressCallback?: (current: number, total: number) => void
  ): Promise<void> {
    try {
      // Get all keys from cloud storage
      const keys = await cloudAdapter.list('');
      const total = keys.length;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        // Load data from cloud storage
        const data = await cloudAdapter.load(key);
        
        if (data !== null) {
          try {
            // Save to local storage
            await localAdapter.save(key, data);
          } catch (error) {
            // If quota exceeded, stop migration and throw error
            if (error instanceof Error && error.message.includes('quota')) {
              throw new Error(
                `Local storage quota exceeded during migration. ${i} of ${total} items migrated.`
              );
            }
            throw error;
          }
        }

        // Report progress
        if (progressCallback) {
          progressCallback(i + 1, total);
        }
      }
    } catch (error) {
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
