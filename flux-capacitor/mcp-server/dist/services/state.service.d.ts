/**
 * State persistence service using node-persist
 * Manages storage and retrieval of worktree and session data
 */
import type { Worktree, Session, SessionStatus } from '../types/index.js';
export declare class StateService {
    private static instance;
    private initialized;
    private storageDir;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(storageDir?: string): StateService;
    /**
     * Initialize the storage system
     */
    init(): Promise<void>;
    /**
     * Ensure storage is initialized
     */
    private ensureInitialized;
    /**
     * Save worktree information
     */
    saveWorktree(worktree: Worktree): Promise<void>;
    /**
     * Get worktree information by path
     */
    getWorktree(worktreePath: string): Promise<Worktree | null>;
    /**
     * List all worktrees
     */
    listWorktrees(repositoryFilter?: string): Promise<Worktree[]>;
    /**
     * Delete worktree from state
     */
    deleteWorktree(worktreePath: string): Promise<boolean>;
    /**
     * Update worktree session ID
     */
    updateWorktreeSession(worktreePath: string, sessionId: string | undefined): Promise<void>;
    /**
     * Save session information
     */
    saveSession(session: Session): Promise<void>;
    /**
     * Get session information by ID
     */
    getSession(sessionId: string): Promise<Session | null>;
    /**
     * List all sessions
     */
    listSessions(): Promise<Session[]>;
    /**
     * Find sessions by worktree path
     */
    findSessionsByWorktree(worktreePath: string): Promise<Session[]>;
    /**
     * Find session by worktree path (returns most recent active session)
     */
    findSessionByWorktree(worktreePath: string): Promise<Session | null>;
    /**
     * Update session status
     */
    updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void>;
    /**
     * Update session last activity timestamp
     */
    updateSessionActivity(sessionId: string): Promise<void>;
    /**
     * Delete session from state
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * Clear all state (use with caution!)
     */
    clearAll(): Promise<void>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<{
        worktrees: number;
        sessions: number;
        activeSessions: number;
    }>;
    /**
     * Cleanup old completed sessions (older than N days)
     */
    cleanupOldSessions(daysOld?: number): Promise<number>;
    private getWorktreeKey;
    private getSessionKey;
}
export declare function getStateService(storageDir?: string): StateService;
//# sourceMappingURL=state.service.d.ts.map