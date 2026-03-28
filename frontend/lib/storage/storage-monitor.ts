/**
 * Storage Monitor
 * 
 * Monitors storage usage and provides warnings when approaching limits.
 * Particularly important for free tier users with local storage limits.
 * 
 * Requirements: Req 4 - Local Storage Preference (size limits)
 * Design: Storage size limit checks for local storage
 */

import { StorageAdapter, StorageUsage } from './storage-adapter';

export interface StorageWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  percentage: number;
  used: number;
  limit: number;
}

export class StorageMonitor {
  private adapter: StorageAdapter;
  private warningThresholds = {
    info: 50, // 50% usage
    warning: 75, // 75% usage
    critical: 90, // 90% usage
  };

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * Check current storage usage
   */
  async checkUsage(): Promise<StorageUsage> {
    return await this.adapter.getUsage();
  }

  /**
   * Get storage warning based on current usage
   * Returns null if usage is below info threshold
   */
  async getWarning(): Promise<StorageWarning | null> {
    const usage = await this.checkUsage();

    if (usage.percentage >= this.warningThresholds.critical) {
      return {
        level: 'critical',
        message: `Storage is ${usage.percentage}% full. Please delete some data or upgrade to premium for unlimited cloud storage.`,
        percentage: usage.percentage,
        used: usage.used,
        limit: usage.limit,
      };
    }

    if (usage.percentage >= this.warningThresholds.warning) {
      return {
        level: 'warning',
        message: `Storage is ${usage.percentage}% full. Consider upgrading to premium for unlimited cloud storage.`,
        percentage: usage.percentage,
        used: usage.used,
        limit: usage.limit,
      };
    }

    if (usage.percentage >= this.warningThresholds.info) {
      return {
        level: 'info',
        message: `Storage is ${usage.percentage}% full. Upgrade to premium for unlimited cloud storage.`,
        percentage: usage.percentage,
        used: usage.used,
        limit: usage.limit,
      };
    }

    return null;
  }

  /**
   * Check if storage has enough space for new data
   * @param estimatedSize - Estimated size of new data in bytes
   * @returns true if there's enough space
   */
  async hasSpaceFor(estimatedSize: number): Promise<boolean> {
    const usage = await this.checkUsage();
    return usage.used + estimatedSize <= usage.limit;
  }

  /**
   * Get remaining storage space in bytes
   */
  async getRemainingSpace(): Promise<number> {
    const usage = await this.checkUsage();
    return Math.max(0, usage.limit - usage.used);
  }

  /**
   * Format bytes to human-readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get storage usage summary as formatted string
   */
  async getUsageSummary(): Promise<string> {
    const usage = await this.checkUsage();
    const usedFormatted = StorageMonitor.formatBytes(usage.used);
    const limitFormatted = StorageMonitor.formatBytes(usage.limit);
    return `${usedFormatted} / ${limitFormatted} (${usage.percentage}%)`;
  }

  /**
   * Set custom warning thresholds
   */
  setWarningThresholds(thresholds: Partial<typeof this.warningThresholds>): void {
    this.warningThresholds = {
      ...this.warningThresholds,
      ...thresholds,
    };
  }

  /**
   * Estimate size of data before saving
   * Useful for checking if data will fit before attempting to save
   */
  static estimateDataSize(data: any): number {
    try {
      const serialized = JSON.stringify(data);
      return new Blob([serialized]).size;
    } catch (error) {
      // If serialization fails, return a conservative estimate
      return 1024; // 1KB default estimate
    }
  }
}
