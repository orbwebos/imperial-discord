import { join } from 'path';
import {
  Client,
  ClientOptions,
  SlashCommandBuilder,
  RESTPostAPIApplicationCommandsJSONBody,
  ContextMenuCommandBuilder,
  ChatInputApplicationCommandData,
  UserApplicationCommandData,
  MessageApplicationCommandData,
} from 'discord.js';
import {
  DefaultHandlersOptions,
  ImperialClientOptions,
} from './client_options';
import { ImperialLogger, Logger } from './logger';
import { ChatInputCommandBuilder, Command } from './command';
import type { Handler } from './handler';
import { isNullOrUndefined, isNullishOrEmpty } from './util';
import { ReadyHandler } from '../handlers/ready';
import { InteractionCreateHandler } from '../handlers/interaction_create';
import { MessageCreateHandler } from '../handlers/message_create';
import { getProcessPath, getVersion } from './root_path';
import { CommandRecord } from './command_record';
import { defaultRegisteringSelector } from './smart_register';
import { MessageCommandRunHandler } from '../handlers/message_command_run';
import { base } from './base';
import { HandlerRecord } from './handler_record';
import { RecordManager } from './record_manager';
import { PreconditionRecord } from './precondition_record';

/**
 * The extension of discord.js' Client class which is at the heart of Imperial Discord.
 */
export class ImperialClient<
  Ready extends boolean = boolean
> extends Client<Ready> {
  /** The client logger. */
  public readonly logger: Logger;

  /** The bot's name. */
  public name: string;

  /** The bot version. */
  public version: string;

  /** A list of all Discord user IDs that are to be recognized as owners. */
  public ownerIds: string[];

  /** The date at which the Client was instantiated. */
  public instantiatedAt: Date;

  /** The default category name to be given to commands without one, that aren't in a subdirectory. */
  public defaultCategoryName: string;

  /** The directory from which the other paths are relative by default. */
  public baseDirectory: string;

  /** The directory in which to search for commands. */
  public commandsDirectory: string;

  /** The directory in which to search for handlers. */
  public handlersDirectory: string;

  /** Whether the client should attempt to register commands at startup. */
  public shouldRegisterCommands: boolean;

  /** The Record manager. */
  public records: RecordManager;

  /** The commands record. */
  public commandRecord: CommandRecord;

  /** The handlers record. */
  public handlerRecord: HandlerRecord;

  /** The options for default Handlers that were passed to the constructor. */
  private defaultHandlersOptions: DefaultHandlersOptions;

  public constructor(options: ClientOptions) {
    super(options);

    this.instantiatedAt = new Date();

    base.client = this;

    if (options.logger === null || options.logger === undefined) {
      this.logger = new ImperialLogger({});
    } else if ('info' in options.logger) {
      this.logger = options.logger;
    } else {
      this.logger = new ImperialLogger(options.logger);
    }

    base.logger = this.logger;

    this.name = options.name;
    this.version = options.version ?? getVersion();
    this.ownerIds = options.ownerIds ?? [];
    this.defaultCategoryName = options.defaultCategoryName ?? 'general';

    this.shouldRegisterCommands = options.registerCommands ?? true;
    this.defaultHandlersOptions = options.defaultHandlers;

    this.records = new RecordManager();
    base.records = this.records;

    this.baseDirectory = options.baseDirectory ?? getProcessPath();

    this.records
      .add(
        new CommandRecord().addPath(
          options.commandsDirectory ?? join(this.baseDirectory, './commands')
        )
      )
      .add(
        new HandlerRecord()
          .addPath(
            options.commandsDirectory ?? join(this.baseDirectory, './handlers')
          )
          .addPath(join(__dirname, '..', 'handlers'))
      )
      .add(
        new PreconditionRecord().addPath(join(__dirname, '..', 'preconditions'))
      );
  }

  public isOwner(id: string): boolean {
    return this.ownerIds.includes(id);
  }

  /**
   * Registers the user's commands using the options that were passed to each.
   */
  public async smartRegisterCommands(options?: SmartRegisterOptions) {
    const record = options?.record ?? this.records.get('commands');

    const commands = await (options?.selectingFn
      ? options.selectingFn(record)
      : defaultRegisteringSelector(record));

    // exits early if the previous operation yielded no commands
    if (!commands.length) {
      return this.logger.info('Registered no changes in application commands.');
    }

    // filters the commands so that only those with data to register remain
    const registerableCommands = commands.filter((command) =>
      command.hasApplicationCommandsRegisteringData()
    );

    // filters the command array to include only those that that passed register
    // options for guilds
    const guildCommands = registerableCommands.filter(
      (command) => command.registerOptions?.guilds?.length
    );

    // filters the command array to include only those that explicitly request
    // global registration
    const globalCommands = registerableCommands.filter(
      (command) => command.registerOptions?.global === true
    );

    if (guildCommands) {
      // creates a list of all guild IDs and discards duplicate IDs
      const guildIds = [
        ...new Set(
          guildCommands.flatMap((command) => command.registerOptions.guilds)
        ),
      ];

      // for each guild ID, calls the register method on all the commands that
      // included the ID
      guildIds.forEach((guildId) =>
        guildCommands
          .filter((command) => command.registerOptions.guilds.includes(guildId))
          .forEach((cmd) => this.registerOrUpdateAllAvailableData(cmd, guildId))
      );
    }

    // registers commands globally if any were found
    if (globalCommands) {
      globalCommands.forEach((command) =>
        this.registerOrUpdateAllAvailableData(command)
      );
    }

    this.logger.info('Registered one or more application commands.');
  }

  public registerOrUpdateAllAvailableData(command: Command, guildId?: string) {
    const options: CommandRegisterOptions = {
      guildId,
      global: !Boolean(guildId),
      command: null,
    };

    if (command?.applicationCommandsData?.chatInput) {
      options['command'] = command.applicationCommandsData.chatInput;

      this.registerOrUpdateApplicationCommand(options);
    }

    if (command?.applicationCommandsData?.userContextMenu) {
      options['command'] = command.applicationCommandsData.userContextMenu;

      this.registerOrUpdateApplicationCommand(options);
    }

    if (command?.applicationCommandsData?.messageContextMenu) {
      options['command'] = command.applicationCommandsData.messageContextMenu;

      this.registerOrUpdateApplicationCommand(options);
    }
  }

  public async registerOrUpdateApplicationCommand(
    options: CommandRegisterOptions
  ) {
    if (isNullishOrEmpty(options.guildId) && !options.global) {
      throw new Error(
        'a guild must be specified for registering commands or the global option should be true'
      );
    }

    if (!options.command) {
      throw new Error('no command provided to register');
    }

    if (!this.token && !options.token) {
      throw new Error(
        'no token passed to register commands in client not logged in'
      );
    }
    if (!this.user.id && !options.clientId) {
      throw new Error(
        'no client ID passed to register commands in client not logged in'
      );
    }

    const manager = this.application.commands;
    const command = commandDataToRegisterable(options.command);

    if (options.global) {
      const globalCommandsData = await manager.fetch({
        withLocalizations: true,
      });

      const applicationCommand = globalCommandsData.find(
        (value) => value.name === command.name && value.type === command.type
      );

      if (applicationCommand) {
        return manager.edit(applicationCommand, command);
      } else {
        return manager.create(command);
      }
    }

    const guildCommandsData = await manager.fetch({
      guildId: options.guildId,
      withLocalizations: true,
    });

    const applicationCommand = guildCommandsData.find(
      (value) => value.name === command.name && value.type === command.type
    );

    const guildCommandsManager = (await this.guilds.fetch(options.guildId))
      .commands;

    if (applicationCommand) {
      return guildCommandsManager.edit(applicationCommand, command);
    } else {
      return guildCommandsManager.create(command);
    }
  }

  public async login(token?: string): Promise<string> {
    await Promise.all(
      this.records.valuesToArray().map((record) => record.syncAll())
    );

    const login = await super.login(token);

    this.name = this.name ?? this.user.username;

    return login;
  }
}

