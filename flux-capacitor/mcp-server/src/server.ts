/**
 * MCP Server setup and tool registration
 * Flux Capacitor MCP for Flux Capacitor system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
import {
  createWorktree,
  createWorktreeToolDefinition,
} from './tools/create-worktree.js';
import {
  listWorktrees,
  listWorktreesToolDefinition,
} from './tools/list-worktrees.js';
import {
  cleanupWorktree,
  cleanupWorktreeToolDefinition,
} from './tools/cleanup-worktree.js';
import {
  launchSession,
  launchSessionToolDefinition,
} from './tools/launch-session.js';
import {
  getSessionStatus,
  getSessionStatusToolDefinition,
} from './tools/get-session-status.js';
import {
  createTerminal,
  createTerminalToolDefinition,
} from './tools/create-terminal.js';

import { getLogger, createLogger } from './utils/logger.js';
import { getStateService } from './services/state.service.js';

/**
 * Create and configure the MCP server
 */
export async function createServer(): Promise<Server> {
  // Initialize logger
  const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as any) || 'info';
  createLogger(logLevel);
  const logger = getLogger();

  logger.info('Initializing Flux Capacitor MCP Server');

  // Initialize state service
  const stateDir = process.env.STATE_DIR;
  const stateService = getStateService(stateDir);
  await stateService.init();

  logger.info('State service initialized', {
    stateDir: stateService['storageDir'], // Log the actual expanded path
  });

  // Create MCP server
  const server = new Server(
    {
      name: 'flux-capacitor-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Listing available tools');

    return {
      tools: [
        createWorktreeToolDefinition,
        listWorktreesToolDefinition,
        cleanupWorktreeToolDefinition,
        launchSessionToolDefinition,
        getSessionStatusToolDefinition,
        createTerminalToolDefinition,
      ],
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();

    logger.info('Tool called', { name });
    logger.debug('Tool arguments', args);

    try {
      let result: any;

      logger.debug(`Executing tool: ${name}`);
      switch (name) {
        case 'create_worktree':
          result = await createWorktree(args);
          break;

        case 'list_worktrees':
          result = await listWorktrees(args);
          break;

        case 'cleanup_worktree':
          result = await cleanupWorktree(args);
          break;

        case 'launch_session':
          result = await launchSession(args);
          break;

        case 'get_session_status':
          result = await getSessionStatus(args);
          break;

        case 'create_terminal':
          result = await createTerminal(args);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      const duration = Date.now() - startTime;
      logger.info('Tool executed successfully', { name, duration: `${duration}ms` });
      logger.debug('Tool result', result);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Tool execution failed', { name, duration: `${duration}ms`, error });

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.debug('Error stack:', errorStack);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: errorMessage,
                stack: errorStack,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  logger.info('MCP Server configured successfully');
  logger.info('Available tools: create_worktree, list_worktrees, cleanup_worktree, launch_session, get_session_status, create_terminal');

  return server;
}

/**
 * Run the MCP server
 */
export async function runServer(): Promise<void> {
  const logger = getLogger();

  try {
    const server = await createServer();

    // Use stdio transport for communication with Claude Code
    const transport = new StdioServerTransport();

    logger.info('Connecting server to stdio transport');

    await server.connect(transport);

    logger.info('Flux Capacitor MCP Server running');
    logger.info('Waiting for requests from Claude Code...');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start MCP server', error);
    process.exit(1);
  }
}
