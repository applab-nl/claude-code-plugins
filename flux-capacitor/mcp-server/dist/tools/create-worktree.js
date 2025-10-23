/**
 * MCP Tool: create_worktree
 * Creates a new git worktree for feature development
 */
import { CreateWorktreeSchema } from '../utils/validators.js';
import { createGitService } from '../services/git.service.js';
import { getStateService } from '../services/state.service.js';
import { getLogger } from '../utils/logger.js';
const logger = getLogger();
/**
 * Create a new git worktree
 */
export async function createWorktree(params) {
    // Validate input
    const validated = CreateWorktreeSchema.parse(params);
    const { repository, branch, name, baseBranch } = validated;
    logger.info('Creating worktree', { repository, branch, name });
    const stateService = getStateService();
    await stateService.init();
    const gitService = createGitService(repository);
    // Validate repository
    await gitService.validateRepository();
    // Check if worktree already exists
    const existingWorktrees = await gitService.listWorktrees();
    const existing = existingWorktrees.find(w => w.branch === branch || (name && w.path.endsWith(name)));
    if (existing) {
        logger.info('Worktree already exists', { path: existing.path });
        return {
            worktreePath: existing.path,
            branch: existing.branch,
            status: 'exists',
            initScriptsRun: [],
        };
    }
    // Create the worktree (this will create the branch too if it doesn't exist)
    logger.debug(`Creating worktree with baseBranch: ${baseBranch || 'current HEAD'}`);
    const worktree = await gitService.createWorktree(branch, name, baseBranch);
    // Execute initialization scripts
    const initScriptsRun = [];
    try {
        const scriptResults = await gitService.executeInitScripts(worktree.path, repository);
        // Collect successful script names
        for (const result of scriptResults) {
            if (result.success) {
                initScriptsRun.push(result.script);
            }
            else {
                logger.warn(`Init script ${result.script} failed`, { error: result.error });
            }
        }
    }
    catch (error) {
        logger.error('Failed to execute init scripts', error);
        // Don't fail the worktree creation if init scripts fail
    }
    // Save worktree to state
    await stateService.saveWorktree(worktree);
    logger.info('Worktree created successfully', {
        path: worktree.path,
        branch: worktree.branch,
        initScriptsRun: initScriptsRun.length,
    });
    return {
        worktreePath: worktree.path,
        branch: worktree.branch,
        status: 'created',
        initScriptsRun,
    };
}
// Tool metadata for MCP registration
export const createWorktreeToolDefinition = {
    name: 'create_worktree',
    description: 'Create a new git worktree for isolated feature development. The worktree will be created as a sibling directory to the main repository and will have initialization scripts executed automatically.',
    inputSchema: {
        type: 'object',
        properties: {
            repository: {
                type: 'string',
                description: 'Absolute path to the main git repository',
            },
            branch: {
                type: 'string',
                description: 'Name of the branch to create worktree for (will be created if it doesn\'t exist)',
            },
            name: {
                type: 'string',
                description: 'Optional custom name for the worktree directory (default: generated from repo and branch)',
            },
            baseBranch: {
                type: 'string',
                description: 'Branch to base the new branch on if it needs to be created (default: current branch)',
            },
        },
        required: ['repository', 'branch'],
    },
};
//# sourceMappingURL=create-worktree.js.map