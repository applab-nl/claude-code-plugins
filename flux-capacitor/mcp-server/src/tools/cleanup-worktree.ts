/**
 * MCP Tool: cleanup_worktree
 * Remove a worktree and clean up associated resources including tmux panes
 */

import type {
  CleanupWorktreeParams,
  CleanupWorktreeResult,
} from '../types/index.js';
import { CleanupWorktreeSchema } from '../utils/validators.js';
import { createGitService } from '../services/git.service.js';
import { getStateService } from '../services/state.service.js';
import { getTmuxService } from '../services/tmux.service.js';
import { getLogger } from '../utils/logger.js';
import { execa } from 'execa';

const logger = getLogger();

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

  // Find and terminate associated sessions (kill tmux panes)
  logger.debug('Finding sessions associated with worktree');
  const sessions = await stateService.findSessionsByWorktree(worktreePath);
  logger.debug(`Found ${sessions.length} sessions for worktree`);
  let sessionsTerminated = 0;

  const tmuxService = getTmuxService();

  for (const session of sessions) {
    if (session.status === 'active') {
      logger.info(`Terminating active session ${session.sessionId}`);

      try {
        // Kill the tmux pane
        await tmuxService.kill(session.tmuxPaneId);
        await stateService.updateSessionStatus(session.sessionId, 'terminated');
        sessionsTerminated++;
        logger.debug(`Session ${session.sessionId} terminated (pane ${session.tmuxPaneId} killed)`);
      } catch (error) {
        logger.error(`Failed to kill tmux pane for session ${session.sessionId}`, error);
        await stateService.updateSessionStatus(session.sessionId, 'failed');
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
    'Remove a git worktree and clean up associated resources including active tmux sessions. Optionally removes the git branch as well.',
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
