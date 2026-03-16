import type { WriteStream } from 'node:fs';
import { createWriteStream, mkdirSync } from 'node:fs';
import { EOL } from 'node:os';
import { dirname, resolve } from 'node:path';
import { deepMerge } from 'js-utils-kit';
import { colors as useColor } from 'use-colors';
import { LEVEL_COLORS, LOG_LEVEL_LABELS, LOG_LEVEL_PRIORITIES } from './constants';
import { formatLevel, formatTimestamp, getStreamByLevel } from './helpers';
import type { ZylogConfig, ZylogFormatOptions, ZylogLevel, ZylogOutputLevel } from './types';

export * from './types';

/**
 * A lightweight, flexible logger for Node.js applications.
 *
 * `Zylog` provides structured logging with support for:
 * - multiple log levels
 * - ANSI color formatting
 * - timestamp formatting
 * - file stream logging
 * - temporary formatting overrides
 * - performance timers
 *
 * The logger is designed to be ergonomic and safe for both development and production environments.
 *
 * @remarks
 * By default, logs are written to the terminal. File streams can be enabled via {@link ZylogConfig.streams}.
 *
 * Streams are automatically closed when the Node.js process exits.
 *
 * @example
 * ```ts
 * import zylog from "zylog";
 *
 * zylog.info("Server started");
 * zylog.warn("Low memory");
 * zylog.error("Connection failed");
 * ```
 *
 * @example
 * ```ts
 * const log = new Zylog({ prefix: "API" });
 *
 * log.info("Listening on port 3000");
 * ```
 */
export class Zylog {
  private _config: ZylogConfig = {};
  private _isSilent = false;
  private _isStreamEnabled = false;
  private _tempFormatOptions: Partial<ZylogFormatOptions> | undefined = undefined;
  private _timers = new Map<string, number>();
  private _fileStreams = new Map<string, WriteStream>();

