import Pino, { LogFn as PinoLogFn } from 'pino';
import type { Logger as PinoLogger } from 'pino';

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
  if (typeof logLevel === 'number') return logLevel;

  switch (logLevel) {
    case 'trace':
      return 10;
    case 'debug':
      return 20;
    case 'info':
      return 30;
    case 'warn':
      return 40;
    case 'error':
      return 50;
    case 'fatal':
      return 60;
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

export class ImperialLogger implements Logger {
  public readonly internal: PinoLogger;
  public readonly level: LogLevel;

  public constructor(options: LoggerOptions) {
    this.level = this.level ? logLevelToNumber(options.level) : LogLevel.Info;

    this.internal = Pino({
      name: options.name ? options.name : 'Imperial',
      level: logLevelToString(this.level),
    });
  }

  public fatal(...values: readonly unknown[]): void {
    this.write(this.internal.fatal, ...values);
  }

  public error(...values: readonly unknown[]): void {
    this.write(this.internal.error, ...values);
  }

  public warn(...values: readonly unknown[]): void {
    this.write(this.internal.warn, ...values);
  }

  public info(...values: readonly unknown[]): void {
    this.write(this.internal.info, ...values);
  }

  public debug(...values: readonly unknown[]): void {
    this.write(this.internal.debug, ...values);
  }

  public trace(...values: readonly unknown[]): void {
    this.write(this.internal.trace, ...values);
  }

  private write(fn: PinoLogFn, ...values: readonly unknown[]): void {
    const obj = values.length > 0 ? (values[0] as object) : null;
    const msg = values.length > 1 ? (values[1] as string) : null;
    const rest = values.length > 2 ? values.slice(values.length - 2) : null;

    if (msg === null) {
      fn.bind(this.internal)(obj);
    } else if (rest === null) {
      fn.bind(this.internal)(obj, msg);
    } else {
      fn.bind(this.internal)(obj, msg, ...rest);
    }
  }
}
