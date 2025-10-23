/**
 * MCP Tool: launch_session
 * Create a new terminal and launch Claude Code session with specific prompt
 */
import type { LaunchSessionResult } from '../types/index.js';
/**
 * Launch a Claude Code session in a new terminal
 */
export declare function launchSession(params: unknown): Promise<LaunchSessionResult>;
export declare const launchSessionToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            worktreePath: {
                type: string;
                description: string;
            };
            prompt: {
                type: string;
                description: string;
            };
            contextFiles: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            agentName: {
                type: string;
                description: string;
            };
            terminalApp: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=launch-session.d.ts.map