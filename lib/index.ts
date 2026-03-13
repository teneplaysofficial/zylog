import { EOL } from 'node:os';
import { deepMerge } from 'js-utils-kit';
import { LOG_LEVEL_LABELS } from './constants';
import type { ZylogConfig } from './types';

export class Zylog {
  private config: ZylogConfig = {};

  constructor({
    // colors,
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
      //   colors,
      cwd,
      end,
      hourFormat,
      labels: deepMerge(LOG_LEVEL_LABELS, labels!),
      level,
      prefix,
      sep,
      timestamp,
    };
  }
}

export const zylog = new Zylog();
export default zylog;
