import { stderr, stdout } from 'node:process';
import type { Writable } from 'node:stream';
import { isObject } from 'js-utils-kit';
import colors from 'use-colors';
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

/**
 * Returns the formatted (optionally colorized) label for the given log level based on the logger configuration.
 */
export function formatLevel(level: ZylogLevel, config: ZylogConfig) {
  const label = config.labels?.[level];

  if (config.colors && isObject(config.colors)) {
    const style = config.colors[level];

    if (!style) return label;

    if (typeof style === 'function' && style.length === 1) {
      const fn = style(colors);
      return typeof fn === 'function' ? fn(label) : label;
    }

    if (label && typeof style === 'function') {
      return (style as unknown as (txt: string) => string)(label);
    }
  }

  return label;
}

export function formatTimestamp(config: ZylogConfig) {
  const d = new Date();
  let ts = '';

  switch (config.timestamp || 'utc') {
    case 'utc': {
      const iso = d.toISOString().replace('T', ' ').slice(0, 19);

      if (config.hourFormat !== '12h') {
        ts = iso;
        break;
      }

      const h = d.getUTCHours();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hh = (h % 12 || 12).toString().padStart(2, '0');

      ts = `${iso.replace(/ \d{2}:/, ` ${hh}:`)} ${ampm}`;
      break;
    }

    case 'locale':
      ts = d
        .toLocaleString('en-SE', {
          hour12: config.hourFormat === '12h',
        })
        .replace(',', '')
        .toUpperCase();
      break;
  }

  return colors.gray(ts);
}
