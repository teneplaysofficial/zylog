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
 * Color mapping for each {@link ZylogLevel} output.
 */
export const LEVEL_COLORS = {
  trace: colors.gray,
  debug: colors.cyan,
  info: colors.blue,
  success: colors.green,
  warn: colors.yellow,
  error: colors.red,
  fatal: colors.bgRed.white.bold,
} as const satisfies Record<ZylogLevel, (txt: string) => string>;
