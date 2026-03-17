import type colors from 'use-colors';
import type { LOG_LEVEL_PRIORITIES } from './constants';

/**
 * Represents the valid severity levels for the Zylog.
 */
export type ZylogLevel = keyof typeof LOG_LEVEL_PRIORITIES;

/**
 * Levels that actually produce log output.
 */
export type ZylogOutputLevel = Exclude<ZylogLevel, 'silent'>;

export interface ZylogFormatOptions {
  /**
   * Separator used between log message parts.
   *
   * @default " "
   */
  sep?: string | undefined;
  /**
   * Line ending appended to each log entry.
   *
   * @default import("node:os").EOL
   */
  end?: string | undefined;
  /**
   * Timestamp formatting mode.
   *
   * - `utc` → ISO timestamp
   * - `locale` → system locale timestamp
   * - `false` →
   *
   * @default "utc"
   */
  timestamp?: 'utc' | 'locale' | false | undefined;
  /**
   * Hour format used in timestamps.
   *
   * - `"24h"` → `18:42:10`
   * - `"12h"` → `06:42:10 PM`
   *
   * @default "24h"
   */
  hourFormat?: '24h' | '12h' | undefined;
  /**
   * Optional prefix displayed before log messages.
   *
   * @example
   * ```sh
   * [server] Listening on port 3000
   * ```
   */
  prefix?: string | undefined;
  /**
   * Custom display labels for each log level.
   *
   * default → {@link LOG_LEVEL_LABELS}
   *
   * @example { warn: 'WRN', error: '!!!' }
   */
  labels?: Partial<Record<ZylogOutputLevel, string>> | undefined;
  /**
   * Custom styling for each log level.
   *
   * - `(c) => c.red` → Apply custom `use-colors` chain.
   * - `0` → Disable coloring for this specific level.
   *
   * default → {@link LEVEL_COLORIZERS}
   *
   * @example { trace: 0, fatal: (c) => c.red.bold.bgWhite }
   */
  colors?:
    | Partial<Record<ZylogOutputLevel, (c: typeof colors) => typeof colors | string>>
    | 0
    | undefined;
}

export interface ZylogConfig extends ZylogFormatOptions {
  /**
   * @default process.cwd()
   */
  cwd?: string | undefined;
  /**
   * Minimum log level that will be displayed.
   *
   * Logs below this level will be ignored.
   *
   * @default "info"
   */
  level?: ZylogLevel | undefined;

  /**
   * File logging configuration.
   *
   * Allows writing logs to files globally or per log level.
   *
   * @default { all: "logs/zylog.log", levels: {} }
   */
  streams?:
    | {
        /**
         * File that receives all logs
         *
         * @default "logs/zylog.log"
         */
        all?: string;

        /**
         * File paths for specific log levels.
         *
         * Each level writes to its own file.
         */
        levels?: ZylogFormatOptions['labels'];
      }
    | undefined;
}
