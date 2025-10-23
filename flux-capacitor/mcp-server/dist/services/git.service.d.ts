/**
 * Git service for worktree operations using simple-git
 */
import type { Worktree, GitBranch, GitRepository, InitScriptResult } from '../types/index.js';
export declare class GitService {
    private git;
    private repoPath;
    constructor(repositoryPath: string);
    /**
     * Validate that the repository exists and is a git repository
     */
    validateRepository(): Promise<void>;
    /**
     * Get repository information
     */
    getRepositoryInfo(): Promise<GitRepository>;
    /**
     * List all branches in the repository
     */
    listBranches(): Promise<GitBranch[]>;
    /**
     * Check if a branch exists
     */
    branchExists(branchName: string): Promise<boolean>;
    /**
     * Create a new branch from a base branch
     */
    createBranch(branchName: string, baseBranch?: string): Promise<void>;
    /**
     * List all worktrees in the repository
     */
    listWorktrees(): Promise<Worktree[]>;
    /**
     * Check if a worktree exists at the given path
     */
    worktreeExists(worktreePath: string): Promise<boolean>;
    /**
     * Create a new worktree
     */
    createWorktree(branchName: string, worktreeName?: string, baseBranch?: string): Promise<Worktree>;
    /**
     * Remove a worktree
     */
    removeWorktree(worktreePath: string, force?: boolean): Promise<void>;
    /**
     * Delete a branch
     */
    deleteBranch(branchName: string, force?: boolean): Promise<boolean>;
    /**
     * Get information about a specific worktree
     */
    getWorktreeInfo(worktreePath: string): Promise<Worktree | null>;
    /**
     * Execute initialization scripts in a worktree
     */
    executeInitScripts(worktreePath: string, sourceRepo: string): Promise<InitScriptResult[]>;
    /**
     * Parse git worktree list output
     */
    private parseWorktreeList;
}
/**
 * Create a GitService instance for a repository
 */
export declare function createGitService(repositoryPath: string): GitService;
//# sourceMappingURL=git.service.d.ts.map