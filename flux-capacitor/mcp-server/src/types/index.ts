/**
 * Core type definitions for Workspace Orchestrator MCP Server
 */

// ============================================================================
// Worktree Types
// ============================================================================

export interface Worktree {
  /** Absolute path to the worktree directory */
  path: string;
  /** Git branch name */
  branch: string;
  /** Current commit SHA */
  commit: string;
  /** Whether the worktree is locked */
  locked: boolean;
  /** Whether the worktree can be pruned (detached HEAD with no refs) */
  prunable: boolean;
  /** Associated session ID if any */
  sessionId?: string;
  /** Parent repository path */
  repository: string;
  /** Timestamp when worktree was created */
  createdAt: Date;
}

export interface CreateWorktreeParams {
  /** Path to the main repository */
  repository: string;
  /** Branch name (creates if doesn't exist) */
  branch: string;
  /** Optional custom worktree directory name */
  name?: string;
  /** Base branch to create new branch from (default: current) */
  baseBranch?: string;
}

export interface CreateWorktreeResult {
  /** Absolute path to the created worktree */
  worktreePath: string;
  /** Branch name */
  branch: string;
  /** Status of the operation */
  status: 'created' | 'exists';
  /** List of initialization scripts that were executed */
  initScriptsRun: string[];
}

export interface ListWorktreesParams {
  /** Optional filter by repository path */
  repository?: string;
}

export interface ListWorktreesResult {
  /** Array of worktree information */
  worktrees: Worktree[];
}

export interface CleanupWorktreeParams {
  /** Path to the worktree to remove */
  worktreePath: string;
  /** Force removal even if worktree has uncommitted changes */
  force?: boolean;
  /** Also delete the git branch */
  removeBranch?: boolean;
}

export interface CleanupWorktreeResult {
  /** Whether the worktree was successfully removed */
  removed: boolean;
  /** Path that was removed */
  worktreePath: string;
  /** Whether the branch was also removed */
  branchRemoved?: boolean;
  /** Number of sessions that were terminated */
  sessionsTerminated: number;
}

// ============================================================================
// Session Types
// ============================================================================

export type SessionStatus =
  | 'active'
  | 'completed'
  | 'failed'
  | 'terminated'
  | 'unknown';

export interface Session {
  /** Unique session identifier */
  sessionId: string;
  /** Path to the worktree this session is working in */
  worktreePath: string;
  /** Terminal process ID */
  terminalPid: number;
  /** Claude Code process ID (if detectable) */
  claudePid?: number;
  /** Session status */
  status: SessionStatus;
  /** When the session was started */
  startedAt: Date;
  /** When the session completed (if not active) */
  completedAt?: Date;
  /** Last activity timestamp */
  lastActivity?: Date;
  /** Terminal application used */
  terminalApp: TerminalApp;
  /** Agent name used in this session */
  agentName?: string;
  /** Initial prompt provided */
  prompt: string;
}

export interface LaunchSessionParams {
  /** Path to the worktree */
  worktreePath: string;
  /** Initial prompt/instructions for Claude Code */
  prompt: string;
  /** Optional list of files to include in initial context */
  contextFiles?: string[];
  /** Optional specific agent to use (e.g., "local-coordinator") */
  agentName?: string;
  /** Optional terminal app to use (default: warp) */
  terminalApp?: TerminalApp;
}

export interface LaunchSessionResult {
  /** Unique session identifier */
  sessionId: string;
  /** Terminal process ID */
  terminalPid: number;
  /** Claude Code process ID (if detectable) */
  claudePid?: number;
  /** Launch status */
  status: 'launched' | 'failed';
  /** Terminal application used */
  terminalApp: TerminalApp;
  /** Error message if failed */
  error?: string;
}

export interface GetSessionStatusParams {
  /** Session ID to query */
  sessionId: string;
}

