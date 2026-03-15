import { EOL } from 'node:os';
import { deepMerge } from 'js-utils-kit';
import { colors as useColor } from 'use-colors';
import { LEVEL_COLORS, LOG_LEVEL_LABELS } from './constants';
import { formatLevel, LOG_LEVEL_KEYS } from './helpers';
import type { ZylogConfig } from './types';

export class Zylog {
  private config: ZylogConfig = {};

  constructor({
    colors,
    cwd = process.cwd(),
    end = EOL,
    hourFormat = '24h',
    labels,
    level = 'info',
    prefix = '',
    sep = ' ',
    timestamp = 'utc',
  }: ZylogConfig = {}) {
    this.config = {
      colors:
        typeof colors === 'number'
          ? (useColor.config({ level: colors }), LEVEL_COLORS)
          : deepMerge(LEVEL_COLORS, colors ?? {}),
      cwd,
      end,
      hourFormat,
      labels: deepMerge(LOG_LEVEL_LABELS, labels ?? {}),
      level,
      prefix,
      sep,
      timestamp,
    };
  }
}

export const zylog = new Zylog();
export default zylog;
