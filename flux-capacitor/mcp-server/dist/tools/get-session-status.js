/**
 * MCP Tool: get_session_status
 * Check the status of a Claude Code session
 */
import { GetSessionStatusSchema } from '../utils/validators.js';
import { SessionService } from '../services/session.service.js';
import { getLogger } from '../utils/logger.js';
import { isProcessAlive } from '../utils/validators.js';
const logger = getLogger();
/**
 * Get the status of a session
 */
export async function getSessionStatus(params) {
    // Validate input
    const validated = GetSessionStatusSchema.parse(params);
    const { sessionId } = validated;
    logger.debug('Get session status', { sessionId });
    const session = await SessionService.getSessionStatus(sessionId);
    if (!session) {
        return {
            sessionId,
            status: 'unknown',
            worktreePath: '',
            startedAt: '',
            terminalPid: -1,
            terminalAlive: false,
            terminalApp: 'warp',
        };
    }
    // Check if terminal is still alive
    const terminalAlive = await isProcessAlive(session.terminalPid);
    return {
        sessionId: session.sessionId,
        status: session.status,
        worktreePath: session.worktreePath,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString(),
        terminalPid: session.terminalPid,
        terminalAlive,
        lastActivity: session.lastActivity?.toISOString(),
        terminalApp: session.terminalApp,
    };
}
// Tool metadata for MCP registration
export const getSessionStatusToolDefinition = {
    name: 'get_session_status',
    description: 'Check the status of a Claude Code session including whether the terminal is still alive and when it was last active.',
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: {
                type: 'string',
                description: 'The unique session identifier returned from launch_session',
            },
        },
        required: ['sessionId'],
    },
};
//# sourceMappingURL=get-session-status.js.map