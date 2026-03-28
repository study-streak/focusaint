/**
 * Storage Adapter Interface
 * 
 * Provides an abstraction layer for data storage that supports both
 * local browser storage (free tier) and cloud storage (premium tier).
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Design: Storage Adapter pattern for tier-based storage
 */

export interface StorageAdapter {
  /**
   * Save data to storage
   * @param key - Unique identifier for the data
   * @param data - Data to store (will be JSON serialized)
   * @throws StorageError if save fails or quota exceeded
   */
  save(key: string, data: any): Promise<void>;

  /**
   * Load data from storage
   * @param key - Unique identifier for the data
   * @returns The stored data or null if not found
   * @throws StorageError if load fails
   */
  load(key: string): Promise<any>;

  /**
   * Delete data from storage
   * @param key - Unique identifier for the data
   * @throws StorageError if delete fails
   */
  delete(key: string): Promise<void>;

  /**
   * List all keys with a given prefix
   * @param prefix - Key prefix to filter by
   * @returns Array of matching keys
   * @throws StorageError if list operation fails
   */
  list(prefix: string): Promise<string[]>;

  /**
   * Synchronize local changes with remote storage (cloud only)
   * For local storage, this is a no-op
   * @throws StorageError if sync fails
   */
  sync(): Promise<void>;

  /**
   * Get storage usage information
   * @returns Storage usage stats
   */
  getUsage(): Promise<StorageUsage>;
}

export interface StorageUsage {
  used: number; // bytes used
  limit: number; // total bytes available
  percentage: number; // usage percentage (0-100)
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export enum StorageErrorCode {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
