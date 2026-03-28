/**
 * Storage System
 * 
 * Provides tier-based storage abstraction for focusaint.
 * Free users get local browser storage, premium users get cloud sync.
 * 
 * Requirements: Req 4 - Local Storage Preference, Req 11 - Cloud Sync
 * Design: Storage Adapter pattern
 * 
 * Usage:
 * ```typescript
 * import { StorageFactory, StorageMonitor } from '@/lib/storage';
 * 
 * // Initialize storage based on user tier
 * const storage = StorageFactory.create(user.tier);
 * 
 * // Save data
 * await storage.save('session_notes', { content: 'My notes' });
 * 
 * // Load data
 * const notes = await storage.load('session_notes');
 * 
 * // Monitor storage usage
 * const monitor = new StorageMonitor(storage);
 * const warning = await monitor.getWarning();
 * if (warning) {
 *   console.log(warning.message);
 * }
 * ```
 */

export { StorageAdapter, StorageUsage, StorageError, StorageErrorCode } from './storage-adapter';
export { LocalStorageAdapter } from './local-storage-adapter';
export { CloudStorageAdapter } from './cloud-storage-adapter';
export { StorageFactory, UserTier } from './storage-factory';
export { StorageMonitor, StorageWarning } from './storage-monitor';
export { SessionStorageService, SessionNote, SessionData } from './session-storage';
export { TaskStorageService, TaskData, TaskAttachment } from './task-storage';
export { DataMigrationService, MigrationProgress, MigrationResult } from './data-migration';
