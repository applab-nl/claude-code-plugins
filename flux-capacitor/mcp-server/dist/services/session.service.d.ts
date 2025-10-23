/**
 * Session service for managing Claude Code sessions
 * Handles session creation, tracking, and lifecycle management
 */
import type { Session, LaunchSessionParams, LaunchSessionResult } from '../types/index.js';
export declare class SessionService {
    /**
     * Generate a unique session ID
     */
    static generateSessionId(worktreePath: string): string;
    /**
     * Create a prompt file for large prompts
     * Claude Code can read prompts from files to avoid command line length limits
     */
    static createPromptFile(worktreePath: string, prompt: string, agentName?: string, contextFiles?: string[]): Promise<string>;
    /**
     * Launch a new Claude Code session in a terminal
     */
    static launchSession(params: LaunchSessionParams): Promise<LaunchSessionResult>;
    /**
     * Get session status by ID
     */
    static getSessionStatus(sessionId: string): Promise<Session | null>;
    /**
     * Update session activity timestamp
     */
    static updateActivity(sessionId: string): Promise<void>;
    /**
     * Mark session as completed
     */
    static completeSession(sessionId: string, status?: 'completed' | 'failed'): Promise<void>;
    /**
     * Terminate a running session
     */
    static terminateSession(sessionId: string): Promise<boolean>;
    /**
     * List all sessions
     */
    static listSessions(): Promise<Session[]>;
    /**
     * Find sessions by worktree
     */
    static findSessionsByWorktree(worktreePath: string): Promise<Session[]>;
    /**
     * Clean up old completed sessions
     */
    static cleanupOldSessions(daysOld?: number): Promise<number>;
}
//# sourceMappingURL=session.service.d.ts.map