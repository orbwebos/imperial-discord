export const enum LogLevel {
  Trace = 10,
  Debug = 20,
  Info = 30,
  Warn = 40,
  Error = 50,
  Fatal = 60,
}

export type LogLevelString =
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'fatal';

export function logLevelToString(logLevel: LogLevel | LogLevelString) {
  if (typeof logLevel === 'string') return logLevel.toLowerCase();

  switch (logLevel) {
    case 10:
      return 'trace';
    case 20:
      return 'debug';
    case 30:
      return 'info';
    case 40:
      return 'warn';
    case 50:
      return 'error';
    case 60:
      return 'fatal';
  }
}

export function logLevelToNumber(logLevel: LogLevelString | LogLevel) {
  if (typeof logLevel === 'number') {
    return logLevel;
  }

  switch (logLevel) {
    case 'trace':
      return LogLevel.Trace;
    case 'debug':
      return LogLevel.Debug;
    case 'info':
      return LogLevel.Info;
    case 'warn':
      return LogLevel.Warn;
    case 'error':
      return LogLevel.Error;
    case 'fatal':
      return LogLevel.Fatal;
  }
}

export interface LoggerOptions {
  level?: LogLevel | LogLevelString;
  name?: string;
}

export interface Logger {
  level: LogLevel;

  fatal(...values: readonly unknown[]): void;

  error(...values: readonly unknown[]): void;

  warn(...values: readonly unknown[]): void;

  info(...values: readonly unknown[]): void;

  debug(...values: readonly unknown[]): void;

  trace(...values: readonly unknown[]): void;
}

// TODO: finish this class
export class ImperialLogger implements Logger {
  public readonly level: LogLevel;

  public constructor(options: LoggerOptions) {
    const defaultLevel =
      process.env.NODE_ENV === 'production' ? LogLevel.Info : LogLevel.Debug;

    this.level = options.level ? logLevelToNumber(options.level) : defaultLevel;
  }

  public fatal(...values: readonly unknown[]): void {
    this.write(LogLevel.Fatal, ...values);
  }

  public error(...values: readonly unknown[]): void {
    this.write(LogLevel.Error, ...values);
  }

  public warn(...values: readonly unknown[]): void {
    this.write(LogLevel.Warn, ...values);
  }

  public info(...values: readonly unknown[]): void {
    this.write(LogLevel.Info, ...values);
  }

  public debug(...values: readonly unknown[]): void {
    this.write(LogLevel.Debug, ...values);
  }

  public trace(...values: readonly unknown[]): void {
    this.write(LogLevel.Trace, ...values);
  }

  public logFor(level: LogLevel | LogLevelString): boolean {
    const lv = typeof level === 'string' ? logLevelToNumber(level) : level;

    return lv >= this.level;
  }

  public static getDateString(): string {
    const date = new Date();

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().split('.')[0].replace('T', ' ');
  }

  private write(level: LogLevel, ...values: readonly unknown[]): void {
    if (this.logFor(level)) {
      const logFn =
        level == LogLevel.Fatal || level == LogLevel.Error
          ? console.error
          : console.log;

      logFn(
        `[${ImperialLogger.getDateString()} ${logLevelToString(
          level
        ).toUpperCase()}]`,
        ...values
      );
    }
  }
}
