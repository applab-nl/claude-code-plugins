/**
 * MCP Tool: create_terminal
 * Low-level terminal creation (used by other tools or for manual testing)
 */

import type {
  CreateTerminalParams,
  CreateTerminalResult,
} from '../types/index.js';
import { CreateTerminalSchema } from '../utils/validators.js';
import { createTerminalService, loadTerminalConfigFromEnv } from '../services/terminal.service.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * Create a new terminal window/tab
 */
export async function createTerminal(
  params: unknown
): Promise<CreateTerminalResult> {
  // Validate input
  const validated = CreateTerminalSchema.parse(params) as CreateTerminalParams;
  const { shell, cwd, title, command } = validated;

  logger.info('Create terminal requested', { cwd, title, command });

  // Load terminal configuration from environment
  const config = loadTerminalConfigFromEnv();
  const terminalService = createTerminalService(config);

  // Create the terminal
  const result = await terminalService.createTerminal({
    shell,
    cwd,
    title,
    command,
  });

  if (result.success) {
    logger.info('Terminal created successfully', {
      app: result.app,
      pid: result.pid,
    });
  } else {
    logger.error('Terminal creation failed', { error: result.error });
  }

  return result;
}

// Tool metadata for MCP registration
export const createTerminalToolDefinition = {
  name: 'create_terminal',
  description:
    'Create a new terminal window or tab with optional working directory, title, and initial command. This is a low-level tool primarily used by other tools like launch_session.',
  inputSchema: {
    type: 'object',
    properties: {
      shell: {
        type: 'string',
        description: 'Shell to use (default: user default shell)',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the terminal',
      },
      title: {
        type: 'string',
        description: 'Window/tab title',
      },
      command: {
        type: 'string',
        description: 'Initial command to execute in the terminal',
      },
    },
  },
};
