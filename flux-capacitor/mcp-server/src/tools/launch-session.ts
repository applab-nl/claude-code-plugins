/**
 * MCP Tool: launch_session
 * Create a new terminal and launch Claude Code session with specific prompt
 */

import type {
  LaunchSessionParams,
  LaunchSessionResult,
} from '../types/index.js';
import { LaunchSessionSchema } from '../utils/validators.js';
import { SessionService } from '../services/session.service.js';
import { getLogger } from '../utils/logger.js';
import { validateDirectory } from '../utils/validators.js';

const logger = getLogger();

/**
 * Launch a Claude Code session in a new terminal
 */
export async function launchSession(
  params: unknown
): Promise<LaunchSessionResult> {
  // Validate input
  const validated = LaunchSessionSchema.parse(params) as LaunchSessionParams;
  const { worktreePath, prompt, contextFiles, agentName } = validated;

  logger.info('Launch session requested', { worktreePath, agentName });

  // Validate worktree exists
  const worktreeExists = await validateDirectory(worktreePath);
  if (!worktreeExists) {
    throw new Error(`Worktree not found: ${worktreePath}`);
  }

  // Launch the session
  const result = await SessionService.launchSession({
    worktreePath,
    prompt,
    contextFiles,
    agentName,
  });

  if (result.status === 'failed') {
    logger.error('Session launch failed', { error: result.error });
  } else {
    logger.info('Session launched successfully', {
      sessionId: result.sessionId,
      tmuxPaneId: result.tmuxPaneId,
    });
  }

  return result;
}

// Tool metadata for MCP registration
export const launchSessionToolDefinition = {
  name: 'launch_session',
  description:
    'Launch a Claude Code session in a tmux pane with a specific prompt and context. The session will run in an isolated worktree. Requires tmux-cli to be installed.',
  inputSchema: {
    type: 'object',
    properties: {
      worktreePath: {
        type: 'string',
        description: 'Absolute path to the worktree where the session should run',
      },
      prompt: {
        type: 'string',
        description:
          'Initial prompt/instructions for Claude Code. Can be a detailed implementation plan.',
      },
      contextFiles: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional list of file paths to include in the initial context',
      },
      agentName: {
        type: 'string',
        description:
          'Optional specific agent to use (e.g., "local-coordinator", "flutter-specialist")',
      },
    },
    required: ['worktreePath', 'prompt'],
  },
};
