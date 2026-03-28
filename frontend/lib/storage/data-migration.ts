/**
 * Data Migration Service
 * 
 * Handles migration of data from local storage to cloud storage
 * when users upgrade from free to premium tier.
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Task: 6.2.4 - Create data migration tool for upgrade to premium
 */

import { StorageFactory } from './storage-factory';
import { LocalStorageAdapter } from './local-storage-adapter';
import { CloudStorageAdapter } from './cloud-storage-adapter';
import { StorageError, StorageErrorCode } from './storage-adapter';

export interface MigrationProgress {
  total: number;
  current: number;
  percentage: number;
  currentItem?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  itemsMigrated: number;
  itemsFailed: number;
  errors: Array<{ key: string; error: string }>;
  duration: number; // milliseconds
}

export type MigrationProgressCallback = (progress: MigrationProgress) => void;

export class DataMigrationService {
  /**
   * Migrate all data from local storage to cloud storage
   */
  static async migrateToCloud(
    onProgress?: MigrationProgressCallback
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const localAdapter = new LocalStorageAdapter();
    const cloudAdapter = new CloudStorageAdapter();
    
    const errors: Array<{ key: string; error: string }> = [];
    let itemsMigrated = 0;
    let itemsFailed = 0;

    try {
      // Get all keys from local storage
      const keys = await localAdapter.list('');
      const total = keys.length;

      if (total === 0) {
        return {
          success: true,
          itemsMigrated: 0,
          itemsFailed: 0,
          errors: [],
          duration: Date.now() - startTime,
        };
      }

      // Report initial progress
      if (onProgress) {
        onProgress({
          total,
          current: 0,
          percentage: 0,
          status: 'in_progress',
        });
      }

      // Migrate each item
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        try {
          // Load from local storage
          const data = await localAdapter.load(key);
          
          if (data !== null) {
            // Save to cloud storage
            await cloudAdapter.save(key, data);
            itemsMigrated++;
          }
        } catch (error) {
          itemsFailed++;
          errors.push({
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Report progress
        if (onProgress) {
          onProgress({
            total,
            current: i + 1,
            percentage: Math.round(((i + 1) / total) * 100),
            currentItem: key,
            status: 'in_progress',
          });
        }
      }

      // Force sync to ensure all data is uploaded
      await cloudAdapter.forceSyncNow();

      // Report completion
      if (onProgress) {
        onProgress({
          total,
          current: total,
          percentage: 100,
          status: itemsFailed === 0 ? 'completed' : 'failed',
          error: itemsFailed > 0 ? `${itemsFailed} items failed to migrate` : undefined,
        });
      }

      return {
        success: itemsFailed === 0,
        itemsMigrated,
        itemsFailed,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      if (onProgress) {
        onProgress({
          total: 0,
          current: 0,
          percentage: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Migration failed',
        });
      }

      throw new StorageError(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Migrate data from cloud storage to local storage
   * Used when downgrading from premium to free
   */
  static async migrateToLocal(
    onProgress?: MigrationProgressCallback
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const localAdapter = new LocalStorageAdapter();
    const cloudAdapter = new CloudStorageAdapter();
    
    const errors: Array<{ key: string; error: string }> = [];
    let itemsMigrated = 0;
    let itemsFailed = 0;

    try {
      // Get all keys from cloud storage
      const keys = await cloudAdapter.list('');
      const total = keys.length;

      if (total === 0) {
        return {
          success: true,
          itemsMigrated: 0,
          itemsFailed: 0,
          errors: [],
          duration: Date.now() - startTime,
        };
      }

      // Report initial progress
      if (onProgress) {
        onProgress({
          total,
          current: 0,
          percentage: 0,
          status: 'in_progress',
        });
      }

      // Migrate each item
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        try {
          // Load from cloud storage
          const data = await cloudAdapter.load(key);
          
          if (data !== null) {
            // Save to local storage
            await localAdapter.save(key, data);
            itemsMigrated++;
          }
        } catch (error) {
          itemsFailed++;
          
          // Check if quota exceeded
          if (error instanceof StorageError && error.code === StorageErrorCode.QUOTA_EXCEEDED) {
            errors.push({
              key,
              error: 'Local storage quota exceeded',
            });
            
            // Stop migration if quota exceeded
            if (onProgress) {
              onProgress({
                total,
                current: i + 1,
                percentage: Math.round(((i + 1) / total) * 100),
                status: 'failed',
                error: `Local storage quota exceeded. ${itemsMigrated} of ${total} items migrated.`,
              });
            }
            
            break;
          }
          
          errors.push({
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Report progress
        if (onProgress) {
          onProgress({
            total,
            current: i + 1,
            percentage: Math.round(((i + 1) / total) * 100),
            currentItem: key,
            status: 'in_progress',
          });
        }
      }

      // Report completion
      if (onProgress) {
        onProgress({
          total,
          current: itemsMigrated + itemsFailed,
          percentage: 100,
          status: itemsFailed === 0 ? 'completed' : 'failed',
          error: itemsFailed > 0 ? `${itemsFailed} items failed to migrate` : undefined,
        });
      }

      return {
        success: itemsFailed === 0,
        itemsMigrated,
        itemsFailed,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      if (onProgress) {
        onProgress({
          total: 0,
          current: 0,
          percentage: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Migration failed',
        });
      }

      throw new StorageError(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Clear local storage after successful migration to cloud
   */
  static async clearLocalStorageAfterMigration(): Promise<void> {
    try {
      const localAdapter = new LocalStorageAdapter();
      await localAdapter.clear();
    } catch (error) {
      throw new StorageError(
        'Failed to clear local storage after migration',
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Estimate migration time based on data size
   * @returns Estimated time in seconds
   */
  static async estimateMigrationTime(): Promise<number> {
    try {
      const localAdapter = new LocalStorageAdapter();
      const usage = await localAdapter.getUsage();
      
      // Rough estimate: 1MB per 5 seconds
      const mbSize = usage.used / (1024 * 1024);
      const estimatedSeconds = Math.ceil(mbSize * 5);
      
      return Math.max(estimatedSeconds, 5); // Minimum 5 seconds
    } catch (error) {
      return 10; // Default estimate
    }
  }

  /**
   * Check if migration is needed
   */
  static async needsMigration(): Promise<boolean> {
    try {
      const localAdapter = new LocalStorageAdapter();
      const keys = await localAdapter.list('');
      return keys.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get count of items to migrate
   */
  static async getMigrationItemCount(): Promise<number> {
    try {
      const localAdapter = new LocalStorageAdapter();
      const keys = await localAdapter.list('');
      return keys.length;
    } catch (error) {
      return 0;
    }
  }
}
