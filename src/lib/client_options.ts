import type { Command } from './command';
import type { CommandStore } from './command_store';
import type { Logger, LoggerOptions } from './logger';

export interface DefaultHandlersOptions {
  interactionCreate?: boolean;
  messageCreate?: boolean;
  messageCommandRun?: boolean;
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
  ownerIds?: string[];
  registerCommands?: false;
  smartRegisterSelector?: (store: CommandStore) => Promise<Command[]>;
  defaultCategoryName?: string;
  defaultHandlers?: DefaultHandlersOptions;
}
