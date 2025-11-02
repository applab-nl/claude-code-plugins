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
  /** Tmux pane ID (e.g., "remote-cli-session:0.2") */
  tmuxPaneId: string;
  /** Session status */
  status: SessionStatus;
  /** When the session was started */
  startedAt: Date;
  /** When the session completed (if not active) */
  completedAt?: Date;
  /** Last activity timestamp */
  lastActivity?: Date;
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
}

export interface LaunchSessionResult {
  /** Unique session identifier */
  sessionId: string;
  /** Tmux pane ID */
  tmuxPaneId: string;
  /** Launch status */
  status: 'launched' | 'failed';
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
  /** Tmux pane ID */
  tmuxPaneId: string;
  /** Whether tmux pane is still alive */
  paneAlive: boolean;
  /** Last activity timestamp */
  lastActivity?: string;
  /** Recent output from the pane (last 50 lines) */
  recentOutput?: string;
}

// ============================================================================
// Tmux Types
// ============================================================================

export interface TmuxPane {
  /** Pane identifier (e.g., "remote-cli-session:0.2") */
  id: string;
  /** Pane index */
  index: number;
  /** Whether this is the active pane */
  active: boolean;
}

export interface TmuxSendOptions {
  /** Whether to send Enter key after text (default: true) */
  enter?: boolean;
  /** Delay before sending Enter, or false to send immediately (default: 1 second) */
  delayEnter?: boolean | number;
}

// ============================================================================
// Terminal Types (Deprecated - kept for migration compatibility)
// ============================================================================

/** @deprecated Terminal types are deprecated. Use tmux-based session management instead. */
export type TerminalApp = 'warp' | 'iterm2' | 'terminal' | 'custom';

/** @deprecated Terminal config is deprecated. Sessions now use tmux. */
export interface TerminalConfig {
  app: TerminalApp;
  customCommand?: string;
  detectOrder?: TerminalApp[];
  iterm2Profile?: string;
  terminalProfile?: string;
}

/** @deprecated Terminal creation is deprecated. Use tmux-based session management instead. */
export interface CreateTerminalParams {
  shell?: string;
  cwd?: string;
  title?: string;
  command?: string | { type: 'prompt-file'; promptFile: string };
}

/** @deprecated Terminal result is deprecated. Use tmux-based session management instead. */
export interface CreateTerminalResult {
  pid: number;
  app: TerminalApp;
  success: boolean;
  error?: string;
}

/** @deprecated Terminal instance is deprecated. Use tmux-based session management instead. */
export interface TerminalInstance {
  pid: number;
  app: TerminalApp;
  cwd: string;
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
  | 'TMUX_NOT_AVAILABLE'
  | 'PANE_LAUNCH_FAILED'
  | 'CLAUDE_LAUNCH_FAILED'
  | 'INVALID_WORKTREE'
  | 'INVALID_PANE_ID';

export class TmuxError extends Error {
  constructor(
    message: string,
    public code: TmuxErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TmuxError';
  }
}

export type TmuxErrorCode =
  | 'TMUX_NOT_AVAILABLE'
  | 'LAUNCH_FAILED'
  | 'SEND_FAILED'
  | 'CAPTURE_FAILED'
  | 'LIST_FAILED'
  | 'WAIT_FAILED'
  | 'KILL_FAILED'
  | 'INTERRUPT_FAILED'
  | 'ESCAPE_FAILED'
  | 'STATUS_FAILED'
  | 'ATTACH_FAILED'
  | 'CLEANUP_FAILED';

/** @deprecated TerminalError is deprecated. Use TmuxError instead. */
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

/** @deprecated TerminalErrorCode is deprecated. Use TmuxErrorCode instead. */
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
