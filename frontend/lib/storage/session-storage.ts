/**
 * Session Storage Service
 * 
 * Manages storage of session notes and data based on user tier.
 * Free users: Local storage
 * Premium users: Cloud storage
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Task: 6.2.1 - Store session notes in local storage for free users
 */

import { StorageFactory, StorageAdapter, StorageError } from './index';
import { UserTier } from './storage-factory';

export interface SessionNote {
  sessionId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  notes?: string;
  topic?: string;
  attachments?: string[];
}

export class SessionStorageService {
  private storage: StorageAdapter;
  private userTier: UserTier;

  constructor(userTier: UserTier) {
    this.userTier = userTier;
    this.storage = StorageFactory.create(userTier);
  }

  /**
   * Save session notes
   */
  async saveSessionNotes(sessionId: string, userId: string, content: string): Promise<void> {
    const key = this.getSessionNotesKey(sessionId);
    const note: SessionNote = {
      sessionId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.storage.save(key, note);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to save session notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load session notes
   */
  async loadSessionNotes(sessionId: string): Promise<SessionNote | null> {
    const key = this.getSessionNotesKey(sessionId);
    
    try {
      return await this.storage.load(key);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to load session notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update session notes
   */
  async updateSessionNotes(sessionId: string, content: string): Promise<void> {
    const key = this.getSessionNotesKey(sessionId);
    
    try {
      const existing = await this.storage.load(key);
      if (!existing) {
        throw new Error('Session notes not found');
      }

      const updated: SessionNote = {
        ...existing,
        content,
        updatedAt: new Date().toISOString(),
      };

      await this.storage.save(key, updated);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to update session notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete session notes
   */
  async deleteSessionNotes(sessionId: string): Promise<void> {
    const key = this.getSessionNotesKey(sessionId);
    
    try {
      await this.storage.delete(key);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to delete session notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save session data
   */
  async saveSessionData(sessionData: SessionData): Promise<void> {
    const key = this.getSessionDataKey(sessionData.sessionId);
    
    try {
      await this.storage.save(key, sessionData);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to save session data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load session data
   */
  async loadSessionData(sessionId: string): Promise<SessionData | null> {
    const key = this.getSessionDataKey(sessionId);
    
    try {
      return await this.storage.load(key);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to load session data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all session notes for a user
   */
  async listUserSessions(userId: string): Promise<SessionNote[]> {
    try {
      const keys = await this.storage.list(`session_notes_`);
      const sessions: SessionNote[] = [];

      for (const key of keys) {
        const note = await this.storage.load(key);
        if (note && note.userId === userId) {
          sessions.push(note);
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new Error(`Failed to list user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage key for session notes
   */
  private getSessionNotesKey(sessionId: string): string {
    return `session_notes_${sessionId}`;
  }

  /**
   * Get storage key for session data
   */
  private getSessionDataKey(sessionId: string): string {
    return `session_data_${sessionId}`;
  }

  /**
   * Check if user is on free tier (using local storage)
   */
  isLocalStorage(): boolean {
    return this.userTier === 'free';
  }
}
