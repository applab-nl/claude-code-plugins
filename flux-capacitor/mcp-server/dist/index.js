#!/usr/bin/env node
/**
 * Workspace Orchestrator MCP Server
 * Entry point for the Flux Capacitor MCP-based architecture
 *
 * This MCP server provides tools for:
 * - Git worktree management (create, list, cleanup)
 * - Claude Code session orchestration (launch, status, terminal creation)
 * - State persistence and tracking
 *
 * Usage:
 *   node dist/index.js
 *
 * Configuration via environment variables:
 *   LOG_LEVEL=debug|info|warn|error          - Logging verbosity (default: info)
 *   STATE_DIR=/path/to/state                 - State storage directory
 *   TERMINAL_APP=warp|iterm2|terminal|custom - Terminal preference
 *   TERMINAL_CUSTOM_COMMAND="template"       - Custom terminal command
 *   TERMINAL_DETECT_ORDER=warp,iterm2        - Terminal detection priority
 */
import { runServer } from './server.js';
import { getLogger, createLogger } from './utils/logger.js';
// Initialize logger first
const logLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
createLogger(logLevel);
const logger = getLogger();
// Log startup information
logger.info('='.repeat(80));
logger.info('Workspace Orchestrator MCP Server');
logger.info('Version: 1.0.0');
logger.info('='.repeat(80));
// Log configuration
logger.debug('Configuration:', {
    logLevel,
    stateDir: process.env.STATE_DIR || '~/.claude/flux-capacitor/state',
    terminalApp: process.env.TERMINAL_APP || 'auto-detect',
    terminalDetectOrder: process.env.TERMINAL_DETECT_ORDER || 'warp,iterm2,terminal',
});
// Run the server
runServer().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map