/**
 * Task Storage Service
 * 
 * Manages storage of task data based on user tier.
 * Free users: Local storage
 * Premium users: Cloud storage
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Task: 6.2.2 - Store task data in local storage for free users
 */

import { StorageFactory, StorageAdapter, StorageError } from './index';
import { UserTier } from './storage-factory';

export interface TaskAttachment {
  id: string;
  type: 'file' | 'link';
  name: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  openedAt?: string;
  openCount: number;
  completed: boolean;
  completedAt?: string;
}

export interface TaskData {
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  duration: number;
  category: string;
  assignedDate: string;
  monthYear: string;
  completed: boolean;
  completedAt?: string;
  deadline?: string;
  attachments?: TaskAttachment[];
  proctoredMode?: boolean;
  proctoredPreset?: 'quick' | 'deep';
  createdAt: string;
  updatedAt: string;
}

export class TaskStorageService {
  private storage: StorageAdapter;
  private userTier: UserTier;

  constructor(userTier: UserTier) {
    this.userTier = userTier;
    this.storage = StorageFactory.create(userTier);
  }

  /**
   * Save task data
   */
  async saveTask(taskData: TaskData): Promise<void> {
    const key = this.getTaskKey(taskData.taskId);
    
    try {
      await this.storage.save(key, taskData);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to save task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load task data
   */
  async loadTask(taskId: string): Promise<TaskData | null> {
    const key = this.getTaskKey(taskId);
    
    try {
      return await this.storage.load(key);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to load task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update task data
   */
  async updateTask(taskId: string, updates: Partial<TaskData>): Promise<void> {
    const key = this.getTaskKey(taskId);
    
    try {
      const existing = await this.storage.load(key);
      if (!existing) {
        throw new Error('Task not found');
      }

      const updated: TaskData = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.storage.save(key, updated);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete task data
   */
  async deleteTask(taskId: string): Promise<void> {
    const key = this.getTaskKey(taskId);
    
    try {
      await this.storage.delete(key);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all tasks for a user
   */
  async listUserTasks(userId: string): Promise<TaskData[]> {
    try {
      const keys = await this.storage.list(`task_`);
      const tasks: TaskData[] = [];

      for (const key of keys) {
        const task = await this.storage.load(key);
        if (task && task.userId === userId) {
          tasks.push(task);
        }
      }

      return tasks.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to list user tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List tasks by date
   */
  async listTasksByDate(userId: string, date: string): Promise<TaskData[]> {
    try {
      const allTasks = await this.listUserTasks(userId);
      return allTasks.filter(task => task.assignedDate === date);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to list tasks by date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List tasks by month
   */
  async listTasksByMonth(userId: string, monthYear: string): Promise<TaskData[]> {
    try {
      const allTasks = await this.listUserTasks(userId);
      return allTasks.filter(task => task.monthYear === monthYear);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to list tasks by month: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string): Promise<void> {
    try {
      await this.updateTask(taskId, {
        completed: true,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add attachment to task
   */
  async addAttachment(taskId: string, attachment: TaskAttachment): Promise<void> {
    try {
      const task = await this.loadTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const attachments = task.attachments || [];
      attachments.push(attachment);

      await this.updateTask(taskId, { attachments });
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to add attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove attachment from task
   */
  async removeAttachment(taskId: string, attachmentId: string): Promise<void> {
    try {
      const task = await this.loadTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const attachments = (task.attachments || []).filter(a => a.id !== attachmentId);
      await this.updateTask(taskId, { attachments });
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to remove attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage key for task
   */
  private getTaskKey(taskId: string): string {
    return `task_${taskId}`;
  }

  /**
   * Check if user is on free tier (using local storage)
   */
  isLocalStorage(): boolean {
    return this.userTier === 'free';
  }

  /**
   * Get count of tasks stored locally
   */
  async getTaskCount(userId: string): Promise<number> {
    try {
      const tasks = await this.listUserTasks(userId);
      return tasks.length;
    } catch (error) {
      return 0;
    }
  }
}
