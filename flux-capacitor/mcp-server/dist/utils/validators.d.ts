/**
 * Validation utilities using Zod
 */
import { z } from 'zod';
export declare const CreateWorktreeSchema: z.ZodObject<{
    repository: z.ZodString;
    branch: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    baseBranch: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    repository: string;
    branch: string;
    name?: string | undefined;
    baseBranch?: string | undefined;
}, {
    repository: string;
    branch: string;
    name?: string | undefined;
    baseBranch?: string | undefined;
}>;
export declare const LaunchSessionSchema: z.ZodObject<{
    worktreePath: z.ZodString;
    prompt: z.ZodString;
    contextFiles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    agentName: z.ZodOptional<z.ZodString>;
    terminalApp: z.ZodOptional<z.ZodEnum<["warp", "iterm2", "terminal", "custom"]>>;
}, "strip", z.ZodTypeAny, {
    worktreePath: string;
    prompt: string;
    contextFiles?: string[] | undefined;
    agentName?: string | undefined;
    terminalApp?: "warp" | "iterm2" | "terminal" | "custom" | undefined;
}, {
    worktreePath: string;
    prompt: string;
    contextFiles?: string[] | undefined;
    agentName?: string | undefined;
    terminalApp?: "warp" | "iterm2" | "terminal" | "custom" | undefined;
}>;
export declare const ListWorktreesSchema: z.ZodObject<{
    repository: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    repository?: string | undefined;
}, {
    repository?: string | undefined;
}>;
export declare const CleanupWorktreeSchema: z.ZodObject<{
    worktreePath: z.ZodString;
    force: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    removeBranch: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    worktreePath: string;
    force: boolean;
    removeBranch: boolean;
}, {
    worktreePath: string;
    force?: boolean | undefined;
    removeBranch?: boolean | undefined;
}>;
export declare const GetSessionStatusSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare const CreateTerminalSchema: z.ZodObject<{
    shell: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    command: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    shell?: string | undefined;
    cwd?: string | undefined;
    title?: string | undefined;
    command?: string | undefined;
}, {
    shell?: string | undefined;
    cwd?: string | undefined;
    title?: string | undefined;
    command?: string | undefined;
}>;
/**
 * Check if a path exists and is a directory
 */
export declare function validateDirectory(dirPath: string): Promise<boolean>;
/**
 * Check if a path exists and is a file
 */
export declare function validateFile(filePath: string): Promise<boolean>;
/**
 * Check if a path is a valid git repository
 */
export declare function validateGitRepository(repoPath: string): Promise<boolean>;
/**
 * Normalize and resolve a file path
 */
export declare function normalizePath(filePath: string): string;
/**
 * Check if a path is absolute
 */
export declare function isAbsolutePath(filePath: string): boolean;
/**
 * Validate branch name format
 */
export declare function validateBranchName(branch: string): boolean;
/**
 * Sanitize a string for use in file/directory names
 */
export declare function sanitizeFilename(name: string): string;
/**
 * Generate a worktree directory name from repository and branch
 */
export declare function generateWorktreeName(repoPath: string, branch: string): string;
/**
 * Check if a process is running
 */
export declare function isProcessAlive(pid: number): Promise<boolean>;
/**
 * Parse key=value environment variables
 */
export declare function parseEnvVars(envString: string): Record<string, string>;
//# sourceMappingURL=validators.d.ts.map