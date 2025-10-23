/**
 * Git service for worktree operations using simple-git
 */

import { simpleGit, SimpleGit, BranchSummary } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { execa } from 'execa';
import type {
  Worktree,
  GitBranch,
  GitRepository,
  InitScriptResult,
} from '../types/index.js';
import { WorktreeError } from '../types/index.js';
import {
  validateGitRepository,
  validateDirectory,
  generateWorktreeName,
  normalizePath,
} from '../utils/validators.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repositoryPath: string) {
    this.repoPath = normalizePath(repositoryPath);

    // Configure simple-git to suppress progress output
    // IMPORTANT: Git progress output must not go to stdout (breaks MCP protocol)
    this.git = simpleGit(this.repoPath, {
      // Suppress git's progress messages which would otherwise go to stdout
      progress: ({ method, stage, progress }) => {
        // Log progress to stderr via our logger instead
        logger.debug(`Git ${method}: ${stage} ${progress}%`);
      },
    });
  }

  /**
   * Validate that the repository exists and is a git repository
   */
  async validateRepository(): Promise<void> {
    logger.debug(`Validating git repository: ${this.repoPath}`);
    const isValid = await validateGitRepository(this.repoPath);
    if (!isValid) {
      throw new WorktreeError(
        `Not a valid git repository: ${this.repoPath}`,
        'REPOSITORY_NOT_FOUND'
      );
    }
    logger.debug(`Repository validated successfully: ${this.repoPath}`);
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<GitRepository> {
    await this.validateRepository();

    logger.debug(`Getting repository info for: ${this.repoPath}`);
    const status = await this.git.status();
    const currentBranch = status.current || 'unknown';

    const info = {
      path: this.repoPath,
      currentBranch,
      isClean: status.isClean(),
      uncommittedChanges: status.files.length,
    };

    logger.debug(`Repository info:`, info);
    return info;
  }

  /**
   * List all branches in the repository
   */
  async listBranches(): Promise<GitBranch[]> {
    await this.validateRepository();

    logger.debug(`Listing branches in: ${this.repoPath}`);
    const branchSummary: BranchSummary = await this.git.branchLocal();

    const branches = branchSummary.all.map(name => ({
      name,
      commit: branchSummary.branches[name].commit,
      current: name === branchSummary.current,
    }));

    logger.debug(`Found ${branches.length} branches:`, branches.map(b => b.name));
    return branches;
  }

  /**
   * Check if a branch exists
   */
  async branchExists(branchName: string): Promise<boolean> {
    logger.debug(`Checking if branch exists: ${branchName}`);
    const branches = await this.listBranches();
    const exists = branches.some(b => b.name === branchName);
    logger.debug(`Branch ${branchName} exists: ${exists}`);
    return exists;
  }

  /**
   * Create a new branch from a base branch
   */
  async createBranch(
    branchName: string,
    baseBranch?: string
  ): Promise<void> {
    await this.validateRepository();

    const exists = await this.branchExists(branchName);
    if (exists) {
      logger.debug(`Branch ${branchName} already exists`);
      return;
    }

    logger.info(`Creating branch: ${branchName} from ${baseBranch || 'current'}`);

    if (baseBranch) {
      // Create from specific base branch
      logger.debug(`Executing: git checkout -b ${branchName} ${baseBranch}`);
      await this.git.checkoutBranch(branchName, baseBranch);
    } else {
      // Create from current HEAD
      logger.debug(`Executing: git checkout -b ${branchName}`);
      await this.git.checkoutLocalBranch(branchName);
    }
    logger.debug(`Branch ${branchName} created successfully`);
  }

  /**
   * List all worktrees in the repository
   */
  async listWorktrees(): Promise<Worktree[]> {
    await this.validateRepository();

    try {
      logger.debug(`Executing: git worktree list --porcelain`);
      const output = await this.git.raw(['worktree', 'list', '--porcelain']);
      logger.debug(`Git worktree list output:`, output);
      const worktrees = this.parseWorktreeList(output);
      logger.debug(`Found ${worktrees.length} worktrees:`, worktrees.map(w => ({ path: w.path, branch: w.branch })));
      return worktrees;
    } catch (error) {
      logger.error('Failed to list worktrees', error);
      throw new WorktreeError(
        'Failed to list worktrees',
        'GIT_ERROR',
        error
      );
    }
  }

  /**
   * Check if a worktree exists at the given path
   */
  async worktreeExists(worktreePath: string): Promise<boolean> {
    logger.debug(`Checking if worktree exists: ${worktreePath}`);
    const worktrees = await this.listWorktrees();
    const normalizedPath = normalizePath(worktreePath);
    const exists = worktrees.some(w => w.path === normalizedPath);
    logger.debug(`Worktree ${worktreePath} exists: ${exists}`);
    return exists;
  }

  /**
   * Create a new worktree
   */
  async createWorktree(
    branchName: string,
    worktreeName?: string,
    baseBranch?: string
  ): Promise<Worktree> {
    await this.validateRepository();

    // Generate worktree path
    const name = worktreeName || generateWorktreeName(this.repoPath, branchName);
    const parentDir = path.dirname(this.repoPath);
    const worktreePath = path.join(parentDir, name);

    logger.info(`Creating worktree at ${worktreePath} on branch ${branchName}`);

    // Check if worktree already exists
    if (await this.worktreeExists(worktreePath)) {
      throw new WorktreeError(
        `Worktree already exists at ${worktreePath}`,
        'WORKTREE_EXISTS'
      );
    }

    // Check if directory already exists
    if (await validateDirectory(worktreePath)) {
      throw new WorktreeError(
        `Directory already exists at ${worktreePath}`,
        'WORKTREE_EXISTS'
      );
    }

    try {
      // Check if branch exists
      const branchExists = await this.branchExists(branchName);

      if (branchExists) {
        // Branch exists, just add worktree pointing to it
        logger.debug(`Branch ${branchName} exists, creating worktree`);
        logger.debug(`Executing: git worktree add --quiet ${worktreePath} ${branchName}`);
        // Use --quiet to suppress git's progress output to stdout
        await this.git.raw(['worktree', 'add', '--quiet', worktreePath, branchName]);
      } else {
        // Branch doesn't exist, create it with the worktree
        logger.debug(`Branch ${branchName} doesn't exist, creating branch and worktree`);

        if (baseBranch) {
          // Create new branch from specific base branch
          logger.debug(`Executing: git worktree add --quiet -b ${branchName} ${worktreePath} ${baseBranch}`);
          await this.git.raw(['worktree', 'add', '--quiet', '-b', branchName, worktreePath, baseBranch]);
        } else {
          // Create new branch from current HEAD
          logger.debug(`Executing: git worktree add --quiet -b ${branchName} ${worktreePath}`);
          await this.git.raw(['worktree', 'add', '--quiet', '-b', branchName, worktreePath]);
        }
      }

      logger.debug(`Worktree created at: ${worktreePath}`);

      // Get worktree info
      const worktrees = await this.listWorktrees();
      const newWorktree = worktrees.find(w => w.path === normalizePath(worktreePath));

      if (!newWorktree) {
        throw new WorktreeError(
          'Worktree created but not found in list',
          'GIT_ERROR'
        );
      }

      logger.debug(`Worktree info:`, newWorktree);
      return newWorktree;
    } catch (error) {
      logger.error('Failed to create worktree', error);
      throw new WorktreeError(
        `Failed to create worktree: ${(error as Error).message}`,
        'GIT_ERROR',
        error
      );
    }
  }

  /**
   * Remove a worktree
   */
  async removeWorktree(worktreePath: string, force = false): Promise<void> {
    await this.validateRepository();

    const normalizedPath = normalizePath(worktreePath);

    logger.info(`Removing worktree at ${normalizedPath}`, { force });

    // Check if worktree exists
    const exists = await this.worktreeExists(normalizedPath);
    if (!exists) {
      throw new WorktreeError(
        `Worktree not found at ${normalizedPath}`,
        'WORKTREE_NOT_FOUND'
      );
    }

    try {
      const args = ['worktree', 'remove', normalizedPath];
      if (force) {
        args.push('--force');
      }

      logger.debug(`Executing: git ${args.join(' ')}`);
      await this.git.raw(args);
      logger.info(`Successfully removed worktree at ${normalizedPath}`);
    } catch (error) {
      const message = (error as Error).message;

      // Check if worktree has uncommitted changes
      if (message.includes('contains modified or untracked files')) {
        throw new WorktreeError(
          `Worktree has uncommitted changes. Use force=true to override.`,
          'WORKTREE_DIRTY',
          error
        );
      }

      logger.error('Failed to remove worktree', error);
      throw new WorktreeError(
        `Failed to remove worktree: ${message}`,
        'GIT_ERROR',
        error
      );
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(branchName: string, force = false): Promise<boolean> {
    await this.validateRepository();

    try {
      logger.debug(`Executing: git branch ${force ? '-D' : '-d'} ${branchName}`);
      if (force) {
        await this.git.deleteLocalBranch(branchName, true);
      } else {
        await this.git.deleteLocalBranch(branchName);
      }

      logger.info(`Deleted branch: ${branchName}`);
      return true;
    } catch (error) {
      const message = (error as Error).message;

      // Branch might not exist or has unmerged changes
      if (message.includes('not found') || message.includes('not fully merged')) {
        logger.warn(`Could not delete branch ${branchName}:`, message);
        return false;
      }

      throw new WorktreeError(
        `Failed to delete branch: ${message}`,
        'GIT_ERROR',
        error
      );
    }
  }

  /**
   * Get information about a specific worktree
   */
  async getWorktreeInfo(worktreePath: string): Promise<Worktree | null> {
    const worktrees = await this.listWorktrees();
    const normalizedPath = normalizePath(worktreePath);
    return worktrees.find(w => w.path === normalizedPath) || null;
  }

  /**
   * Execute initialization scripts in a worktree
   */
  async executeInitScripts(
    worktreePath: string,
    sourceRepo: string
  ): Promise<InitScriptResult[]> {
    const initDir = path.join(worktreePath, '.worktree-init');

    logger.debug(`Looking for init scripts in: ${initDir}`);

    // Check if init directory exists
    try {
      await fs.access(initDir);
    } catch {
      logger.debug('No .worktree-init directory found');
      return [];
    }

    // Find all shell scripts
    const files = await fs.readdir(initDir);
    const scripts = files
      .filter(f => f.endsWith('.sh'))
      .sort(); // Execute in alphabetical order

    logger.info(`Found ${scripts.length} initialization scripts`);
    logger.debug(`Init scripts:`, scripts);

    const results: InitScriptResult[] = [];

    for (const script of scripts) {
      const scriptPath = path.join(initDir, script);
      const startTime = Date.now();

      try {
        // Make executable
        logger.debug(`Making ${script} executable`);
        await fs.chmod(scriptPath, 0o755);

        // Execute with source repository as argument
        logger.info(`Executing init script: ${script}`);
        logger.debug(`Running: ${scriptPath} ${sourceRepo} (cwd: ${worktreePath})`);
        const result = await execa(scriptPath, [sourceRepo], {
          cwd: worktreePath,
          // IMPORTANT: Don't use 'inherit' - it would send stdout to parent's stdout
          // which breaks MCP protocol. Instead, let execa capture output.
          all: true, // Capture both stdout and stderr into result.all
        });

        // Log script output (captured, won't go to stdout)
        if (result.all) {
          logger.debug(`${script} output:`, result.all);
        }

        const duration = Date.now() - startTime;
        results.push({
          script,
          success: true,
          duration,
        });

        logger.info(`✓ ${script} completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = (error as Error).message;

        results.push({
          script,
          success: false,
          duration,
          error: errorMessage,
        });

        logger.error(`✗ ${script} failed:`, errorMessage);

        // Continue with other scripts even if one fails
        // (but log the failure)
      }
    }

    return results;
  }

  /**
   * Parse git worktree list output
   */
  private parseWorktreeList(output: string): Worktree[] {
    const worktrees: Worktree[] = [];
    const lines = output.trim().split('\n');

    let current: Partial<Worktree> = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        // Start of new worktree entry
        if (current.path) {
          worktrees.push(current as Worktree);
        }
        current = {
          path: normalizePath(line.substring(9)),
          repository: this.repoPath,
          locked: false,
          prunable: false,
          createdAt: new Date(), // We don't have creation time from git
        };
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring(5);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace(/^refs\/heads\//, '');
      } else if (line.startsWith('bare')) {
        // Main repository (bare checkout)
        current.branch = current.branch || 'main';
      } else if (line.startsWith('locked')) {
        current.locked = true;
      } else if (line.startsWith('prunable')) {
        current.prunable = true;
      }
    }

    // Add the last worktree
    if (current.path) {
      worktrees.push(current as Worktree);
    }

    return worktrees;
  }
}

/**
 * Create a GitService instance for a repository
 */
export function createGitService(repositoryPath: string): GitService {
  return new GitService(repositoryPath);
}
