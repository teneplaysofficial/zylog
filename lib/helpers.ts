import { stderr, stdout } from 'node:process';
import type { Writable } from 'node:stream';
import { isObject } from 'js-utils-kit';
import { colors as useColors } from 'use-colors';
import { LOG_LEVEL_PRIORITIES } from './constants';
import type { ZylogConfig, ZylogLevel } from './types';

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

export function formatLevel(level: ZylogLevel, config: ZylogConfig) {
  const { colors, labels } = config;

  const label = labels?.[level];

  if (colors && isObject(colors)) {
    const style = colors[level];

    if (!style) return label;

    if (typeof style === 'function' && style.length === 1) {
      const fn = style(useColors);
      return typeof fn === 'function' ? fn(label) : label;
    }

    if (label && typeof style === 'function') {
      return (style as unknown as (txt: string) => string)(label);
    }
  }

  return label;
}
