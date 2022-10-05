import type { Command } from './command';
import type { CommandRecord } from './command_record';
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
  name?: string;
  version?: string;
  ownerIds?: string[];
  registerCommands?: false;
  smartRegisterSelector?: (record: CommandRecord) => Promise<Command[]>;
  defaultCategoryName?: string;
  defaultHandlers?: DefaultHandlersOptions;
}
