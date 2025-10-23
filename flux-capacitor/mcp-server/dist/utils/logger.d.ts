/**
 * Simple logger implementation for MCP server
 */
import type { Logger } from '../types/index.js';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare function createLogger(level?: LogLevel): Logger;
export declare function getLogger(): Logger;
export { Logger };
//# sourceMappingURL=logger.d.ts.map