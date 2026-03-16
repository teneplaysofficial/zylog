import type { ZylogConfig, ZylogLevel, ZylogOutputLevel } from './types';

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
  silent: Infinity,
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
} as const satisfies Record<ZylogOutputLevel, string>;

/**
 * Color mapping for each {@link ZylogLevel} output.
 */
export const LEVEL_COLORS: Required<Exclude<ZylogConfig['colors'], 0>> = {
  trace: (c) => c.gray,
  debug: (c) => c.cyan,
  info: (c) => c.blue,
  success: (c) => c.green,
  warn: (c) => c.yellow,
  error: (c) => c.red,
  fatal: (c) => c.bgRed.white.bold,
};
