/**
 * MCP Tool: get_session_status
 * Check the status of a Claude Code session running in tmux
 */

import type {
  GetSessionStatusParams,
  GetSessionStatusResult,
} from '../types/index.js';
import { GetSessionStatusSchema } from '../utils/validators.js';
import { SessionService } from '../services/session.service.js';
import { getTmuxService } from '../services/tmux.service.js';
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
      startedAt: '',
      tmuxPaneId: '',
      paneAlive: false,
    };
  }

  // Check if pane still exists (SessionService already does this check)
  const tmuxService = getTmuxService();
  const paneAlive = await tmuxService.paneExists(session.tmuxPaneId);

  // Capture recent output from the pane if it's alive
  let recentOutput: string | undefined;
  if (paneAlive) {
    try {
      const output = await tmuxService.capture(session.tmuxPaneId);
      // Get last 50 lines
      const lines = output.split('\n');
      recentOutput = lines.slice(-50).join('\n');
    } catch (error) {
      logger.warn('Failed to capture recent output', { sessionId, error });
      recentOutput = undefined;
    }
  }

  return {
    sessionId: session.sessionId,
    status: session.status,
    worktreePath: session.worktreePath,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString(),
    tmuxPaneId: session.tmuxPaneId,
    paneAlive,
    lastActivity: session.lastActivity?.toISOString(),
    recentOutput,
  };
}

// Tool metadata for MCP registration
export const getSessionStatusToolDefinition = {
  name: 'get_session_status',
  description:
    'Check the status of a Claude Code session running in tmux, including whether the tmux pane is still alive, when it was last active, and recent output from the session.',
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
