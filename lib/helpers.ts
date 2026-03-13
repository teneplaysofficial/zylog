import { stderr, stdout } from 'node:process';
import type { Writable } from 'node:stream';
import { LOG_LEVEL_PRIORITIES } from './constants';
import type { ZylogLevel } from './types';

/**
 * Array of available log level keys for iteration or validation.
 */
export const LOG_LEVEL_KEYS = Object.keys(LOG_LEVEL_PRIORITIES) as ZylogLevel[];

/**
 * Returns the appropriate system stream for a given log level.
 */
export function getStreamByLevel(level: ZylogLevel): Writable {
  switch (level) {
    case 'warn':
    case 'error':
    case 'fatal':
      return stderr;
    default:
      return stdout;
  }
}
