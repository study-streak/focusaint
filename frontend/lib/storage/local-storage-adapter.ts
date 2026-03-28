/**
 * Local Storage Adapter
 * 
 * Implements storage using browser localStorage for free tier users.
 * Data is stored on the device and is not synced across devices.
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Design: LocalStorageAdapter implementation
 */

import {
  StorageAdapter,
  StorageUsage,
  StorageError,
  StorageErrorCode,
} from './storage-adapter';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly prefix: string = 'focusaint_';
  private readonly maxStorageSize: number = 5 * 1024 * 1024; // 5MB limit

  constructor() {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new StorageError(
        'localStorage is not available',
        StorageErrorCode.PERMISSION_DENIED
      );
    }
  }

  async save(key: string, data: any): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serialized = JSON.stringify(data);

      // Check storage quota before saving
      const currentUsage = await this.getUsage();
      const newDataSize = new Blob([serialized]).size;

      if (currentUsage.used + newDataSize > this.maxStorageSize) {
        throw new StorageError(
          'Storage quota exceeded. Please upgrade to premium for cloud storage.',
          StorageErrorCode.QUOTA_EXCEEDED,
          {
            currentUsage: currentUsage.used,
            limit: this.maxStorageSize,
            attemptedSize: newDataSize,
          }
        );
      }

      localStorage.setItem(prefixedKey, serialized);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new StorageError(
          'Browser storage quota exceeded',
          StorageErrorCode.QUOTA_EXCEEDED
        );
      }

      throw new StorageError(
        'Failed to save data to localStorage',
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  async load(key: string): Promise<any> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serialized = localStorage.getItem(prefixedKey);

      if (serialized === null) {
        return null;
      }

      return JSON.parse(serialized);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new StorageError(
          'Failed to parse stored data',
          StorageErrorCode.SERIALIZATION_ERROR,
          { key }
        );
      }

      throw new StorageError(
        'Failed to load data from localStorage',
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      throw new StorageError(
        'Failed to delete data from localStorage',
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const fullPrefix = this.getPrefixedKey(prefix);
      const keys: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(fullPrefix)) {
          // Remove the focusaint_ prefix to return clean keys
          keys.push(key.substring(this.prefix.length));
        }
      }

      return keys;
    } catch (error) {
      throw new StorageError(
        'Failed to list keys from localStorage',
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  async sync(): Promise<void> {
    // No-op for local storage - data is already persisted
    // This method exists to satisfy the interface
    return Promise.resolve();
  }

  async getUsage(): Promise<StorageUsage> {
    try {
      let totalSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([key, value]).size;
          }
        }
      }

      return {
        used: totalSize,
        limit: this.maxStorageSize,
        percentage: Math.round((totalSize / this.maxStorageSize) * 100),
      };
    } catch (error) {
      throw new StorageError(
        'Failed to calculate storage usage',
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Clear all focusaint data from localStorage
   * Useful for logout or data migration
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.list('');
      for (const key of keys) {
        await this.delete(key);
      }
    } catch (error) {
      throw new StorageError(
        'Failed to clear localStorage',
        StorageErrorCode.UNKNOWN_ERROR,
        { originalError: error }
      );
    }
  }

  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}
