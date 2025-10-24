/**
 * MCP Tool: cleanup_worktree
 * Remove a worktree and clean up associated resources
 */

import type {
  CleanupWorktreeParams,
  CleanupWorktreeResult,
} from '../types/index.js';
import { CleanupWorktreeSchema, isValidPid } from '../utils/validators.js';
import { createGitService } from '../services/git.service.js';
import { getStateService } from '../services/state.service.js';
import { getLogger } from '../utils/logger.js';
import { execa } from 'execa';

const logger = getLogger();

/**
 * Terminate a process by PID
 * CRITICAL SAFETY: Validates PID before ANY signal operation
 */
async function terminateProcess(pid: number): Promise<boolean> {
  // CRITICAL: Validate PID before ANY signal operation
  // PIDs <= 0 have special meanings that can kill system-wide processes:
  // - pid = 0: Signals ALL processes in current process group
  // - pid = -1: Signals ALL processes user owns
  // - pid < -1: Signals specific process group
  if (!isValidPid(pid)) {
    logger.error(`CRITICAL: Invalid PID detected: ${pid}. Refusing to send signals to prevent system-wide process termination.`);
    return false;
  }

  try {
    // Try graceful termination first (SIGTERM)
    logger.debug(`Sending SIGTERM to process ${pid}`);
    process.kill(pid, 'SIGTERM');

    // Wait a bit for graceful shutdown
    logger.debug('Waiting 2s for graceful shutdown');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if still alive (protected by isValidPid above)
    try {
      process.kill(pid, 0);
      // Still alive, force kill
      logger.debug(`Process ${pid} still alive, sending SIGKILL`);
      try {
        process.kill(pid, 'SIGKILL');
      } catch (killError) {
        logger.warn(`Failed to SIGKILL process ${pid}`, killError);
        return false;
      }
    } catch {
      // Process is dead
      logger.debug(`Process ${pid} terminated gracefully`);
    }

    return true;
  } catch (error) {
    logger.warn(`Failed to terminate process ${pid}`, error);
    return false;
  }
}

/**
 * Find the parent repository for a worktree
 */
async function findParentRepository(worktreePath: string): Promise<string> {
  try {
    logger.debug(`Finding parent repository for worktree: ${worktreePath}`);
    // Git worktrees store their parent in .git file
    const { stdout } = await execa('git', ['rev-parse', '--git-common-dir'], {
      cwd: worktreePath,
    });

    // The common dir is inside the parent repo
    const commonDir = stdout.trim();
    logger.debug(`Git common dir: ${commonDir}`);

    if (commonDir.endsWith('.git')) {
      const parentRepo = commonDir.substring(0, commonDir.length - 4);
      logger.debug(`Parent repository: ${parentRepo}`);
      return parentRepo;
    }

    // Might be a bare repository or unusual setup
    logger.debug(`Using common dir as parent: ${commonDir}`);
    return commonDir;
  } catch (error) {
    throw new Error(
      `Could not find parent repository for worktree: ${(error as Error).message}`
    );
  }
}

/**
 * Cleanup a worktree
 */
export async function cleanupWorktree(
  params: unknown
): Promise<CleanupWorktreeResult> {
  // Validate input
  const validated = CleanupWorktreeSchema.parse(
    params
  ) as CleanupWorktreeParams;
  const { worktreePath, force = false, removeBranch = false } = validated;

  logger.info('Cleaning up worktree', { worktreePath, force, removeBranch });

  const stateService = getStateService();
  await stateService.init();

  // Find and terminate associated sessions
  logger.debug('Finding sessions associated with worktree');
  const sessions = await stateService.findSessionsByWorktree(worktreePath);
  logger.debug(`Found ${sessions.length} sessions for worktree`);
  let sessionsTerminated = 0;

  for (const session of sessions) {
    if (session.status === 'active') {
      logger.info(`Terminating active session ${session.sessionId}`);

      // CRITICAL SAFETY: Validate PID before attempting termination
      if (!isValidPid(session.terminalPid)) {
        logger.error(
          `CRITICAL: Session ${session.sessionId} has invalid PID: ${session.terminalPid}. ` +
          `Marking session as failed and skipping termination to prevent system-wide process kill.`
        );
        await stateService.updateSessionStatus(session.sessionId, 'failed');
        continue;
      }

      const terminated = await terminateProcess(session.terminalPid);
      if (terminated) {
        await stateService.updateSessionStatus(session.sessionId, 'terminated');
        sessionsTerminated++;
        logger.debug(`Session ${session.sessionId} terminated`);
      }
    } else {
      logger.debug(`Session ${session.sessionId} is not active (status: ${session.status})`);
    }
  }

  // Find parent repository
  const parentRepo = await findParentRepository(worktreePath);
  logger.debug('Found parent repository', { parentRepo });

  const gitService = createGitService(parentRepo);
  await gitService.validateRepository();

  // Get worktree info before removal
  logger.debug('Getting worktree info before removal');
  const worktreeInfo = await gitService.getWorktreeInfo(worktreePath);
  if (!worktreeInfo) {
    throw new Error(`Worktree not found: ${worktreePath}`);
  }

  const branch = worktreeInfo.branch;
  logger.debug(`Worktree branch: ${branch}`);

  // Remove the worktree
  logger.debug('Removing worktree');
  await gitService.removeWorktree(worktreePath, force);
  logger.debug('Worktree removed');

  // Optionally remove the branch
  let branchRemoved = false;
  if (removeBranch && branch) {
    try {
      logger.debug(`Attempting to remove branch: ${branch}`);
      branchRemoved = await gitService.deleteBranch(branch, force);
      if (branchRemoved) {
        logger.info(`Branch ${branch} removed`);
      } else {
        logger.warn(`Could not remove branch ${branch} (may have unmerged changes)`);
      }
    } catch (error) {
      logger.error(`Failed to remove branch ${branch}`, error);
      // Don't fail the cleanup if branch removal fails
    }
  } else {
    logger.debug(`Not removing branch (removeBranch: ${removeBranch}, branch: ${branch})`);
  }

  // Remove from state
  logger.debug('Removing worktree from state');
  await stateService.deleteWorktree(worktreePath);
  logger.debug('Worktree removed from state');

  logger.info('Worktree cleanup complete', {
    path: worktreePath,
    branchRemoved,
    sessionsTerminated,
  });

  return {
    removed: true,
    worktreePath,
    branchRemoved,
    sessionsTerminated,
  };
}

// Tool metadata for MCP registration
export const cleanupWorktreeToolDefinition = {
  name: 'cleanup_worktree',
  description:
    'Remove a git worktree and clean up associated resources including active sessions. Optionally removes the git branch as well.',
  inputSchema: {
    type: 'object',
    properties: {
      worktreePath: {
        type: 'string',
        description: 'Absolute path to the worktree to remove',
      },
      force: {
        type: 'boolean',
        description:
          'Force removal even if the worktree has uncommitted changes (default: false)',
        default: false,
      },
      removeBranch: {
        type: 'boolean',
        description: 'Also delete the git branch (default: false)',
        default: false,
      },
    },
    required: ['worktreePath'],
  },
};
