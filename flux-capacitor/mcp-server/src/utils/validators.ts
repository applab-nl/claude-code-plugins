/**
 * Validation utilities using Zod
 */

import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

// ============================================================================
// Schema Definitions
// ============================================================================

export const CreateWorktreeSchema = z.object({
  repository: z.string().min(1, 'Repository path is required'),
  branch: z.string().min(1, 'Branch name is required'),
  name: z.string().optional(),
  baseBranch: z.string().optional(),
});

export const LaunchSessionSchema = z.object({
  worktreePath: z.string().min(1, 'Worktree path is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  contextFiles: z.array(z.string()).optional(),
  agentName: z.string().optional(),
  terminalApp: z.enum(['warp', 'iterm2', 'terminal', 'custom']).optional(),
});

export const ListWorktreesSchema = z.object({
  repository: z.string().optional(),
});

export const CleanupWorktreeSchema = z.object({
  worktreePath: z.string().min(1, 'Worktree path is required'),
  force: z.boolean().optional().default(false),
  removeBranch: z.boolean().optional().default(false),
});

export const GetSessionStatusSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const CreateTerminalSchema = z.object({
  shell: z.string().optional(),
  cwd: z.string().optional(),
  title: z.string().optional(),
  command: z.string().optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a path exists and is a directory
 */
export async function validateDirectory(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path exists and is a file
 */
export async function validateFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a valid git repository
 */
export async function validateGitRepository(repoPath: string): Promise<boolean> {
  try {
    const gitDir = path.join(repoPath, '.git');
    return await validateDirectory(gitDir);
  } catch {
    return false;
  }
}

/**
 * Normalize and resolve a file path
 */
export function normalizePath(filePath: string): string {
  return path.resolve(path.normalize(filePath));
}

/**
 * Check if a path is absolute
 */
export function isAbsolutePath(filePath: string): boolean {
  return path.isAbsolute(filePath);
}

/**
 * Validate branch name format
 */
export function validateBranchName(branch: string): boolean {
  // Git branch name rules:
  // - Cannot start with a dot
  // - Cannot contain: .., ~, ^, :, ?, *, [, \, consecutive slashes
  // - Cannot end with .lock
  // - Cannot end with a slash
  const invalidPatterns = [
    /^\./,              // starts with dot
    /\.\./,             // contains double dot
    /[~^:?*[\]\\]/,     // contains special chars
    /\/\//,             // consecutive slashes
    /\.lock$/,          // ends with .lock
    /\/$/,              // ends with slash
    /@\{/,              // contains @{
  ];

  return !invalidPatterns.some(pattern => pattern.test(branch));
}

/**
 * Sanitize a string for use in file/directory names
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-')  // Replace invalid chars with dash
    .replace(/-+/g, '-')               // Replace multiple dashes with single
    .replace(/^-|-$/g, '')             // Remove leading/trailing dashes
    .toLowerCase();
}

/**
 * Generate a worktree directory name from repository and branch
 */
export function generateWorktreeName(repoPath: string, branch: string): string {
  const repoName = path.basename(repoPath);
  const branchName = sanitizeFilename(branch);
  return `${repoName}-${branchName}`;
}

/**
 * Validate that a PID is safe to signal
 * CRITICAL: PIDs <= 0 have special meanings in Unix:
 * - pid = 0: Signals all processes in current process group
 * - pid = -1: Signals all processes user owns
 * - pid < -1: Signals specific process group
 * Using these values can cause catastrophic system-wide failures.
 */
export function isValidPid(pid: number | undefined | null): boolean {
  return (
    typeof pid === 'number' &&
    !isNaN(pid) &&
    Number.isInteger(pid) &&
    Number.isFinite(pid) &&
    pid > 0
  );
}

/**
 * Check if a process is running
 * IMPORTANT: Only checks valid PIDs to prevent system-wide signal broadcasts
 */
export async function isProcessAlive(pid: number): Promise<boolean> {
  // CRITICAL: Validate PID before ANY signal operation
  if (!isValidPid(pid)) {
    return false;
  }

  try {
    // process.kill with signal 0 doesn't actually kill the process,
    // it just checks if it exists and we have permission to signal it
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // ESRCH means no such process
    return false;
  }
}

/**
 * Parse key=value environment variables
 */
export function parseEnvVars(envString: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of envString.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      env[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return env;
}
