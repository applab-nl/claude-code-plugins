/**
 * MCP Tool: create_worktree
 * Creates a new git worktree for feature development
 */
import type { CreateWorktreeResult } from '../types/index.js';
/**
 * Create a new git worktree
 */
export declare function createWorktree(params: unknown): Promise<CreateWorktreeResult>;
export declare const createWorktreeToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            repository: {
                type: string;
                description: string;
            };
            branch: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            baseBranch: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=create-worktree.d.ts.map