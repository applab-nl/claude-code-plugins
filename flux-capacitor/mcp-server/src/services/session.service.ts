/**
 * Session service for managing Claude Code sessions
 * Handles session creation, tracking, and lifecycle management
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type {
  Session,
  LaunchSessionParams,
  LaunchSessionResult,
  TerminalApp,
} from '../types/index.js';
import { SessionError } from '../types/index.js';
import { createTerminalService } from './terminal.service.js';
import { getStateService } from './state.service.js';
import { getLogger } from '../utils/logger.js';
import { isProcessAlive } from '../utils/validators.js';

const logger = getLogger();

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
   * Create a prompt file for large prompts
   * Claude Code can read prompts from files to avoid command line length limits
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

    // If agent is specified, prepend it to the prompt
    // Claude Code invokes agents by mentioning them in the prompt
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
   * Launch a new Claude Code session in a terminal
   */
  static async launchSession(
    params: LaunchSessionParams
  ): Promise<LaunchSessionResult> {
    const { worktreePath, prompt, contextFiles, agentName, terminalApp } = params;

    logger.info('Launching Claude Code session', {
      worktreePath,
      agentName,
      terminalApp: terminalApp || 'default (warp)',
      contextFilesCount: contextFiles?.length || 0,
    });

    // Generate session ID
    const sessionId = this.generateSessionId(worktreePath);
    logger.debug(`Session ID: ${sessionId}`);

    // Create prompt file for the session
    // Agent name is embedded in the prompt (Claude Code invokes agents by mentioning them)
    logger.debug('Creating prompt file');
    const promptFile = await this.createPromptFile(
      worktreePath,
      prompt,
      agentName,  // Pass agent name to be included in prompt
      contextFiles
    );
    logger.debug(`Prompt file created: ${promptFile}`);

    // Build Claude Code command
    // NOTE: Claude Code doesn't have --agent flag
    // Agents are invoked by mentioning them in the prompt
    logger.debug(`Reading prompt from file: ${promptFile}`);
    const promptContent = await fs.readFile(promptFile, 'utf-8');

    // Use bash here-document to pass multi-line prompt safely
    const claudeCommand = `claude "$(cat <<'PROMPT_EOF'\n${promptContent}\nPROMPT_EOF\n)"`;

    logger.debug('Claude Code command', {
      command: 'claude "<prompt content>"',
      agentInPrompt: agentName || 'none'
    });

    // Create terminal and launch Claude Code
    logger.debug('Creating terminal service', { terminalApp: terminalApp || 'default' });
    const terminalService = createTerminalService(
      terminalApp ? { app: terminalApp } : undefined
    );

    try {
      logger.debug('Creating terminal with command');
      const terminalResult = await terminalService.createTerminal({
        cwd: worktreePath,
        title: `Claude Code - ${path.basename(worktreePath)}`,
        command: claudeCommand,
      });

      logger.debug('Terminal creation result:', {
        success: terminalResult.success,
        pid: terminalResult.pid,
        app: terminalResult.app,
      });

      if (!terminalResult.success) {
        throw new SessionError(
          'Failed to create terminal',
          'TERMINAL_CREATION_FAILED'
        );
      }

      // Create session record
      const session: Session = {
        sessionId,
        worktreePath,
        terminalPid: terminalResult.pid,
        status: 'active',
        startedAt: new Date(),
        terminalApp: terminalResult.app,
        agentName,
        prompt,
      };

      logger.debug('Saving session to state', { sessionId });
      // Save to state
      const stateService = getStateService();
      await stateService.init();
      await stateService.saveSession(session);
      logger.debug('Session saved to state');

      logger.info('Session launched successfully', {
        sessionId,
        terminalPid: terminalResult.pid,
        terminalApp: terminalResult.app,
      });

      return {
        sessionId,
        terminalPid: terminalResult.pid,
        status: 'launched',
        terminalApp: terminalResult.app,
      };
    } catch (error) {
      logger.error('Failed to launch session', error);

      return {
        sessionId,
        terminalPid: -1,
        status: 'failed',
        terminalApp: 'warp' as TerminalApp,
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
      terminalPid: session.terminalPid,
    });

    // Check if terminal is still alive
    logger.debug(`Checking if terminal process ${session.terminalPid} is alive`);
    const terminalAlive = await isProcessAlive(session.terminalPid);
    logger.debug(`Terminal alive: ${terminalAlive}`);

    // Update status if terminal died
    if (!terminalAlive && session.status === 'active') {
      logger.debug(`Terminal died, updating session status to terminated`);
      await stateService.updateSessionStatus(sessionId, 'terminated');
      session.status = 'terminated';
      session.completedAt = new Date();
    }

    return session;
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

    // Terminate the terminal process
    try {
      // Try graceful termination first (SIGTERM)
      logger.debug(`Sending SIGTERM to process ${session.terminalPid}`);
      process.kill(session.terminalPid, 'SIGTERM');

      // Wait a bit for graceful shutdown
      logger.debug('Waiting 2s for graceful shutdown');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if still alive
      const stillAlive = await isProcessAlive(session.terminalPid);
      if (stillAlive) {
        // Force kill
        logger.debug(`Process still alive, sending SIGKILL`);
        process.kill(session.terminalPid, 'SIGKILL');
      } else {
        logger.debug('Process terminated gracefully');
      }

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
