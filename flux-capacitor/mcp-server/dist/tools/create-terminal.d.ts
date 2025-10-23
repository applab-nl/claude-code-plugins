/**
 * MCP Tool: create_terminal
 * Low-level terminal creation (used by other tools or for manual testing)
 */
import type { CreateTerminalResult } from '../types/index.js';
/**
 * Create a new terminal window/tab
 */
export declare function createTerminal(params: unknown): Promise<CreateTerminalResult>;
export declare const createTerminalToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            shell: {
                type: string;
                description: string;
            };
            cwd: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            command: {
                type: string;
                description: string;
            };
        };
    };
};
//# sourceMappingURL=create-terminal.d.ts.map