/**
 * Terminal service for creating and managing terminal instances
 * Supports configurable terminal applications with fallback chain
 */
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { TerminalError } from '../types/index.js';
import { getLogger } from '../utils/logger.js';
const logger = getLogger();
// Default terminal configurations
// Warp is now the default terminal with reliable command execution via script-based approach
const DEFAULT_TERMINAL_CONFIG = {
    app: 'warp', // Use Warp by default
    detectOrder: ['warp', 'iterm2', 'terminal'], // Fallback order
};
export class TerminalService {
    config;
    constructor(config) {
        this.config = {
            ...DEFAULT_TERMINAL_CONFIG,
            ...config,
        };
    }
    /**
     * Detect which terminal applications are available on the system
     */
    async detectAvailableTerminals() {
        logger.debug('Detecting available terminal applications');
        const available = [];
        // Check for Warp
        logger.debug('Checking for Warp');
        if (await this.isWarpInstalled()) {
            logger.debug('Warp is installed');
            available.push('warp');
        }
        // Check for iTerm2
        logger.debug('Checking for iTerm2');
        if (await this.isITerm2Installed()) {
            logger.debug('iTerm2 is installed');
            available.push('iterm2');
        }
        // Terminal.app is always available on macOS
        if (process.platform === 'darwin') {
            logger.debug('Terminal.app is available (macOS)');
            available.push('terminal');
        }
        logger.debug('Detected terminal applications', { available });
        return available;
    }
    /**
     * Get the best available terminal based on config and availability
     */
    async getBestTerminal() {
        logger.debug('Determining best terminal to use', { configuredApp: this.config.app });
        // If custom command is configured, use it
        if (this.config.app === 'custom' && this.config.customCommand) {
            logger.debug('Using custom terminal command');
            return 'custom';
        }
        // If specific app is configured and available, use it
        if (this.config.app !== 'custom') {
            logger.debug(`Checking if configured app ${this.config.app} is available`);
            const available = await this.detectAvailableTerminals();
            if (available.includes(this.config.app)) {
                logger.debug(`Using configured terminal: ${this.config.app}`);
                return this.config.app;
            }
            logger.debug(`Configured app ${this.config.app} not available, falling back to detection order`);
        }
        // Fall back to detection order
        const detectOrder = this.config.detectOrder || ['warp', 'iterm2', 'terminal'];
        logger.debug('Falling back to detection order', { detectOrder });
        const available = await this.detectAvailableTerminals();
        for (const app of detectOrder) {
            if (available.includes(app)) {
                logger.info(`Using terminal: ${app}`);
                return app;
            }
        }
        logger.error('No terminal application found');
        throw new TerminalError('No terminal application found', 'NO_TERMINAL_AVAILABLE');
    }
    /**
     * Create a new terminal window/tab
     */
    async createTerminal(params) {
        logger.debug('Creating terminal with params', {
            cwd: params.cwd,
            title: params.title,
            hasCommand: !!params.command,
        });
        const terminalApp = await this.getBestTerminal();
        logger.debug(`Selected terminal app: ${terminalApp}`);
        try {
            let result;
            switch (terminalApp) {
                case 'warp':
                    logger.debug('Creating Warp terminal');
                    result = await this.createWarpTerminal(params);
                    break;
                case 'iterm2':
                    logger.debug('Creating iTerm2 terminal');
                    result = await this.createITerm2Terminal(params);
                    break;
                case 'terminal':
                    logger.debug('Creating macOS Terminal');
                    result = await this.createMacTerminal(params);
                    break;
                case 'custom':
                    logger.debug('Creating custom terminal');
                    result = await this.createCustomTerminal(params);
                    break;
                default:
                    throw new TerminalError(`Unsupported terminal: ${terminalApp}`, 'INVALID_CONFIGURATION');
            }
            logger.info('Terminal created successfully', {
                app: result.app,
                pid: result.pid,
            });
            return result;
        }
        catch (error) {
            logger.error('Failed to create terminal', error);
            throw new TerminalError(`Failed to create terminal: ${error.message}`, 'TERMINAL_NOT_FOUND', error);
        }
    }
    /**
     * Execute a command in an existing terminal (if possible)
     */
    async executeInTerminal(instance, command) {
        // This is a placeholder - actual implementation depends on terminal app
        // For now, we'll just log it
        logger.info('Execute command in terminal', {
            app: instance.app,
            pid: instance.pid,
            command,
        });
        // Most terminals don't have a good API for executing commands after creation
        // The command should be passed during creation instead
    }
    // =========================================================================
    // Warp Terminal Implementation
    // =========================================================================
    async isWarpInstalled() {
        try {
            // Check if Warp.app exists in Applications
            // Don't require warp-cli since it's often not in PATH
            const warpPath = '/Applications/Warp.app';
            logger.debug(`Checking for Warp at: ${warpPath}`);
            await fs.access(warpPath);
            logger.debug('Warp is installed');
            return true;
        }
        catch {
            logger.debug('Warp not found');
            return false;
        }
    }
    async createWarpTerminal(params) {
        const { cwd, command } = params;
        // Warp supports command execution via temporary launch scripts
        // Using warp://action/new_tab?path=<script-path> to execute commands
        // See: https://docs.warp.dev/terminal/more-features/uri-scheme
        if (command && cwd) {
            // Create temporary launch script for command execution
            try {
                logger.debug('Creating temporary launch script for Warp');
                // Create .claude directory if it doesn't exist
                const claudeDir = path.join(cwd, '.claude');
                await fs.mkdir(claudeDir, { recursive: true });
                // Generate unique script name
                const timestamp = Date.now();
                const random = crypto.randomBytes(4).toString('hex');
                const scriptPath = path.join(claudeDir, `warp-launch-${timestamp}-${random}.sh`);
                // Create script content
                // The script will: cd to worktree, execute command, then self-delete
                const scriptContent = `#!/bin/bash
cd "${cwd}"
${command}
rm "$0"
`;
                logger.debug(`Writing launch script: ${scriptPath}`);
                await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });
                // Use Warp URI scheme with script path
                // The & at the end runs it in background (non-blocking)
                const uri = `warp://action/new_tab?path=${encodeURIComponent(scriptPath)}&`;
                logger.debug(`Opening Warp with script URI: ${uri}`);
                await execa('open', [uri]);
                logger.info('Warp terminal created with command execution via script');
                return {
                    pid: -1,
                    app: 'warp',
                    success: true,
                };
            }
            catch (error) {
                logger.error('Failed to create Warp launch script', error);
                logger.warn('Falling back to basic Warp tab without command execution');
                // Fall back to basic tab opening
                const uri = cwd
                    ? `warp://action/new_tab?path=${encodeURIComponent(cwd)}`
                    : 'warp://action/new_tab';
                await execa('open', [uri]);
                return {
                    pid: -1,
                    app: 'warp',
                    success: true,
                };
            }
        }
        else {
            // No command or no cwd - just open a tab
            const uri = cwd
                ? `warp://action/new_tab?path=${encodeURIComponent(cwd)}`
                : 'warp://action/new_tab';
            logger.debug(`Opening Warp with URI: ${uri}`);
            await execa('open', [uri]);
            return {
                pid: -1,
                app: 'warp',
                success: true,
            };
        }
    }
    // =========================================================================
    // iTerm2 Implementation
    // =========================================================================
    async isITerm2Installed() {
        try {
            const iterm2Path = '/Applications/iTerm.app';
            logger.debug(`Checking for iTerm2 at: ${iterm2Path}`);
            await fs.access(iterm2Path);
            logger.debug('iTerm2 found');
            return true;
        }
        catch {
            logger.debug('iTerm2 not found');
            return false;
        }
    }
    async createITerm2Terminal(params) {
        const { cwd, title, command } = params;
        const commands = [];
        if (cwd) {
            commands.push(`cd "${cwd}"`);
        }
        if (command) {
            commands.push(command);
        }
        const commandString = commands.join(' && ');
        // IMPORTANT: Escape quotes for AppleScript
        const escapedCommand = commandString.replace(/"/g, '\\"');
        const escapedTitle = title ? title.replace(/"/g, '\\"') : '';
        // Use specified profile or default
        const profile = this.config.iterm2Profile || 'default profile';
        const escapedProfile = profile.replace(/"/g, '\\"');
        logger.debug(`Using iTerm2 profile: ${profile}`);
        const script = `
      tell application "iTerm2"
        create window with ${profile === 'default profile' ? 'default profile' : `profile "${escapedProfile}"`}
        tell current session of current window
          ${commandString ? `write text "${escapedCommand}"` : ''}
          ${title ? `set name to "${escapedTitle}"` : ''}
        end tell
      end tell
    `;
        logger.debug('Executing iTerm2 AppleScript');
        logger.debug('AppleScript command:', script);
        await execa('osascript', ['-e', script]);
        logger.debug('iTerm2 terminal created (no PID available)');
        return {
            pid: -1, // iTerm2 via AppleScript doesn't return PID easily
            app: 'iterm2',
            success: true,
        };
    }
    // =========================================================================
    // Terminal.app Implementation
    // =========================================================================
    async createMacTerminal(params) {
        const { cwd, title, command } = params;
        const commands = [];
        if (cwd) {
            commands.push(`cd "${cwd}"`);
        }
        if (command) {
            commands.push(command);
        }
        const commandString = commands.join(' && ') || 'clear';
        // IMPORTANT: Escape quotes for AppleScript
        // AppleScript uses double quotes, so we need to escape any quotes in the command
        const escapedCommand = commandString.replace(/"/g, '\\"');
        // Terminal.app profile support (settings name)
        const profile = this.config.terminalProfile;
        let profileScript = '';
        if (profile) {
            const escapedProfile = profile.replace(/"/g, '\\"');
            logger.debug(`Using Terminal.app settings: ${profile}`);
            profileScript = `set current settings of front window to settings set "${escapedProfile}"`;
        }
        const script = `
      tell application "Terminal"
        do script "${escapedCommand}"
        ${profileScript}
        ${title ? `set custom title of front window to "${title.replace(/"/g, '\\"')}"` : ''}
        activate
      end tell
    `;
        logger.debug('Executing Terminal.app AppleScript');
        logger.debug('AppleScript command:', script);
        await execa('osascript', ['-e', script]);
        logger.debug('Terminal.app terminal created (no PID available)');
        return {
            pid: -1, // Terminal.app via AppleScript doesn't return PID easily
            app: 'terminal',
            success: true,
        };
    }
    // =========================================================================
    // Custom Command Implementation
    // =========================================================================
    async createCustomTerminal(params) {
        if (!this.config.customCommand) {
            throw new TerminalError('Custom terminal command not configured', 'INVALID_CONFIGURATION');
        }
        // Replace template placeholders
        const command = this.replaceTemplatePlaceholders(this.config.customCommand, params);
        logger.debug('Executing custom terminal command', { command });
        // Execute the custom command
        const result = await execa('sh', ['-c', command]);
        const pid = result.pid ? parseInt(String(result.pid), 10) : -1;
        logger.debug(`Custom terminal created with pid: ${pid}`);
        return {
            pid,
            app: 'custom',
            success: true,
        };
    }
    /**
     * Replace template placeholders in custom command
     * Supports: {{cwd}}, {{title}}, {{command}}, {{shell}}
     */
    replaceTemplatePlaceholders(template, params) {
        let result = template;
        result = result.replace(/\{\{cwd\}\}/g, params.cwd || process.cwd());
        result = result.replace(/\{\{title\}\}/g, params.title || '');
        result = result.replace(/\{\{command\}\}/g, params.command || '');
        result = result.replace(/\{\{shell\}\}/g, params.shell || process.env.SHELL || '/bin/bash');
        return result;
    }
}
/**
 * Create a TerminalService instance with optional configuration
 */
export function createTerminalService(config) {
    return new TerminalService(config);
}
/**
 * Load terminal configuration from environment variables
 */
export function loadTerminalConfigFromEnv() {
    const config = {};
    // TERMINAL_APP: warp, iterm2, terminal, custom
    const terminalApp = process.env.TERMINAL_APP?.toLowerCase();
    if (terminalApp === 'warp' || terminalApp === 'iterm2' || terminalApp === 'terminal' || terminalApp === 'custom') {
        config.app = terminalApp;
    }
    // TERMINAL_CUSTOM_COMMAND: Custom command template
    if (process.env.TERMINAL_CUSTOM_COMMAND) {
        config.customCommand = process.env.TERMINAL_CUSTOM_COMMAND;
    }
    // TERMINAL_DETECT_ORDER: Comma-separated list of terminals
    if (process.env.TERMINAL_DETECT_ORDER) {
        const order = process.env.TERMINAL_DETECT_ORDER.split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => s === 'warp' || s === 'iterm2' || s === 'terminal');
        if (order.length > 0) {
            config.detectOrder = order;
        }
    }
    // ITERM2_PROFILE: iTerm2 profile name
    if (process.env.ITERM2_PROFILE) {
        config.iterm2Profile = process.env.ITERM2_PROFILE;
    }
    // TERMINAL_PROFILE: Terminal.app settings name
    if (process.env.TERMINAL_PROFILE) {
        config.terminalProfile = process.env.TERMINAL_PROFILE;
    }
    return config;
}
//# sourceMappingURL=terminal.service.js.map