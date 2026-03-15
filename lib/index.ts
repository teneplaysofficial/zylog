import type { WriteStream } from 'node:fs';
import { createWriteStream, mkdirSync } from 'node:fs';
import { EOL } from 'node:os';
import { dirname, resolve } from 'node:path';
import { deepMerge } from 'js-utils-kit';
import colors, { colors as useColor } from 'use-colors';
import { LEVEL_COLORS, LOG_LEVEL_LABELS, LOG_LEVEL_PRIORITIES } from './constants';
import { formatLevel, formatTimestamp, getStreamByLevel } from './helpers';
import type { ZylogConfig, ZylogLevel } from './types';

export * from './types';

export class Zylog {
  private config: ZylogConfig = {};
  private isStreamEnabled = false;
  private fileStreams = new Map<string, WriteStream>();

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
    streams = {
      all: 'logs/zylog.log',
    },
  }: ZylogConfig = {}) {
    this.config = {
      colors:
        typeof colors === 'number'
          ? (useColor.config({ level: colors }), LEVEL_COLORS)
          : deepMerge(LEVEL_COLORS, colors),
      cwd,
      end,
      hourFormat,
      labels: deepMerge(LOG_LEVEL_LABELS, labels ?? {}),
      level,
      prefix,
      sep,
      timestamp,
      streams,
    };
  }

  private writeStream(level: ZylogLevel, output: string) {
    if (!this.isStreamEnabled) return;

    output = colors.strip(output);

    if (this.config.streams?.all) {
      this.fileStreams.get(this.config.streams.all)?.write(output);
    }

    const levelFile = this.config.streams?.levels?.[level];
    if (levelFile) {
      this.fileStreams.get(levelFile)?.write(output);
    }
  }

  createStream() {
    if (!this.config.streams) return;
    this.isStreamEnabled = true;

    const openStream = (file: string) => {
      if (this.fileStreams.has(file)) return;

      const path = resolve(this.config.cwd ?? '', file);

      mkdirSync(dirname(path), { recursive: true });

      this.fileStreams.set(file, createWriteStream(path, { flags: 'a', encoding: 'utf-8' }));
    };

    if (this.config.streams.all) {
      openStream(this.config.streams.all);
    }

    if (this.config.streams.levels) {
      for (const level in this.config.streams.levels) {
        const file = this.config.streams.levels[level as ZylogLevel];
        if (!file) continue;

        openStream(file);
      }
    }
  }

  closeStream() {
    for (const stream of this.fileStreams.values()) {
      stream.end();
    }
  }

  private writeLog(level: ZylogLevel, params: unknown[]) {
    if (LOG_LEVEL_PRIORITIES[level] < LOG_LEVEL_PRIORITIES[this.config.level!]) return;

    const ts = formatTimestamp(this.config);
    const levelLabel = formatLevel(level, this.config);

    const parts = [
      levelLabel,
      this.config.prefix && colors.gray.bold`[${this.config.prefix}]`,
      params.join(this.config.sep),
    ].filter(Boolean);

    const terminalLine =
      [this.config.timestamp ? ts : null, ...parts].filter(Boolean).join(' ') + this.config.end;

    getStreamByLevel(level).write(terminalLine);

    if (!this.isStreamEnabled) return;

    const fileLine = [ts, ...parts].join(' ') + this.config.end;

    this.writeStream(level, fileLine);
  }

  trace(...params: unknown[]) {
    this.writeLog('trace', params);
  }

  debug(...params: unknown[]) {
    this.writeLog('debug', params);
  }

  info(...params: unknown[]) {
    this.writeLog('info', params);
  }

  success(...params: unknown[]) {
    this.writeLog('success', params);
  }

  warn(...params: unknown[]) {
    this.writeLog('warn', params);
  }

  error(...params: unknown[]) {
    this.writeLog('error', params);
  }

  fatal(...params: unknown[]) {
    this.writeLog('fatal', params);
  }
}

export const zylog = new Zylog();
export default zylog;
