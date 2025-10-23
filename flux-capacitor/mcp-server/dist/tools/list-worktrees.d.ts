/**
 * MCP Tool: list_worktrees
 * Query all active worktrees and their status
 */
import type { ListWorktreesResult } from '../types/index.js';
/**
 * List all active worktrees
 */
export declare function listWorktrees(params: unknown): Promise<ListWorktreesResult>;
export declare const listWorktreesToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            repository: {
                type: string;
                description: string;
            };
        };
    };
};
//# sourceMappingURL=list-worktrees.d.ts.map