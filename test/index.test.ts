import { createWriteStream, mkdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Zylog, ZylogConfig, zylog } from '../lib/index';

vi.mock('node:fs', () => ({
  createWriteStream: vi.fn(() => ({
    write: vi.fn(),
    end: vi.fn(),
  })),
  mkdirSync: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
  vi.spyOn(process, 'once').mockImplementation(() => process);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('default export', () => {
  it('should be an instance of Zylog', () => {
    expect(zylog).toBeInstanceOf(Zylog);
  });
});

describe('constructor', () => {
  it('should initialize with default configuration', () => {
    const logger = new Zylog();
    expect(logger.config.level).toBe('info');
    expect(logger.config.cwd).toBe('/mock/cwd');
    expect(logger.config.prefix).toBe('');
    expect(logger.config.sep).toBe(' ');
    expect(logger.config.timestamp).toBe('utc');
    expect(logger.config.streams?.all).toBe('logs/zylog.log');
  });

  it('should register process exit handlers', () => {
    new Zylog();
    expect(process.once).toHaveBeenCalledWith('exit', expect.any(Function));
    expect(process.once).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.once).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });

  it('should apply color config if number is provided', () => {
    const logger = new Zylog({ colors: 0 });
    expect(logger.config.colors).toBeDefined();
  });
});

describe('configuration properties', () => {
  it('should get and set config', () => {
    const logger = new Zylog();
    logger.config = { level: 'debug', prefix: 'TEST' };
    expect(logger.config.level).toBe('debug');
    expect(logger.config.prefix).toBe('TEST');
  });

  it('should get and set level', () => {
    const logger = new Zylog();
    logger.level = 'error';
    expect(logger.level).toBe('error');
  });

  it('should get and set silent', () => {
    const logger = new Zylog();
    expect(logger.silent).toBe(false);
    logger.silent = true;
    expect(logger.silent).toBe(true);
  });

  it('should get streams (initially empty)', () => {
    const logger = new Zylog();
    expect(logger.streams).toEqual([]);
  });
});

describe('log levels', () => {
  it('should emit logs only if level is enabled', () => {
    const logger = new Zylog({ level: 'info' });
    const spy = vi.spyOn(process.stdout, 'write');

    logger.debug('debug message');
    expect(spy).not.toHaveBeenCalled();

    logger.info('info message');
    expect(spy).toHaveBeenCalled();
  });

  it('should emit logs for all levels correctly', () => {
    const logger = new Zylog({ level: 'trace' });
    const stdoutSpy = vi.spyOn(process.stdout, 'write');
    const stderrSpy = vi.spyOn(process.stderr, 'write');

    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.success('success');
    expect(stdoutSpy).toHaveBeenCalledTimes(4);

    logger.warn('warn');
    logger.error('error');
    logger.fatal('fatal');
    expect(stderrSpy).toHaveBeenCalledTimes(3);
  });
});

describe('isLevelEnabled', () => {
  it('should return true for enabled levels', () => {
    const logger = new Zylog({ level: 'warn' });
    expect(logger.isLevelEnabled('warn')).toBe(true);
    expect(logger.isLevelEnabled('error')).toBe(true);
    expect(logger.isLevelEnabled('info')).toBe(false);
  });

  it('should return false if silent is true', () => {
    const logger = new Zylog();
    logger.silent = true;
    expect(logger.isLevelEnabled('error')).toBe(false);
  });
});

describe('colors', () => {
  it('enableColors and disableColors', () => {
    const logger = new Zylog();
    logger.enableColors(1);
    logger.disableColors();
  });
});

describe('timers', () => {
  it('should measure execution time', async () => {
    const logger = new Zylog();
    const spy = vi.spyOn(logger, 'info');
    const result = await logger.measure('test-timer', () => 'done');
    expect(result).toBe('done');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[timer:test-timer]'));
  });

  it('time and timeEnd should work', () => {
    const logger = new Zylog();
    const spy = vi.spyOn(logger, 'info');
    logger.time('manual');
    logger.timeEnd('manual');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[timer:manual]'));
  });

  it('timeEnd should ignore non-existent labels', () => {
    const logger = new Zylog();
    const spy = vi.spyOn(logger, 'info');
    logger.timeEnd('invalid');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('with (temporary overrides)', () => {
  it('should apply temporary overrides for only one call', () => {
    const logger = new Zylog({ prefix: 'ORIGINAL' });
    const spy = vi.spyOn(process.stdout, 'write');

    logger.with({ prefix: 'OVERRIDE' }).info('message');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[OVERRIDE]'));

    spy.mockClear();
    logger.info('next');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[ORIGINAL]'));
  });
});

describe('json', () => {
  it('should log objects as formatted JSON', () => {
    const logger = new Zylog();
    const spy = vi.spyOn(process.stdout, 'write');
    logger.json({ foo: 'bar' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('{\n  "foo": "bar"\n}'));
  });
});

describe('stream management', () => {
  it('createStream should do nothing if no streams config', () => {
    const logger = new Zylog({ streams: { all: '' } });
    logger.createStream();
    expect(logger.streams).toEqual([]);
  });

  it('createStream should initialize write streams', () => {
    const logger = new Zylog({
      streams: {
        all: 'all.log',
        levels: { error: 'error.log' },
      },
    });
    logger.createStream();

    expect(mkdirSync).toHaveBeenCalled();
    expect(createWriteStream).toHaveBeenCalledTimes(2);
    expect(logger.streams).toContain('all.log');
    expect(logger.streams).toContain('error.log');
  });

  it('createStream should skip if level file is undefined', () => {
    const logger = new Zylog({
      streams: {
        levels: { error: '' },
      },
    });
    logger.createStream();
    expect(createWriteStream).not.toHaveBeenCalled();
  });

  it('closeStream should end all streams', () => {
    const logger = new Zylog({ streams: { all: 'all.log' } });
    logger.createStream();
    const streamMock = vi.mocked(createWriteStream).mock.results[0]?.value;

    logger.closeStream();
    expect(streamMock.end).toHaveBeenCalled();
    expect(logger.streams).toEqual([]);
  });

  it('writeStream should write to files when enabled', () => {
    const logger = new Zylog({
      streams: {
        all: 'all.log',
        levels: { info: 'info.log' },
      },
    });
    logger.createStream();
    const allStream = vi.mocked(createWriteStream).mock.results[0]?.value;
    const infoStream = vi.mocked(createWriteStream).mock.results[1]?.value;

    logger.info('to file');
    expect(allStream.write).toHaveBeenCalledWith(expect.stringContaining('to file'));
    expect(infoStream.write).toHaveBeenCalledWith(expect.stringContaining('to file'));
  });

  it('writeStream should do nothing if streams disabled', () => {
    const logger = new Zylog({ streams: { all: 'all.log' } });
    logger.info('not to file');
    expect(createWriteStream).not.toHaveBeenCalled();
  });

  it('createStream should not re-open existing streams', () => {
    const logger = new Zylog({ streams: { all: 'all.log' } });
    logger.createStream();
    const firstCallCount = vi.mocked(createWriteStream).mock.calls.length;
    logger.createStream();
    expect(vi.mocked(createWriteStream).mock.calls.length).toBe(firstCallCount);
  });

  it('should not write if stream disabled (force path)', () => {
    const logger = new Zylog({
      streams: { all: 'all.log' },
    });

    const spy = vi.spyOn(process.stdout, 'write');

    logger.info('no stream');

    expect(spy).toHaveBeenCalled();
    expect(createWriteStream).not.toHaveBeenCalled();
  });

  it('should write only to "all" stream when no level match', () => {
    const logger = new Zylog({
      streams: { all: 'all.log' },
    });

    logger.createStream();

    const stream = vi.mocked(createWriteStream).mock.results[0]?.value;

    logger.info('only all');

    expect(stream.write).toHaveBeenCalled();
  });

  it('should write only to level stream (no all)', () => {
    const logger = new Zylog({
      streams: { levels: { error: 'err.log' } },
    });

    logger.createStream();

    const stream = vi.mocked(createWriteStream).mock.results[0]?.value;

    logger.error('only level');

    expect(stream.write).toHaveBeenCalled();
  });

  it('should fallback to default streams when streams is undefined', () => {
    const logger = new Zylog({ streams: undefined });

    logger.createStream();

    expect(createWriteStream).toHaveBeenCalled();
  });

  it('should handle undefined cwd in stream path', () => {
    const logger = new Zylog({
      cwd: undefined,
      streams: { all: 'test.log' },
    });

    logger.createStream();

    expect(createWriteStream).toHaveBeenCalled();
  });

  it('should strip ANSI colors before writing to file', () => {
    const logger = new Zylog({
      streams: { all: 'all.log' },
    });

    logger.createStream();

    const stream = vi.mocked(createWriteStream).mock.results[0]?.value;

    logger.enableColors();
    logger.info('\x1b[31mred text\x1b[0m');

    const written = stream.write.mock.calls[0][0];

    expect(written).not.toMatch(/\\x1b/);
  });
});

describe('writeLog', () => {
  it('should handle timestamp=false', () => {
    const logger = new Zylog({ timestamp: false });
    const spy = vi.spyOn(process.stdout, 'write');
    logger.info('no ts');
    expect(spy).toHaveBeenCalledWith(expect.not.stringContaining('202'));
  });

  it('should handle empty prefix', () => {
    const logger = new Zylog({ prefix: '' });
    const spy = vi.spyOn(process.stdout, 'write');

    logger.info('no prefix');

    const output = spy.mock.calls?.[0]?.[0];

    expect(output).not.toContain('[ORIGINAL]');
    expect(output).not.toMatch(/\[.*\]/);
  });
});

describe('timestamp formats', () => {
  it('should format local time (24h)', () => {
    const logger = new Zylog({ timestamp: 'locale', hourFormat: '24h' });
    const spy = vi.spyOn(process.stdout, 'write');

    logger.info('local time');

    expect(spy).toHaveBeenCalled();
  });

  it('should format local time (12h with AM/PM)', () => {
    const logger = new Zylog({ timestamp: 'locale', hourFormat: '12h' });
    const spy = vi.spyOn(process.stdout, 'write');

    logger.info('12h time');

    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/AM|PM/));
  });

  it('should fallback safely if timestamp invalid', () => {
    // @ts-expect-error
    const logger = new Zylog({ timestamp: 'invalid' });
    const spy = vi.spyOn(process.stdout, 'write');

    logger.info('fallback');

    expect(spy).toHaveBeenCalled();
  });
});
