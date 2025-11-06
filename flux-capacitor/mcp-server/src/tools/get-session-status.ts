/**
 * MCP Tool: get_session_status
 * Check the status of a Claude Code session running in tmux
 */

import { execa } from 'execa';
import type {
  GetSessionStatusParams,
  GetSessionStatusResult,
} from '../types/index.js';
import { GetSessionStatusSchema } from '../utils/validators.js';
import { SessionService } from '../services/session.service.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * Get the status of a session
 */
export async function getSessionStatus(
  params: unknown
): Promise<GetSessionStatusResult> {
  // Validate input
  const validated = GetSessionStatusSchema.parse(
    params
  ) as GetSessionStatusParams;
  const { sessionId } = validated;

  logger.debug('Get session status', { sessionId });

  const session = await SessionService.getSessionStatus(sessionId);

  if (!session) {
    return {
      sessionId,
      status: 'unknown',
      worktreePath: '',
      branch: '',
      startedAt: '',
      tmuxSession: '',
      sessionAlive: false,
    };
  }

  // Check if tmux session still exists (native tmux)
  let sessionAlive = false;
  try {
    await execa('tmux', ['has-session', '-t', session.tmuxSession]);
    sessionAlive = true;
  } catch {
    sessionAlive = false;
  }

  // Capture recent output from the session if it's alive
  let recentOutput: string | undefined;
  if (sessionAlive) {
    try {
      const result = await execa('tmux', [
        'capture-pane',
        '-t', session.tmuxSession,
        '-p',        // print to stdout
        '-S', '-100' // last 100 lines
      ]);
      recentOutput = result.stdout;
    } catch (error) {
      logger.warn('Failed to capture recent output', { sessionId, error });
      recentOutput = undefined;
    }
  }

  return {
    sessionId: session.sessionId,
    status: session.status,
    worktreePath: session.worktreePath,
    branch: session.branch,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString(),
    tmuxSession: session.tmuxSession,
    sessionAlive,
    lastActivity: session.lastActivity?.toISOString(),
    recentOutput,
  };
}

// Tool metadata for MCP registration
export const getSessionStatusToolDefinition = {
  name: 'get_session_status',
  description:
    'Check the status of a Claude Code session running in tmux, including whether the tmux session is still alive, when it was last active, and recent output from the session (last 100 lines).',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The unique session identifier returned from launch_session',
      },
    },
    required: ['sessionId'],
  },
};
