import { readdirSync, PathLike } from 'fs';
import { join } from 'path';
import {
  Client,
  ClientOptions,
  Collection,
  SlashCommandBuilder,
  RESTPostAPIApplicationCommandsJSONBody,
  REST,
  Routes,
} from 'discord.js';
import { EmojiStore } from './emoji_store';
import {
  DefaultHandlersOptions,
  ImperialClientOptions,
} from './client_options';
import { ImperialLogger, Logger } from './logger';
import { Command } from './command';
import type { Handler } from './handler';
import { depthTwoAbsoluteSync, isNothing, isNullOrUndefined } from './util';
import { ReadyHandler } from './default_handlers/ready';
import { InteractionCreateHandler } from './default_handlers/interaction_create';
import { MessageCreateHandler } from './default_handlers/message_create';
import { getProcessPath, getVersion } from './root_path';

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

  /** The directory from which the other paths are relative by default. */
  public baseDirectory: string;

  /** The directory in which to search for commands. */
  public commandsDirectory: string;

  /** The directory in which to search for handlers. */
  public handlersDirectory: string;

  /** The commands store. */
  public commandStore: Collection<string, Command>;

  /** The Emoji store. */
  public emojiStore: EmojiStore;

  public constructor(options: ClientOptions) {
    super(options);

    if (options.logger === null || options.logger === undefined) {
      this.logger = new ImperialLogger({});
    } else if ('info' in options.logger) {
      this.logger = options.logger;
    } else {
      this.logger = new ImperialLogger(options.logger);
    }

    this.name = options.name;
    this.version = options.version ?? getVersion();

    this.baseDirectory = options.baseDirectory ?? getProcessPath();
    this.commandsDirectory =
      options.commandsDirectory ?? join(this.baseDirectory, './commands');
    this.handlersDirectory =
      options.handlersDirectory ?? join(this.baseDirectory, './handlers');

    this.commandStore = new Collection();
    this.emojiStore = new EmojiStore();
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

    // Derives a name for the command if none was given
    if (!command.name) {
      const dashesLower = commandName.replace(/([A-Z])/g, '-$1').toLowerCase();
      const nameResult = dashesLower.substring(1, dashesLower.lastIndexOf('-'));
      command.name = nameResult;
    }

    // Finally, populates the command's Base class
    command.populateBase(this);

    return command;
  }

  public getCommandsInPath(path: PathLike): Command[] {
    const commandFiles = depthTwoAbsoluteSync(path as string) // fix typing
      .filter((filePath) => filePath.endsWith('.js'));

    return commandFiles.map((filePath) => this.processCommandPath(filePath));
  }

  public async setupCommands(path: PathLike) {
    this.getCommandsInPath(path).forEach((command) =>
      this.addCommandToStore(command)
    );
  }

  public async setupDefaultHandlers(options: DefaultHandlersOptions) {
    const shouldRegister = (o: boolean) => isNullOrUndefined(o) || o === true;
    const handlers = [
      ReadyHandler,
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

    // Populates the handler's Base class
    handlerInstance.populateBase(this);

    // Derives the name if none was given
    if (handlerInstance.name === '') {
      // Throws if no possible name was found
      if (isNothing(name)) {
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
    const eventFiles = readdirSync(path).filter((file) => file.endsWith('.js'));

    eventFiles.forEach((file: string) => {
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
  }

  public async registerCommands(options: CommandRegisterOptions) {
    if (isNothing(options.guildId) && !options.global) {
      throw new Error(
        'a guild must be specified for registering commands or the global option should be true'
      );
    }

    if (!options.commands.length) {
      throw new Error('no commands provided to register');
    }

    if (!this.isReady()) {
      if (isNothing(options.token)) {
        throw new Error(
          'no token passed to register commands in client not logged in'
        );
      }
      if (isNothing(options.clientId)) {
        throw new Error(
          'no client ID passed to register commands in client not logged in'
        );
      }
    }

    const rest = new REST({ version: '10' }).setToken(
      options.token ?? this.token
    );
    const commands = options.commands.map(
      (
        command:
          | Command
          | SlashCommandBuilder
          | RESTPostAPIApplicationCommandsJSONBody
      ) => {
        if (command instanceof Command) {
          return command.chatInputData;
        } else if (command instanceof SlashCommandBuilder) {
          return command.toJSON();
        }
      }
    );

    if (!options.global) {
      return rest.put(
        Routes.applicationGuildCommands(
          options.clientId ?? this.user.id,
          options.guildId
        ),
        { body: commands }
      );
    }

    return rest.put(
      Routes.applicationCommands(options.clientId ?? this.user.id),
      { body: commands }
    );
  }

  public async login(token?: string): Promise<string> {
    const returned = await super.login(token);
    this.name = this.name ?? this.user.username;

    return returned;
  }
}

interface CommandRegisterOptions {
  commands:
    | Command[]
    | SlashCommandBuilder[]
    | RESTPostAPIApplicationCommandsJSONBody[];
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
    baseDirectory: string;
    commandsDirectory: string;
    handlersDirectory: string;
    emojiStore: EmojiStore;
    commandStore: Collection<string, Command>;
  }

  interface ClientOptions extends ImperialClientOptions {}
}
