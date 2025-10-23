/**
 * MCP Tool: cleanup_worktree
 * Remove a worktree and clean up associated resources
 */
import type { CleanupWorktreeResult } from '../types/index.js';
/**
 * Cleanup a worktree
 */
export declare function cleanupWorktree(params: unknown): Promise<CleanupWorktreeResult>;
export declare const cleanupWorktreeToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            worktreePath: {
                type: string;
                description: string;
            };
            force: {
                type: string;
                description: string;
                default: boolean;
            };
            removeBranch: {
                type: string;
                description: string;
                default: boolean;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=cleanup-worktree.d.ts.map