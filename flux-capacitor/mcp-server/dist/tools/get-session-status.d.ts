/**
 * MCP Tool: get_session_status
 * Check the status of a Claude Code session
 */
import type { GetSessionStatusResult } from '../types/index.js';
/**
 * Get the status of a session
 */
export declare function getSessionStatus(params: unknown): Promise<GetSessionStatusResult>;
export declare const getSessionStatusToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            sessionId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=get-session-status.d.ts.map