interface SmartRegisterOptions {
  record?: CommandRecord;
  selectingFn?: (record: CommandRecord) => Promise<Command[]>;
}

function commandDataToRegisterable(
  data:
    | ChatInputCommandBuilder
    | ChatInputApplicationCommandData
    | ContextMenuCommandBuilder
    | UserApplicationCommandData
    | MessageApplicationCommandData
):
  | RESTPostAPIApplicationCommandsJSONBody
  | ChatInputApplicationCommandData
  | UserApplicationCommandData
  | MessageApplicationCommandData {
  if (
    data instanceof SlashCommandBuilder ||
    data instanceof ContextMenuCommandBuilder
  ) {
    return data.toJSON();
  } else {
    return data as
      | RESTPostAPIApplicationCommandsJSONBody
      | ChatInputApplicationCommandData
      | UserApplicationCommandData
      | MessageApplicationCommandData;
  } // TODO: should I do this?
}

interface CommandRegisterOptions {
  command:
    | ChatInputCommandBuilder
    | ChatInputApplicationCommandData
    | ContextMenuCommandBuilder
    | UserApplicationCommandData
    | ContextMenuCommandBuilder
    | MessageApplicationCommandData;
  guildId?: string;
  global?: boolean;
  token?: string;
  clientId?: string;
}

declare module 'discord.js' {
  interface Client {
    readonly logger: Logger;
    name: string;
    version: string;
    ownerIds: string[];
    instantiatedAt: Date;
    defaultCategoryName: string;
    baseDirectory: string;
    commandsDirectory: string;
    handlersDirectory: string;
    shouldRegisterCommands: boolean;
    records: RecordManager;
    commandRecord: CommandRecord;
    handlerRecord: HandlerRecord;

    smartRegisterCommands(options?: SmartRegisterOptions): Promise<void>;
  }

  interface ClientOptions extends ImperialClientOptions {}
}
