/**
 * Terminal service for creating and managing terminal instances
 * Supports configurable terminal applications with fallback chain
 */
import type { TerminalApp, TerminalConfig, CreateTerminalParams, CreateTerminalResult, TerminalInstance } from '../types/index.js';
export declare class TerminalService {
    private config;
    constructor(config?: Partial<TerminalConfig>);
    /**
     * Detect which terminal applications are available on the system
     */
    detectAvailableTerminals(): Promise<TerminalApp[]>;
    /**
     * Get the best available terminal based on config and availability
     */
    getBestTerminal(): Promise<TerminalApp>;
    /**
     * Create a new terminal window/tab
     */
    createTerminal(params: CreateTerminalParams): Promise<CreateTerminalResult>;
    /**
     * Execute a command in an existing terminal (if possible)
     */
    executeInTerminal(instance: TerminalInstance, command: string): Promise<void>;
    private isWarpInstalled;
    private createWarpTerminal;
    private isITerm2Installed;
    private createITerm2Terminal;
    private createMacTerminal;
    private createCustomTerminal;
    /**
     * Replace template placeholders in custom command
     * Supports: {{cwd}}, {{title}}, {{command}}, {{shell}}
     */
    private replaceTemplatePlaceholders;
}
/**
 * Create a TerminalService instance with optional configuration
 */
export declare function createTerminalService(config?: Partial<TerminalConfig>): TerminalService;
/**
 * Load terminal configuration from environment variables
 */
export declare function loadTerminalConfigFromEnv(): Partial<TerminalConfig>;
//# sourceMappingURL=terminal.service.d.ts.map