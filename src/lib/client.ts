import { readdirSync, PathLike } from 'fs';
import { join, dirname, resolve, basename } from 'path';
import {
  Client,
  ClientOptions,
  SlashCommandBuilder,
  RESTPostAPIApplicationCommandsJSONBody,
  REST,
  Routes,
  ContextMenuCommandBuilder,
  ChatInputApplicationCommandData,
  UserApplicationCommandData,
  MessageApplicationCommandData,
  ApplicationCommand,
} from 'discord.js';
import {
  DefaultHandlersOptions,
  ImperialClientOptions,
} from './client_options';
import { ImperialLogger, Logger } from './logger';
import { ChatInputCommandBuilder, Command } from './command';
import type { Handler } from './handler';
import {
  readdirDepthTwoAbsoluteSync,
  isNullOrUndefined,
  isNullishOrEmpty,
} from './util';
import { ReadyHandler } from './default_handlers/ready';
import { InteractionCreateHandler } from './default_handlers/interaction_create';
import { MessageCreateHandler } from './default_handlers/message_create';
import { getProcessPath, getVersion } from './root_path';
import { CommandStore } from './command_store';
import { defaultRegisteringSelector } from './smart_register';
import { MessageCommandRunHandler } from './default_handlers/message_command_run';
import { base } from './base';

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

  /** The commands store. */
  public commandStore: CommandStore;

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

    this.baseDirectory = options.baseDirectory ?? getProcessPath();
    this.commandsDirectory =
      options.commandsDirectory ?? join(this.baseDirectory, './commands');
    this.handlersDirectory =
      options.handlersDirectory ?? join(this.baseDirectory, './handlers');

    this.commandStore = new CommandStore();
  }

  /**
   * Adds a command to the store.
   * @param command The command to add.
   */
  public addCommandToStore(command: Command): void {
    this.commandStore.set(command.name, command);
  }

  /**
   * Processes a path, and returns a Command if it contains one.
   * @param path The path to be processed.
   * @returns An Imperial Discord Command.
   */
  public processCommandPath(path: string): Command {
    // Dynamically import the file, and find the object
    // that the user marked as a command
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const raw = require(path);
    // TODO: search by class signature (like object methods), rather than by
    // name signifier (like ending in "command"), so that the user can name
    // their command classes anything
    const commandName = Object.keys(raw).find((s) =>
      s.toLowerCase().endsWith('command')
    );

    // Throw an error if the passed path wasn't a command
    if (!commandName) {
      throw new Error('non-command file processed');
    }

    // Instantiates the command
    const CmdConst = raw[commandName] as typeof Command;
    const command = new CmdConst();

    // Derives the command's category if none was given
    if (!command.category) {
      const dirpath = dirname(path);

      if (dirpath === resolve(this.commandsDirectory)) {
        command.category = this.defaultCategoryName;
      } else {
        command.category = basename(dirpath.toLowerCase());
      }
    }

    // Derives the command's environment context if none is set
    if (!command.environment) {
      command.environment = { path };
    }

    return command;
  }

  public getCommandsInPath(path: PathLike): Command[] {
    const commandFiles = readdirDepthTwoAbsoluteSync(path as string) // fix typing
      .filter((filePath) => filePath.endsWith('.js'));

    return commandFiles.map((filePath) => this.processCommandPath(filePath));
  }

  public async setupCommands(path: PathLike) {
    this.getCommandsInPath(path).forEach((command) =>
      this.addCommandToStore(command)
    );

    this.logger.info('Command store loaded.');
  }

  public async setupDefaultHandlers(options: DefaultHandlersOptions) {
    const shouldRegister = (o: boolean) => isNullOrUndefined(o) || o === true;
    const handlers = [
      ReadyHandler,
      MessageCommandRunHandler,
      InteractionCreateHandler,
      MessageCreateHandler,
    ];

    for (const HandlerConstructor of handlers) {
      const handler = this.instantiateHandler(HandlerConstructor);

      if (isNullOrUndefined(options) || shouldRegister(options[handler.name])) {
        if (handler.once) {
          this.once(handler.name, (...args) => {
            handler
              .execute(...args, this)
              .catch((error) => this.logger.error(error));
          });
        } else {
          this.on(handler.name, (...args) => {
            handler
              .execute(...args, this)
              .catch((error) => this.logger.error(error));
          });
        }
      }
    }
  }

  /**
   * Instantiates a Handler constructor.
   * @param HandlerConstructor The Handler constructor to be instantiated.
   * @param name The raw object name, to be used if the user didn't give a name.
   * @returns An instance of Handler.
   */
  public instantiateHandler(
    HandlerConstructor: new () => Handler,
    name?: string
  ): Handler {
    const handlerInstance = new HandlerConstructor();

    // Derives the name if none was given
    if (handlerInstance.name === '') {
      // Throws if no possible name was found
      if (isNullishOrEmpty(name)) {
        throw new Error('handler must have a name to be instantiated');
      }

      const withoutHandler = name.replace(/([A-Z])[a-z]*$/, '');
      const nameResult =
        withoutHandler.charAt(0).toLowerCase() + withoutHandler.substring(1);
      handlerInstance.name = nameResult;
    }

    return handlerInstance;
  }

  public async setupHandlers(path: PathLike) {
    const handlerFiles = readdirSync(path).filter((file) =>
      file.endsWith('.js')
    );

    handlerFiles.forEach((file: string) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const raw = require(`${path}/${file}`);
      const handler = this.instantiateHandler(
        Object.values(raw)[0] as typeof Handler,
        Object.keys(raw)[0]
      );

      if (handler.once) {
        this.once(handler.name, (...args) => {
          handler
            .execute(...args, this)
            .catch((error) => this.logger.error(error));
        });
      } else {
        this.on(handler.name, (...args) => {
          handler
            .execute(...args, this)
            .catch((error) => this.logger.error(error));
        });
      }
    });

    this.logger.info('Event handlers loaded.');
  }

  public isOwner(id: string): boolean {
    return this.ownerIds.includes(id);
  }

  /**
   * Registers the user's commands using the options that were passed to each.
   */
  public async smartRegisterCommands(options?: SmartRegisterOptions) {
    const store = options?.store ?? this.commandStore;

    const commands = await (options?.selectingFn
      ? options.selectingFn(store)
      : defaultRegisteringSelector(store));

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
    await this.setupCommands(this.commandsDirectory);
    await this.setupDefaultHandlers(this.defaultHandlersOptions);
    await this.setupHandlers(this.handlersDirectory);

    const login = await super.login(token);

    this.name = this.name ?? this.user.username;

    return login;
  }
}

interface SmartRegisterOptions {
  store?: CommandStore;
  selectingFn?: (store: CommandStore) => Promise<Command[]>;
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
    commandStore: CommandStore;

    smartRegisterCommands(options?: SmartRegisterOptions): Promise<void>;
  }

  interface ClientOptions extends ImperialClientOptions {}
}