  /**
   * Creates a new {@link Zylog} logger instance.
   *
   * @remarks
   * The constructor accepts an optional configuration object used to customize logger behavior such as formatting, colors, log level, and file streams.
   *
   * If no configuration is provided, sensible defaults will be applied.
   *
   * The logger automatically registers process exit handlers to ensure file streams are safely closed when the Node.js process terminates.
   *
   * @example
   * ```ts
   * const log = new Zylog();
   *
   * log.info("Application started");
   * ```
   *
   * @example
   * ```ts
   * const log = new Zylog({
   *   prefix: "API",
   *   level: "debug"
   * });
   *
   * log.debug("Request received");
   * ```
   *
   * @example
   * ```ts
   * const log = new Zylog({
   *   streams: {
   *     all: "logs/app.log",
   *     levels: {
   *       error: "logs/error.log"
   *     }
   *   }
   * });
   *
   * log.createStream();
   * ```
   */
  constructor(
    /**
     * Optional logger configuration.
     */
    {
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
    }: ZylogConfig = {},
  ) {
    this._config = {
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

    process.once('exit', () => this.closeStream());
    process.once('SIGINT', () => this.closeStream());
    process.once('SIGTERM', () => this.closeStream());
  }

  private writeStream(level: ZylogOutputLevel, output: string) {
    if (!this._isStreamEnabled) return;

    output = useColor.strip(output);

    if (this._config.streams?.all) {
      this._fileStreams.get(this._config.streams.all)?.write(output);
    }

    const levelFile = this._config.streams?.levels?.[level];
    if (levelFile) {
      this._fileStreams.get(levelFile)?.write(output);
    }
  }

  /**
   * Enables file logging by creating the configured log streams.
   *
   * @remarks
   * This method initializes file write streams defined in {@link ZylogConfig.streams}.
   *
   * If directories in the file paths do not exist, they will be created automatically.
   *
   * @example
   * ```ts
   * zylog.createStream();
   * ```
   *
   * @example
   * ```ts
   * const log = new Zylog({
   *   streams: {
   *     all: "logs/app.log",
   *     levels: {
   *       error: "logs/error.log"
   *     }
   *   }
   * });
   *
   * log.createStream();
   * ```
   */
  createStream() {
    if (!this._config.streams) return;
    this._isStreamEnabled = true;

    const openStream = (file: string) => {
      if (this._fileStreams.has(file)) return;

      const path = resolve(this._config.cwd ?? '', file);

      mkdirSync(dirname(path), { recursive: true });

      this._fileStreams.set(file, createWriteStream(path, { flags: 'a', encoding: 'utf-8' }));
    };

    if (this._config.streams.all) {
      openStream(this._config.streams.all);
    }

    if (this._config.streams.levels) {
      for (const level in this._config.streams.levels) {
        const file = this._config.streams.levels[level as ZylogOutputLevel];
        if (!file) continue;

        openStream(file);
      }
    }
  }

  /**
   * Closes all active file streams.
   *
   * @remarks
   * This method safely ends all open file streams and clears the internal stream registry.
   *
   * Streams are automatically closed on process exit, but this method can be called manually if needed.
   *
   * @example
   * ```ts
   * zylog.closeStream();
   * ```
   */
  closeStream() {
    for (const stream of this._fileStreams.values()) {
      stream.end();
    }

    this._fileStreams.clear();
    this._isStreamEnabled = false;
  }

  private writeLog(level: ZylogOutputLevel, params: unknown[]) {
    try {
      if (!this.isLevelEnabled(level)) return;

      const formatConfig = this._tempFormatOptions
        ? deepMerge(this._config, this._tempFormatOptions)
        : this._config;

      const ts = formatTimestamp(formatConfig);
      const levelLabel = formatLevel(level, formatConfig);

      const parts = [
        levelLabel,
        formatConfig.prefix && useColor.gray.bold`[${formatConfig.prefix}]`,
        params.join(formatConfig.sep),
      ].filter(Boolean);

      const terminalLine =
        [formatConfig.timestamp ? ts : null, ...parts].filter(Boolean).join(' ') + formatConfig.end;

      getStreamByLevel(level).write(terminalLine);

      if (!this._isStreamEnabled) return;

      const fileLine = [ts, ...parts].join(' ') + formatConfig.end;

      this.writeStream(level, fileLine);
    } finally {
      this._tempFormatOptions = undefined;
    }
  }

  /**
   * Gets the current logger configuration.
   *
   * @remarks
   * The returned object is a shallow copy to prevent accidental mutation of the internal configuration state.
   *
   * @returns The current {@link ZylogConfig}.
   *
   * @example
   * ```ts
   * console.log(zylog.config);
   * ```
   */
  get config(): Readonly<ZylogConfig> {
    return { ...this._config };
  }

  /**
   * Updates the logger configuration.
   *
   * @remarks
   * The provided configuration is merged with the existing configuration using a {@link deepMerge}.
   *
   * Only the specified properties will be updated.
   *
   * @example
   * ```ts
   * zylog.config = { level: "debug" };
   * ```
   *
   * @example
   * ```ts
   * zylog.config = {
   *   prefix: "AUTH",
   *   sep: " | "
   * };
   * ```
   */
  set config(
    /**
     * Partial configuration values to update.
     */
    config: Partial<ZylogConfig>,
  ) {
    this._config = deepMerge(this._config, config);
  }

  /**
   * Gets the current minimum logging level.
   *
   * @returns The active {@link ZylogLevel}.
   *
   * @example
   * ```ts
   * console.log(zylog.level);
   * ```
   */
  get level() {
    return this._config.level!;
  }

  /**
   * Sets the minimum logging level.
   *
   * @remarks
   * Logs below this level will be ignored.
   *
   * @example
   * ```ts
   * zylog.level = "debug";
   * ```
   */
  set level(
    /** The desired log level. */
    level: ZylogLevel,
  ) {
    this._config.level = level;
  }

  /**
   * Enables or disables all logging.
   *
   * @remarks
   * When enabled, no logs will be emitted regardless of level.
   *
   * @example
   * ```ts
   * zylog.silent = true;
   * ```
   */
  get silent() {
    return this._isSilent;
  }

  /**
   * Enables or disables silent mode.
   */
  set silent(
    /**
     * Whether logging should be disabled.
     */
    value: boolean,
  ) {
    this._isSilent = value;
  }

  /**
   * Returns the currently active file streams.
   *
   * @returns A list of file paths associated with active streams.
   *
   * @example
   * ```ts
   * console.log(zylog.streams);
   * ```
   */
  get streams() {
    return [...this._fileStreams.keys()];
  }

  /**
   * Determines whether a given log level will be emitted.
   *
   * @remarks
   * Useful for avoiding expensive computations when logging at verbose levels.
   *
   * @returns `true` if the level is enabled.
   *
   * @example
   * ```ts
   * if (zylog.isLevelEnabled("debug")) {
   *   zylog.debug(expensiveCalculation());
   * }
   * ```
   */
  isLevelEnabled(
    /**
     * The log level to check.
     */
    level: ZylogOutputLevel,
  ) {
    return (
      !this._isSilent && LOG_LEVEL_PRIORITIES[level] >= LOG_LEVEL_PRIORITIES[this._config.level!]
    );
  }

  /**
   * Enables ANSI color output.
   *
   * @remarks
   * Internally uses the `use-colors` configuration system.
   *
   * The color level determines the color support mode:
   *
   * - `0` → disabled
   * - `1` → basic colors
   * - `2` → 256 colors
   * - `3` → true color (24-bit)
   *
   * @param level - The color support level.
   *
   * @example
   * ```ts
   * zylog.enableColors();
   * ```
   *
   * @example
   * ```ts
   * zylog.enableColors(2);
   * ```
   */
  enableColors(level: (typeof useColor.config)['level'] = 3) {
    useColor.config({ level });
  }

  /**
   * Disables ANSI color output.
   *
   * @remarks
   * This forces all log output to be written without color formatting.
   *
   * @example
   * ```ts
   * zylog.disableColors();
   * ```
   */
  disableColors() {
    useColor.config({ level: 0 });
  }

  /**
   * Starts a performance timer.
   *
   * @example
   * ```ts
   * zylog.time("db-query");
   * ```
   */
  time(
    /**
     * A unique timer label.
     */
    label: string,
  ) {
    this._timers.set(label, Date.now());
  }

  /**
   * Ends a timer and logs its duration.
   *
   * @remarks
   * If the timer does not exist, the call is ignored.
   *
   * @example
   * ```ts
   * zylog.time("db");
   * await query();
   * zylog.timeEnd("db");
   * ```
   */
  timeEnd(
    /**
     * The timer label.
     */
    label: string,
  ) {
    const start = this._timers.get(label);
    if (!start) return;

    const duration = Date.now() - start;
    this._timers.delete(label);

    this.info(`[timer:${label}] ${duration}ms`);
  }

  /**
   * Measures the execution time of a function.
   *
   * @remarks
   * Automatically starts and ends a timer around the function.
   *
   * @typeParam T - The return type of the measured function.
   *
   * @returns The result of the function.
   *
   * @example
   * ```ts
   * await zylog.measure("db", async () => {
   *   return await query();
   * });
   * ```
   *
   * @example
   * ```ts
   * const result = await zylog.measure("task", async () => doWork());
   * ```
   */
  async measure<T>(
    /**
     * Timer label.
     */
    label: string,
    /**
     * The function to measure.
     */
    fn: () => Promise<T> | T,
  ) {
    try {
      this.time(label);

      return await fn();
    } finally {
      this.timeEnd(label);
    }
  }

  /**
   * Temporarily overrides formatting options for the next log call.
   *
   * @remarks
   * The override applies only to the next logging invocation and is automatically reset afterward.
   *
   * @returns The logger instance for chaining.
   *
   * @example
   * ```ts
   * zylog.with({ prefix: "API" }).info("Request received");
   * ```
   *
   * @example
   * ```ts
   * zylog
   *   .with({ prefix: "AUTH", sep: " | " })
   *   .warn("Invalid token");
   * ```
   */
  with(
    /**
     * Formatting options.
     */
    opts: ZylogFormatOptions,
  ) {
    this._tempFormatOptions = opts;

    return this;
  }

  /**
   * Logs structured JSON data.
   *
   * @remarks
   * The provided object will be formatted using `JSON.stringify(data, null, 2)` for readability.
   *
   * @example
   * ```ts
   * zylog.json({ user: "alice", role: "admin" });
   * ```
   *
   * @example
   * ```ts
   * zylog.json({ query: "SELECT * FROM users" }, "debug");
   * ```
   */
  json(
    /**
     * The object to log.
     */
    data: object,
    /**
     * Optional log level.
     */
    level: ZylogOutputLevel = 'info',
  ) {
    this.writeLog(level, [JSON.stringify(data, null, 2)]);
  }

  /**
   * Logs a message at the TRACE level.
   *
   * @remarks
   * TRACE is the most verbose log level and is typically used for very detailed debugging information.
   *
   * @example
   * ```ts
   * zylog.trace("Entering function");
   * ```
   *
   * @example
   * ```ts
   * zylog.trace("User payload:", payload);
   * ```
   */
  trace(
    /**
     * Message components to log.
     */
    ...params: unknown[]
  ) {
    this.writeLog('trace', params);
  }

  /**
   * Logs a message at the DEBUG level.
   *
   * @remarks
   * DEBUG logs are intended for development and troubleshooting.
   *
   * They provide additional diagnostic information about the internal
   *
   * state of the application and are typically disabled in production environments.
   *
   * @example
   * ```ts
   * zylog.debug("Cache size:", cache.size);
   * ```
   *
   * @example
   * ```ts
   * zylog.debug("User payload:", payload);
   * ```
   *
   * @example
   * ```ts
   * if (zylog.isLevelEnabled("debug")) {
   *   zylog.debug("Expensive debug data:", compute());
   * }
   * ```
   */
  debug(
    /**
     * Message components to log.
     */
    ...params: unknown[]
  ) {
    this.writeLog('debug', params);
  }

  /**
   * Logs a message at the INFO level.
   *
   * @example
   * ```ts
   * zylog.info("Server started");
   * ```
   *
   * @example
   * ```ts
   * zylog.info("User", userId, "logged in");
   * ```
   */
  info(
    /**
     * Message components to log.
     */
    ...params: unknown[]
  ) {
    this.writeLog('info', params);
  }

  /**
   * Logs a message at the SUCCESS level.
   *
   * @remarks
   * This level is typically used to indicate successful completion of an operation.
   *
   * @example
   * ```ts
   * zylog.success("User created successfully");
   * ```
   *
   * @example
   * ```ts
   * zylog.success("Deployment completed");
   * ```
   */
  success(
    /**
     * Message components to log.
     */
    ...params: unknown[]
  ) {
    this.writeLog('success', params);
  }

  /**
   * Logs a message at the WARN level.
   *
   * @remarks
   * WARN logs indicate potential problems or unexpected
   * situations that do not stop execution.
   *
   * @example
   * ```ts
   * zylog.warn("Cache miss");
   * ```
   *
   * @example
   * ```ts
   * zylog.warn("Deprecated API used");
   * ```
   */
  warn(
    /**
     * Message components to log.
     */
    ...params: unknown[]
  ) {
    this.writeLog('warn', params);
  }

  /**
   * Logs a message at the ERROR level.
   *
   * @remarks
   * ERROR logs represent failures or exceptions that occurred during program execution.
   *
   * @example
   * ```ts
   * zylog.error("Database connection failed");
   * ```
   *
   * @example
   * ```ts
   * zylog.error("Unhandled error:", err);
   * ```
   */
  error(
    /**
     * Message components to log.
     */
    ...params: unknown[]
  ) {
    this.writeLog('error', params);
  }

  /**
   * Logs a message at the FATAL level.
   *
   * @remarks
   * FATAL logs indicate critical errors that may cause the application to terminate.
   *
   * @example
   * ```ts
   * zylog.fatal("System out of memory");
   * ```
   *
   * @example
   * ```ts
   * zylog.fatal("Unrecoverable error:", err);
   * ```
   */
  fatal(
    /**
     * Message components to log.
     */
    ...params: unknown[]
  ) {
    this.writeLog('fatal', params);
  }
}

/**
 * Default export of the global {@link Zylog} logger instance.
 *
 * @remarks
 * This export is equivalent to importing `{ zylog }` but follows the common pattern used by logging libraries for convenience.
 *
 * @example
 * ```ts
 * import zylog from "zylog";
 *
 * zylog.info("Application started");
 * ```
 */
export const zylog = new Zylog();
export default zylog;
