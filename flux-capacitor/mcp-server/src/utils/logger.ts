/**
 * Simple logger implementation for MCP server
 */

import type { Logger } from '../types/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class SimpleLogger implements Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    const argsStr = args.length > 0 ? ' ' + args.map(a => JSON.stringify(a)).join(' ') : '';
    return `[${timestamp}] ${levelStr} ${message}${argsStr}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      // IMPORTANT: Use console.error (stderr) not console.log (stdout)
      // MCP requires stdout to be exclusively for JSON-RPC messages
      console.error(this.formatMessage('debug', message, args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      // IMPORTANT: Use console.error (stderr) not console.log (stdout)
      // MCP requires stdout to be exclusively for JSON-RPC messages
      console.error(this.formatMessage('info', message, args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.error(this.formatMessage('warn', message, args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, args));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Singleton instance
let loggerInstance: Logger;

export function createLogger(level?: LogLevel): Logger {
  if (!loggerInstance) {
    const envLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || level || 'info';
    loggerInstance = new SimpleLogger(envLevel);
  }
  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}

export { Logger };
