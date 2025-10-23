/**
 * Simple logger implementation for MCP server
 */
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
class SimpleLogger {
    level;
    constructor(level = 'info') {
        this.level = level;
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }
    formatMessage(level, message, args) {
        const timestamp = new Date().toISOString();
        const levelStr = level.toUpperCase().padEnd(5);
        const argsStr = args.length > 0 ? ' ' + args.map(a => JSON.stringify(a)).join(' ') : '';
        return `[${timestamp}] ${levelStr} ${message}${argsStr}`;
    }
    debug(message, ...args) {
        if (this.shouldLog('debug')) {
            // IMPORTANT: Use console.error (stderr) not console.log (stdout)
            // MCP requires stdout to be exclusively for JSON-RPC messages
            console.error(this.formatMessage('debug', message, args));
        }
    }
    info(message, ...args) {
        if (this.shouldLog('info')) {
            // IMPORTANT: Use console.error (stderr) not console.log (stdout)
            // MCP requires stdout to be exclusively for JSON-RPC messages
            console.error(this.formatMessage('info', message, args));
        }
    }
    warn(message, ...args) {
        if (this.shouldLog('warn')) {
            console.error(this.formatMessage('warn', message, args));
        }
    }
    error(message, ...args) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, args));
        }
    }
    setLevel(level) {
        this.level = level;
    }
}
// Singleton instance
let loggerInstance;
export function createLogger(level) {
    if (!loggerInstance) {
        const envLevel = process.env.LOG_LEVEL?.toLowerCase() || level || 'info';
        loggerInstance = new SimpleLogger(envLevel);
    }
    return loggerInstance;
}
export function getLogger() {
    if (!loggerInstance) {
        return createLogger();
    }
    return loggerInstance;
}
//# sourceMappingURL=logger.js.map