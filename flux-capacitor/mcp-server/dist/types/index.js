/**
 * Core type definitions for Workspace Orchestrator MCP Server
 */
// ============================================================================
// Error Types
// ============================================================================
export class WorktreeError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'WorktreeError';
    }
}
export class SessionError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'SessionError';
    }
}
export class TerminalError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'TerminalError';
    }
}
//# sourceMappingURL=index.js.map