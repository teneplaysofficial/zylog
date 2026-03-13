import colors from 'use-colors';
import type { ZylogLevel } from './types';

/**
 * Numeric priority for log filtering.
 */
export const LOG_LEVEL_PRIORITIES = {
  trace: 0,
  debug: 5,
  info: 10,
  success: 15,
  warn: 20,
  error: 25,
  fatal: 30,
} as const satisfies Record<string, number>;

/**
 * Human-readable display names for output.
 */
export const LOG_LEVEL_LABELS = {
  trace: 'TRACE',
  debug: 'DEBUG',
  info: 'INFO',
  success: 'SUCCESS',
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
} as const satisfies Record<ZylogLevel, string>;

/**
 * Functional color mapping for each {@link ZylogLevel} output.
 */
export const LEVEL_COLORIZERS = {
  trace: (txt) => colors.gray.dim(txt),
  debug: (txt) => colors.gray(txt),
  info: (txt) => colors.blue.bold(txt),
  success: (txt) => colors.green.bold(txt),
  warn: (txt) => colors.yellow.bold(txt),
  error: (txt) => colors.red.bold(txt),
  fatal: (txt) => colors.white.bgRed.bold(txt),
} as const satisfies Record<ZylogLevel, (txt: string) => string>;
