import type { Logger, LoggerOptions } from './logger';

export interface DefaultHandlersOptions {
  interactionCreate?: boolean;
  messageCreate?: boolean;
  ready?: boolean;
}

export interface ImperialClientOptions {
  logger?: Logger | LoggerOptions;
  baseDirectory?: string;
  commandsDirectory?: string;
  handlersDirectory?: string;
  token?: string;
  name?: string;
  version?: string;
  defaultHandlers?: DefaultHandlersOptions;
}
