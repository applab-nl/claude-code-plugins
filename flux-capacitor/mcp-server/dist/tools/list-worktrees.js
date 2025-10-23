/**
 * MCP Tool: list_worktrees
 * Query all active worktrees and their status
 */
import { ListWorktreesSchema } from '../utils/validators.js';
import { createGitService } from '../services/git.service.js';
import { getStateService } from '../services/state.service.js';
import { getLogger } from '../utils/logger.js';
import { validateGitRepository } from '../utils/validators.js';
import path from 'path';
import fs from 'fs/promises';
const logger = getLogger();
/**
 * Find git repositories in common locations
 */
async function findGitRepositories() {
    logger.debug('Searching for git repositories in common locations');
    const repos = [];
    // Check current directory and parent
    const cwd = process.cwd();
    const parent = path.dirname(cwd);
    logger.debug(`Checking current directory: ${cwd}`);
    logger.debug(`Checking parent directory: ${parent}`);
    for (const dir of [cwd, parent]) {
        if (await validateGitRepository(dir)) {
            logger.debug(`Found git repository: ${dir}`);
            repos.push(dir);
        }
    }
    // Check sibling directories of current directory
    try {
        logger.debug(`Scanning sibling directories in: ${parent}`);
        const siblings = await fs.readdir(parent);
        logger.debug(`Found ${siblings.length} sibling directories`);
        for (const sibling of siblings) {
            const siblingPath = path.join(parent, sibling);
            if (await validateGitRepository(siblingPath)) {
                logger.debug(`Found git repository: ${siblingPath}`);
                repos.push(siblingPath);
            }
        }
    }
    catch (error) {
        logger.debug('Error reading parent directory', error);
        // Ignore errors reading parent directory
    }
    // Remove duplicates
    const uniqueRepos = Array.from(new Set(repos));
    logger.debug(`Found ${uniqueRepos.length} unique repositories`);
    return uniqueRepos;
}
/**
 * List all active worktrees
 */
export async function listWorktrees(params) {
    // Validate input
    const validated = ListWorktreesSchema.parse(params);
    const { repository } = validated;
    logger.info('Listing worktrees', { repository });
    const stateService = getStateService();
    await stateService.init();
    // Get repositories to search
    const repositories = repository
        ? [repository]
        : await findGitRepositories();
    if (repositories.length === 0) {
        logger.warn('No git repositories found');
        return { worktrees: [] };
    }
    logger.debug(`Searching ${repositories.length} repositories`, { repositories });
    const allWorktrees = [];
    for (const repo of repositories) {
        try {
            logger.debug(`Processing repository: ${repo}`);
            const gitService = createGitService(repo);
            await gitService.validateRepository();
            const worktrees = await gitService.listWorktrees();
            logger.debug(`Found ${worktrees.length} worktrees in ${repo}`);
            // Enrich with session information from state
            for (const worktree of worktrees) {
                logger.debug(`Checking for session in worktree: ${worktree.path}`);
                const session = await stateService.findSessionByWorktree(worktree.path);
                if (session) {
                    logger.debug(`Found session ${session.sessionId} for worktree ${worktree.path}`);
                    worktree.sessionId = session.sessionId;
                }
            }
            allWorktrees.push(...worktrees);
        }
        catch (error) {
            logger.warn(`Failed to list worktrees for ${repo}`, error);
            // Continue with other repositories
        }
    }
    logger.info(`Found ${allWorktrees.length} worktrees total`);
    return { worktrees: allWorktrees };
}
// Tool metadata for MCP registration
export const listWorktreesToolDefinition = {
    name: 'list_worktrees',
    description: 'Query all active git worktrees and their status. Returns information about each worktree including path, branch, commit, and associated session if any.',
    inputSchema: {
        type: 'object',
        properties: {
            repository: {
                type: 'string',
                description: 'Optional absolute path to filter by a specific repository. If not provided, will search common locations.',
            },
        },
    },
};
//# sourceMappingURL=list-worktrees.js.map