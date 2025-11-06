/**
 * Session service for managing Claude Code sessions via atomic script launcher
 * Handles session creation, tracking, and lifecycle management using native tmux
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { execa } from 'execa';
import type {
  Session,
  LaunchSessionParams,
  LaunchSessionResult,
} from '../types/index.js';
import { SessionError } from '../types/index.js';
import { createGitService } from './git.service.js';
import { getStateService } from './state.service.js';
import { getLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const logger = getLogger();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SessionService {
  /**
   * Generate a unique session ID
   */
  static generateSessionId(worktreePath: string): string {
    const timestamp = Date.now();
    const hash = crypto
      .createHash('sha256')
      .update(worktreePath + timestamp)
      .digest('hex')
      .substring(0, 8);

    const dirName = path.basename(worktreePath);
    const sessionId = `sess_${dirName}_${timestamp}_${hash}`;
    logger.debug(`Generated session ID: ${sessionId}`);
    return sessionId;
  }

  /**
   * Create a prompt file for the initial Claude Code prompt
   * Helps avoid command line length limits
   */
  static async createPromptFile(
    worktreePath: string,
    prompt: string,
    agentName?: string,
    contextFiles?: string[]
  ): Promise<string> {
    const promptDir = path.join(worktreePath, '.claude');
    logger.debug(`Creating prompt directory: ${promptDir}`);
    await fs.mkdir(promptDir, { recursive: true });

    const promptFile = path.join(promptDir, 'session-prompt.md');

    let content = `# Claude Code Session\n\n`;

    // If agent is specified, mention it in the prompt
    // Claude Code invokes agents by mentioning them
    if (agentName) {
      content += `Use the ${agentName} subagent for this task.\n\n`;
      logger.debug(`Including agent invocation in prompt: ${agentName}`);
    }

    content += `${prompt}\n\n`;

    if (contextFiles && contextFiles.length > 0) {
      content += `## Context Files\n\n`;
      for (const file of contextFiles) {
        content += `- ${file}\n`;
      }
      content += `\n`;
    }

    logger.debug(`Writing prompt file: ${promptFile} (${content.length} bytes)`);
    await fs.writeFile(promptFile, content, 'utf-8');

    logger.debug('Created prompt file', { promptFile });
    return promptFile;
  }

  /**
   * Launch a new Claude Code session using atomic script launcher
   */
  static async launchSession(
    params: LaunchSessionParams
  ): Promise<LaunchSessionResult> {
    const { worktreePath, prompt, contextFiles, agentName } = params;

    logger.info('Launching Claude Code session via atomic script', {
      worktreePath,
      agentName,
      contextFilesCount: contextFiles?.length || 0,
    });

    // Generate session ID
    const sessionId = this.generateSessionId(worktreePath);
    logger.debug(`Session ID: ${sessionId}`);

    try {
      // Step 1: Create prompt file
      logger.debug('Creating prompt file');
      const promptFile = await this.createPromptFile(
        worktreePath,
        prompt,
        agentName,
        contextFiles
      );

      // Step 2: Determine repository and worktree info
      // Try to get repo path from worktree (if it exists), otherwise use worktreePath as repo
      let repoPath: string;
      let branch: string;

      try {
        // Try to get git info from worktree
        const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], {
          cwd: worktreePath,
        });
        repoPath = stdout.trim();

        // Get current branch
        const gitService = createGitService(repoPath);
        branch = await gitService.getCurrentBranch(worktreePath);
      } catch {
        // Worktree doesn't exist yet - try parent directory
        const parentDir = path.dirname(worktreePath);
        try {
          const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], {
            cwd: parentDir,
          });
          repoPath = stdout.trim();
        } catch {
          // No git repo found - throw error
          throw new Error(`Could not find git repository for worktree: ${worktreePath}`);
        }

        // Generate feature branch name
        branch = `feature/${sessionId}`;
      }

      const worktreeName = path.basename(worktreePath);

      // Step 3: Build script parameters
      const scriptPath = path.join(__dirname, '../../scripts/launch-claude-session.sh');
      const scriptArgs = [
        '--repo-path', repoPath,
        '--branch', branch,
        '--worktree-name', worktreeName,
        '--prompt-file', promptFile,
        '--session-id', sessionId,
      ];

      logger.debug('Executing launch script', { scriptPath, args: scriptArgs });

      // Step 4: Execute script (fire-and-forget)
      const result = await execa(scriptPath, scriptArgs, {
        timeout: 30000, // 30s max for git operations
      });

      const tmuxSession = result.stdout.trim();
      logger.info('Session launched', { sessionId, tmuxSession });

      // Step 5: Save session to state
      const session: Session = {
        sessionId,
        worktreePath,
        tmuxSession,
        branch,
        status: 'active',
        startedAt: new Date(),
        agentName,
        prompt,
      };

      const stateService = getStateService();
      await stateService.init();
      await stateService.saveSession(session);

      logger.info('Session launched successfully', {
        sessionId,
        tmuxSession,
      });

      return {
        sessionId,
        tmuxSession,
        status: 'launched',
      };
    } catch (error) {
      logger.error('Failed to launch session', error);

      return {
        sessionId,
        tmuxSession: '',
        status: 'failed',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get session status by ID
   */
  static async getSessionStatus(sessionId: string): Promise<Session | null> {
    logger.debug(`Getting session status: ${sessionId}`);
    const stateService = getStateService();
    await stateService.init();

    const session = await stateService.getSession(sessionId);
    if (!session) {
      logger.debug(`Session not found: ${sessionId}`);
      return null;
    }

    logger.debug(`Session found:`, {
      sessionId: session.sessionId,
      status: session.status,
      tmuxSession: session.tmuxSession,
    });

    // Check if tmux session still exists (native tmux)
    logger.debug(`Checking if tmux session ${session.tmuxSession} exists`);
    try {
      await execa('tmux', ['has-session', '-t', session.tmuxSession]);
      logger.debug(`Tmux session exists`);
      // Session exists
    } catch {
      logger.debug(`Tmux session no longer exists, updating session status to terminated`);
      // Session died - update status if it was active
      if (session.status === 'active') {
        await stateService.updateSessionStatus(sessionId, 'terminated');
        session.status = 'terminated';
        session.completedAt = new Date();
      }
    }

    return session;
  }

  /**
   * Get recent output from a session (last 100 lines)
   */
  static async getSessionOutput(sessionId: string): Promise<string | null> {
    const session = await this.getSessionStatus(sessionId);
    if (!session) {
      return null;
    }

    try {
      // Capture last 100 lines from tmux session (native tmux)
      const result = await execa('tmux', [
        'capture-pane',
        '-t', session.tmuxSession,
        '-p',        // print to stdout
        '-S', '-100' // last 100 lines
      ]);
      return result.stdout;
    } catch (error) {
      logger.error(`Failed to capture output for session ${sessionId}`, error);
      return null;
    }
  }

  /**
   * Update session activity timestamp
   */
  static async updateActivity(sessionId: string): Promise<void> {
    const stateService = getStateService();
    await stateService.init();
    await stateService.updateSessionActivity(sessionId);
  }

  /**
   * Mark session as completed
   */
  static async completeSession(
    sessionId: string,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<void> {
    const stateService = getStateService();
    await stateService.init();
    await stateService.updateSessionStatus(sessionId, status);

    logger.info('Session marked as completed', { sessionId, status });
  }

  /**
   * Terminate a running session
   */
  static async terminateSession(sessionId: string): Promise<boolean> {
    logger.debug(`Terminating session: ${sessionId}`);
    const session = await this.getSessionStatus(sessionId);
    if (!session) {
      throw new SessionError(
        `Session not found: ${sessionId}`,
        'SESSION_NOT_FOUND'
      );
    }

    if (session.status !== 'active') {
      logger.warn('Session is not active', { sessionId, status: session.status });
      return false;
    }

    // Kill the tmux session (native tmux)
    try {
      await execa('tmux', ['kill-session', '-t', session.tmuxSession]);

      // Update status
      const stateService = getStateService();
      await stateService.init();
      await stateService.updateSessionStatus(sessionId, 'terminated');

      logger.info('Session terminated', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to terminate session', error);
      return false;
    }
  }

  /**
   * List all sessions
   */
  static async listSessions(): Promise<Session[]> {
    const stateService = getStateService();
    await stateService.init();
    return await stateService.listSessions();
  }

  /**
   * Find sessions by worktree
   */
  static async findSessionsByWorktree(
    worktreePath: string
  ): Promise<Session[]> {
    const stateService = getStateService();
    await stateService.init();
    return await stateService.findSessionsByWorktree(worktreePath);
  }

  /**
   * Clean up old completed sessions
   */
  static async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    const stateService = getStateService();
    await stateService.init();
    return await stateService.cleanupOldSessions(daysOld);
  }
}
