/**
 * State persistence service using node-persist
 * Manages storage and retrieval of worktree and session data
 */

import storage from 'node-persist';
import path from 'path';
import os from 'os';
import type { Worktree, Session, SessionStatus } from '../types/index.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * Expand tilde (~) in file paths to the user's home directory
 * Node.js does NOT automatically expand tilde - that's a shell feature
 */
function expandTilde(filepath: string): string {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

export class StateService {
  private static instance: StateService;
  private initialized = false;
  private storageDir: string;

  private constructor(storageDir?: string) {
    // Expand tilde if present, otherwise use default path
    const expandedDir = storageDir ? expandTilde(storageDir) : undefined;

    this.storageDir = expandedDir || path.join(
      os.homedir(),
      '.claude',
      'flux-capacitor',
      'state'
    );
  }

  /**
   * Get singleton instance
   */
  static getInstance(storageDir?: string): StateService {
    if (!StateService.instance) {
      StateService.instance = new StateService(storageDir);
    }
    return StateService.instance;
  }

  /**
   * Initialize the storage system
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    logger.debug('Initializing state service', { dir: this.storageDir });

    await storage.init({
      dir: this.storageDir,
      stringify: JSON.stringify,
      parse: JSON.parse,
      encoding: 'utf8',
      expiredInterval: 24 * 60 * 60 * 1000, // Clean up once per day
    });

    this.initialized = true;
    logger.info('State service initialized successfully');
  }

  /**
   * Ensure storage is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // =========================================================================
  // Worktree Operations
  // =========================================================================

  /**
   * Save worktree information
   */
  async saveWorktree(worktree: Worktree): Promise<void> {
    await this.ensureInitialized();
    const key = this.getWorktreeKey(worktree.path);

    logger.debug('Saving worktree', { path: worktree.path, branch: worktree.branch });

    await storage.setItem(key, {
      ...worktree,
      createdAt: worktree.createdAt.toISOString(),
    });
  }

  /**
   * Get worktree information by path
   */
  async getWorktree(worktreePath: string): Promise<Worktree | null> {
    await this.ensureInitialized();
    const key = this.getWorktreeKey(worktreePath);

    const data = await storage.getItem(key);
    if (!data) {
      return null;
    }

    return {
      ...data,
      createdAt: new Date(data.createdAt),
    };
  }

  /**
   * List all worktrees
   */
  async listWorktrees(repositoryFilter?: string): Promise<Worktree[]> {
    await this.ensureInitialized();

    const keys = await storage.keys();
    const worktreeKeys = keys.filter((k: string) => k.startsWith('worktree:'));

    const worktrees = await Promise.all(
      worktreeKeys.map(async (key: string) => {
        const data = await storage.getItem(key);
        if (!data) return null;

        return {
          ...data,
          createdAt: new Date(data.createdAt),
        };
      })
    );

    const validWorktrees = worktrees.filter((w: any): w is Worktree => w !== null);

    if (repositoryFilter) {
      return validWorktrees.filter((w: Worktree) =>
        w.repository === repositoryFilter
      );
    }

    return validWorktrees;
  }

  /**
   * Delete worktree from state
   */
  async deleteWorktree(worktreePath: string): Promise<boolean> {
    await this.ensureInitialized();
    const key = this.getWorktreeKey(worktreePath);

    logger.debug('Deleting worktree from state', { path: worktreePath });

    await storage.removeItem(key);
    return true;
  }

  /**
   * Update worktree session ID
   */
  async updateWorktreeSession(
    worktreePath: string,
    sessionId: string | undefined
  ): Promise<void> {
    const worktree = await this.getWorktree(worktreePath);
    if (worktree) {
      worktree.sessionId = sessionId;
      await this.saveWorktree(worktree);
    }
  }

  // =========================================================================
  // Session Operations
  // =========================================================================

  /**
   * Save session information
   */
  async saveSession(session: Session): Promise<void> {
    await this.ensureInitialized();
    const key = this.getSessionKey(session.sessionId);

    logger.debug('Saving session', {
      sessionId: session.sessionId,
      worktreePath: session.worktreePath,
    });

    await storage.setItem(key, {
      ...session,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString(),
      lastActivity: session.lastActivity?.toISOString(),
    });

    // Update the associated worktree
    await this.updateWorktreeSession(session.worktreePath, session.sessionId);
  }

  /**
   * Get session information by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    await this.ensureInitialized();
    const key = this.getSessionKey(sessionId);

    const data = await storage.getItem(key);
    if (!data) {
      return null;
    }

    return {
      ...data,
      startedAt: new Date(data.startedAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      lastActivity: data.lastActivity ? new Date(data.lastActivity) : undefined,
    };
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<Session[]> {
    await this.ensureInitialized();

    const keys = await storage.keys();
    const sessionKeys = keys.filter((k: string) => k.startsWith('session:'));

    const sessions = await Promise.all(
      sessionKeys.map(async (key: string) => {
        const data = await storage.getItem(key);
        if (!data) return null;

        return {
          ...data,
          startedAt: new Date(data.startedAt),
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
          lastActivity: data.lastActivity ? new Date(data.lastActivity) : undefined,
        };
      })
    );

    return sessions.filter((s: any): s is Session => s !== null);
  }

  /**
   * Find sessions by worktree path
   */
  async findSessionsByWorktree(worktreePath: string): Promise<Session[]> {
    const allSessions = await this.listSessions();
    return allSessions.filter(s => s.worktreePath === worktreePath);
  }

  /**
   * Find session by worktree path (returns most recent active session)
   */
  async findSessionByWorktree(worktreePath: string): Promise<Session | null> {
    const sessions = await this.findSessionsByWorktree(worktreePath);

    // Sort by startedAt descending, find first active session
    const activeSessions = sessions
      .filter(s => s.status === 'active')
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    return activeSessions[0] || null;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: SessionStatus
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = status;
      session.lastActivity = new Date();

      if (status !== 'active' && !session.completedAt) {
        session.completedAt = new Date();
      }

      await this.saveSession(session);

      // If session is completed/terminated, clear worktree association
      if (status !== 'active') {
        await this.updateWorktreeSession(session.worktreePath, undefined);
      }
    }
  }

  /**
   * Update session last activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActivity = new Date();
      await this.saveSession(session);
    }
  }

  /**
   * Delete session from state
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    await this.ensureInitialized();
    const session = await this.getSession(sessionId);

    if (session) {
      // Clear worktree association
      await this.updateWorktreeSession(session.worktreePath, undefined);
    }

    const key = this.getSessionKey(sessionId);
    logger.debug('Deleting session from state', { sessionId });

    await storage.removeItem(key);
    return true;
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Clear all state (use with caution!)
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();
    logger.warn('Clearing all state');
    await storage.clear();
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    worktrees: number;
    sessions: number;
    activeSessions: number;
  }> {
    const worktrees = await this.listWorktrees();
    const sessions = await this.listSessions();
    const activeSessions = sessions.filter(s => s.status === 'active').length;

    return {
      worktrees: worktrees.length,
      sessions: sessions.length,
      activeSessions,
    };
  }

  /**
   * Cleanup old completed sessions (older than N days)
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    const sessions = await this.listSessions();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let cleaned = 0;

    for (const session of sessions) {
      if (
        session.status !== 'active' &&
        session.completedAt &&
        session.completedAt < cutoffDate
      ) {
        await this.deleteSession(session.sessionId);
        cleaned++;
      }
    }

    logger.info(`Cleaned up ${cleaned} old sessions`);
    return cleaned;
  }

  // =========================================================================
  // Private Helper Methods
  // =========================================================================

  private getWorktreeKey(worktreePath: string): string {
    // Normalize path for consistent keys
    const normalized = path.normalize(worktreePath);
    return `worktree:${normalized}`;
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }
}

// Export singleton getter for convenience
export function getStateService(storageDir?: string): StateService {
  return StateService.getInstance(storageDir);
}
