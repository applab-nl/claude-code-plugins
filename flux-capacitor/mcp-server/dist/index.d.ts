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
export {};
//# sourceMappingURL=index.d.ts.map