export interface GetSessionStatusResult {
  /** Session identifier */
  sessionId: string;
  /** Current status */
  status: SessionStatus;
  /** Worktree path */
  worktreePath: string;
  /** When session started */
  startedAt: string;
  /** When session completed (if applicable) */
  completedAt?: string;
  /** Terminal process ID */
  terminalPid: number;
  /** Whether terminal process is still alive */
  terminalAlive: boolean;
  /** Last activity timestamp */
  lastActivity?: string;
  /** Terminal app used */
  terminalApp: TerminalApp;
}

// ============================================================================
// Terminal Types
// ============================================================================

export type TerminalApp = 'warp' | 'iterm2' | 'terminal' | 'custom';

export interface TerminalConfig {
  /** Terminal application to use (or 'custom' with command) */
  app: TerminalApp;
  /** Custom command template for creating terminals (if app is 'custom') */
  customCommand?: string;
  /** Priority order for auto-detection */
  detectOrder?: TerminalApp[];
  /** iTerm2 profile name to use (default: iTerm2's default profile) */
  iterm2Profile?: string;
  /** Terminal.app profile/settings name to use (default: Basic) */
  terminalProfile?: string;
}

export interface CreateTerminalParams {
  /** Shell to use (default: user's default shell) */
  shell?: string;
  /** Working directory */
  cwd?: string;
  /** Window title */
  title?: string;
  /** Initial command to execute */
  command?: string;
}

export interface CreateTerminalResult {
  /** Process ID of the terminal */
  pid: number;
  /** Terminal application used */
  app: TerminalApp;
  /** Whether creation was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

export interface TerminalInstance {
  /** Process ID */
  pid: number;
  /** Terminal app */
  app: TerminalApp;
  /** Working directory */
  cwd: string;
  /** Execute a command in this terminal */
  execute: (command: string) => Promise<void>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ServerConfig {
  /** State storage directory */
  stateDir: string;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Maximum number of active worktrees allowed */
  maxWorktrees: number;
  /** Terminal configuration */
  terminal: TerminalConfig;
  /** Whether to auto-cleanup merged worktrees */
  autoCleanup: boolean;
  /** Days before prompting to cleanup old worktrees */
  cleanupPromptDays: number;
}

export interface InitScriptResult {
  /** Script filename */
  script: string;
  /** Whether it executed successfully */
  success: boolean;
  /** Execution time in milliseconds */
  duration: number;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Git Types
// ============================================================================

export interface GitBranch {
  /** Branch name */
  name: string;
  /** Current commit SHA */
  commit: string;
  /** Whether this is the current branch */
  current: boolean;
}

export interface GitRepository {
  /** Absolute path to repository */
  path: string;
  /** Current branch */
  currentBranch: string;
  /** Whether the working tree is clean */
  isClean: boolean;
  /** Number of uncommitted changes */
  uncommittedChanges: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class WorktreeError extends Error {
  constructor(
    message: string,
    public code: WorktreeErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'WorktreeError';
  }
}

export type WorktreeErrorCode =
  | 'WORKTREE_EXISTS'
  | 'WORKTREE_NOT_FOUND'
  | 'WORKTREE_DIRTY'
  | 'BRANCH_EXISTS'
  | 'BRANCH_NOT_FOUND'
  | 'REPOSITORY_NOT_FOUND'
  | 'GIT_ERROR'
  | 'INIT_SCRIPT_FAILED'
  | 'MAX_WORKTREES_EXCEEDED';

export class SessionError extends Error {
  constructor(
    message: string,
    public code: SessionErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export type SessionErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_ALREADY_EXISTS'
  | 'TERMINAL_CREATION_FAILED'
  | 'CLAUDE_LAUNCH_FAILED'
  | 'INVALID_WORKTREE';

export class TerminalError extends Error {
  constructor(
    message: string,
    public code: TerminalErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TerminalError';
  }
}

export type TerminalErrorCode =
  | 'NO_TERMINAL_AVAILABLE'
  | 'TERMINAL_NOT_FOUND'
  | 'COMMAND_EXECUTION_FAILED'
  | 'INVALID_CONFIGURATION';

// ============================================================================
// Utility Types
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}
