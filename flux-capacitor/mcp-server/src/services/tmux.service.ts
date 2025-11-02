/**
 * Tmux service for managing tmux panes via tmux-cli
 * Provides high-level interface to tmux-cli command-line tool
 */

import { execa } from 'execa';
import type { TmuxPane, TmuxSendOptions } from '../types/index.js';
import { TmuxError } from '../types/index.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export class TmuxService {
  /**
   * Check if tmux-cli is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execa('tmux-cli', ['--help']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Launch a new tmux pane with a command
   * Returns the pane ID (e.g., "remote-cli-session:0.2")
   */
  async launch(command: string): Promise<string> {
    logger.debug(`Launching tmux pane with command: ${command}`);

    try {
      const result = await execa('tmux-cli', ['launch', command]);
      const paneId = result.stdout.trim();

      if (!paneId) {
        throw new TmuxError(
          'Failed to get pane ID from tmux-cli launch',
          'LAUNCH_FAILED'
        );
      }

      logger.info(`Tmux pane launched: ${paneId}`);
      return paneId;
    } catch (error) {
      logger.error('Failed to launch tmux pane', error);
      throw new TmuxError(
        `Failed to launch tmux pane: ${(error as Error).message}`,
        'LAUNCH_FAILED',
        error
      );
    }
  }

  /**
   * Send text to a tmux pane
   */
  async send(
    paneId: string,
    text: string,
    options?: TmuxSendOptions
  ): Promise<void> {
    logger.debug(`Sending to pane ${paneId}: ${text.substring(0, 50)}...`);

    const args = ['send', text, `--pane=${paneId}`];

    if (options?.enter === false) {
      args.push('--enter=False');
    }

    if (options?.delayEnter === false) {
      args.push('--delay-enter=False');
    } else if (typeof options?.delayEnter === 'number') {
      args.push(`--delay-enter=${options.delayEnter}`);
    }

    try {
      await execa('tmux-cli', args);
      logger.debug(`Sent to pane ${paneId}`);
    } catch (error) {
      logger.error(`Failed to send to pane ${paneId}`, error);
      throw new TmuxError(
        `Failed to send to pane ${paneId}: ${(error as Error).message}`,
        'SEND_FAILED',
        error
      );
    }
  }

  /**
   * Capture output from a tmux pane
   */
  async capture(paneId: string): Promise<string> {
    logger.debug(`Capturing output from pane ${paneId}`);

    try {
      const result = await execa('tmux-cli', ['capture', `--pane=${paneId}`]);
      logger.debug(`Captured ${result.stdout.length} bytes from pane ${paneId}`);
      return result.stdout;
    } catch (error) {
      logger.error(`Failed to capture from pane ${paneId}`, error);
      throw new TmuxError(
        `Failed to capture from pane ${paneId}: ${(error as Error).message}`,
        'CAPTURE_FAILED',
        error
      );
    }
  }

  /**
   * List all tmux panes
   */
  async listPanes(): Promise<TmuxPane[]> {
    logger.debug('Listing all tmux panes');

    try {
      const result = await execa('tmux-cli', ['list_panes']);
      const panes = JSON.parse(result.stdout) as TmuxPane[];
      logger.debug(`Found ${panes.length} tmux panes`);
      return panes;
    } catch (error) {
      logger.error('Failed to list tmux panes', error);
      throw new TmuxError(
        `Failed to list tmux panes: ${(error as Error).message}`,
        'LIST_FAILED',
        error
      );
    }
  }

  /**
   * Check if a tmux pane exists
   */
  async paneExists(paneId: string): Promise<boolean> {
    logger.debug(`Checking if pane ${paneId} exists`);

    try {
      const panes = await this.listPanes();
      const exists = panes.some(p => p.id === paneId);
      logger.debug(`Pane ${paneId} exists: ${exists}`);
      return exists;
    } catch (error) {
      logger.error(`Failed to check if pane ${paneId} exists`, error);
      return false;
    }
  }

  /**
   * Wait for a pane to become idle (no output changes)
   */
  async waitIdle(
    paneId: string,
    options?: {
      idleTime?: number;
      timeout?: number;
    }
  ): Promise<void> {
    logger.debug(`Waiting for pane ${paneId} to become idle`, options);

    const args = ['wait_idle', `--pane=${paneId}`];

    if (options?.idleTime) {
      args.push(`--idle-time=${options.idleTime}`);
    }

    if (options?.timeout) {
      args.push(`--timeout=${options.timeout}`);
    }

    try {
      await execa('tmux-cli', args);
      logger.debug(`Pane ${paneId} is now idle`);
    } catch (error) {
      logger.error(`Failed to wait for pane ${paneId} to become idle`, error);
      throw new TmuxError(
        `Failed to wait for pane ${paneId} to become idle: ${(error as Error).message}`,
        'WAIT_FAILED',
        error
      );
    }
  }

  /**
   * Kill a tmux pane
   */
  async kill(paneId: string): Promise<void> {
    logger.debug(`Killing pane ${paneId}`);

    try {
      await execa('tmux-cli', ['kill', `--pane=${paneId}`]);
      logger.info(`Killed pane ${paneId}`);
    } catch (error) {
      logger.error(`Failed to kill pane ${paneId}`, error);
      throw new TmuxError(
        `Failed to kill pane ${paneId}: ${(error as Error).message}`,
        'KILL_FAILED',
        error
      );
    }
  }

  /**
   * Send interrupt (Ctrl+C) to a pane
   */
  async interrupt(paneId: string): Promise<void> {
    logger.debug(`Sending interrupt to pane ${paneId}`);

    try {
      await execa('tmux-cli', ['interrupt', `--pane=${paneId}`]);
      logger.debug(`Sent interrupt to pane ${paneId}`);
    } catch (error) {
      logger.error(`Failed to send interrupt to pane ${paneId}`, error);
      throw new TmuxError(
        `Failed to send interrupt to pane ${paneId}: ${(error as Error).message}`,
        'INTERRUPT_FAILED',
        error
      );
    }
  }

  /**
   * Send escape key to a pane
   */
  async escape(paneId: string): Promise<void> {
    logger.debug(`Sending escape to pane ${paneId}`);

    try {
      await execa('tmux-cli', ['escape', `--pane=${paneId}`]);
      logger.debug(`Sent escape to pane ${paneId}`);
    } catch (error) {
      logger.error(`Failed to send escape to pane ${paneId}`, error);
      throw new TmuxError(
        `Failed to send escape to pane ${paneId}: ${(error as Error).message}`,
        'ESCAPE_FAILED',
        error
      );
    }
  }

  /**
   * Get status information about tmux
   */
  async getStatus(): Promise<string> {
    logger.debug('Getting tmux status');

    try {
      const result = await execa('tmux-cli', ['status']);
      return result.stdout;
    } catch (error) {
      logger.error('Failed to get tmux status', error);
      throw new TmuxError(
        `Failed to get tmux status: ${(error as Error).message}`,
        'STATUS_FAILED',
        error
      );
    }
  }

  /**
   * Attach to the remote tmux session (for viewing)
   * Only works in remote mode (outside tmux)
   */
  async attach(): Promise<void> {
    logger.debug('Attaching to tmux session');

    try {
      await execa('tmux-cli', ['attach'], {
        stdio: 'inherit', // Allow interactive attachment
      });
    } catch (error) {
      logger.error('Failed to attach to tmux session', error);
      throw new TmuxError(
        `Failed to attach to tmux session: ${(error as Error).message}`,
        'ATTACH_FAILED',
        error
      );
    }
  }

  /**
   * Cleanup the entire tmux session
   * WARNING: This kills all panes in the managed session
   */
  async cleanup(): Promise<void> {
    logger.debug('Cleaning up tmux session');

    try {
      await execa('tmux-cli', ['cleanup']);
      logger.info('Tmux session cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup tmux session', error);
      throw new TmuxError(
        `Failed to cleanup tmux session: ${(error as Error).message}`,
        'CLEANUP_FAILED',
        error
      );
    }
  }
}

/**
 * Create a TmuxService instance
 */
export function createTmuxService(): TmuxService {
  return new TmuxService();
}

/**
 * Get a singleton TmuxService instance
 */
let tmuxServiceInstance: TmuxService | null = null;

export function getTmuxService(): TmuxService {
  if (!tmuxServiceInstance) {
    tmuxServiceInstance = new TmuxService();
  }
  return tmuxServiceInstance;
}
