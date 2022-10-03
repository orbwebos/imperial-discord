import {
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  Message,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  UserApplicationCommandData,
  MessageApplicationCommandData,
  ApplicationCommandType,
} from 'discord.js';
import { ApplicationCommandDataManager } from './application_command';
import { Component } from './component';
import { Precondition, PreconditionResult } from './preconditions';
import { MaybePromise } from './util';

export interface EnvironmentContext {
  path: string;
}

export interface RegisterOptions {
  global?: boolean;
  guilds?: string[];
}

export interface CommandOptions {
  name?: string;
  description?: string;
  preconditions?: Precondition[];
  category?: string;
  register?: RegisterOptions;
}

export interface ApplicationCommandsData {
  chatInput?: ChatInputCommandBuilder | ChatInputApplicationCommandData;
  userContextMenu?: ContextMenuCommandBuilder | UserApplicationCommandData;
  messageContextMenu?:
    | ContextMenuCommandBuilder
    | MessageApplicationCommandData;
}

export type MessageTrigger = (message: Message) => MaybePromise<boolean>;

export class Command extends Component {
  /** The command's name, in lowercase and kebab-case. */
  public name: string;

  /** The command's category, for grouping in help pages. */
  public category: string;

  /** A short, concise description of the command. */
  public description: string;

  /** Settings for automatically registering associated application commands. */
  public registerOptions: RegisterOptions;

  /** The preconditions to be met for the command's execution. */
  public preconditions: Precondition[];

  /** Information about the command's environment, such as its path in the filesystem. */
  public environment: EnvironmentContext; // TODO: set in constructor? make method for it?

  public applicationCommandsData: ApplicationCommandsData;

  public messageTrigger: MessageTrigger | null;

  public dataManager: ApplicationCommandDataManager =
    new ApplicationCommandDataManager();

  // TODO: reword this
  /** The raw handler object received. `null` before the command is invoked by a handler. */
  public original:
    | Message
    | ChatInputCommandInteraction
    | ContextMenuCommandInteraction; // TODO: check typing

  /**
   * @param options Optional settings that can be passed in each Command file.
   */
  public constructor(options?: CommandOptions) {
    super();

    if (options?.name) {
      this.name = options.name;
    } else {
      this.deriveName(this.constructor.name);
    }

    this.category = options?.category ?? this.category;
    this.description = options?.description ?? this.description;
    this.registerOptions = options?.register ?? this.registerOptions;
    this.preconditions = options?.preconditions ?? this.preconditions;

    if (Reflect.has(this, 'registerMessageTrigger')) {
      this.messageTrigger = this.registerMessageTrigger;
    } else if (Reflect.has(this, 'messageExecute') && this.name) {
      this.registerDefaultMessageTrigger();
    }

    if (Reflect.has(this, 'registerApplicationCommands')) {
      this.applicationCommandsData = {
        chatInput: null,
        userContextMenu: null,
      };

      this.registerApplicationCommands();
    }
  }

  /**
   * @returns Whether the command supports the chat input execution method.
   */
  public hasChatInput(): boolean {
    return (
      Reflect.has(this, 'registerApplicationCommands') &&
      Reflect.has(this, 'chatInputExecute')
    );
  }

  /**
   * @returns Whether the command supports the context menu execution method.
   */
  public hasContextMenu(): boolean {
    return Reflect.has(this, 'contextMenuExecute');
  }

  /**
   * @returns Whether the command supports the message execution method.
   */
  public hasMessage(): boolean {
    return this.messageTrigger && Reflect.has(this, 'messageExecute');
  }

  public async chatInputExecute?(
    interaction: ChatInputCommandInteraction
  ): Promise<unknown>;

  public async contextMenuExecute?(
    interaction: ContextMenuCommandInteraction
  ): Promise<unknown>;

  public async messageExecute?(message: Message): Promise<unknown>;

  // TODO: fix this typing mess
  public registerChatInputCommand(
    data: ChatInputCommandBuilder | ChatInputApplicationCommandData,
    options?: unknown
  ): void {
    const normalized = this.dataManager.normalizeChatInputData(data);

    this.applicationCommandsData.chatInput = normalized;
  }

  public registerContextMenuCommand(
    data:
      | ContextMenuCommandBuilder
      | UserApplicationCommandData
      | MessageApplicationCommandData
      | ((builder: ContextMenuCommandBuilder) => unknown),
    options?: unknown
  ): void {
    const normalized = this.dataManager.normalizeContextMenuData(data);

    if (normalized.type === ApplicationCommandType.User) {
      this.applicationCommandsData.userContextMenu = normalized;
    } else {
      this.applicationCommandsData.messageContextMenu = normalized;
    }
  }

  /**
   * This method is a convenient location in which to place
   * `registerChatInputCommand` and `registerContextMenuCommand` calls. It gets
   * called when the client is automatically registering commands, and when
   * checking whether there is aplication command registering data available.
   */
  public registerApplicationCommands?(): MaybePromise<unknown>;

  public registerMessageTrigger?(message: Message): MaybePromise<boolean>;

  /**
   * @returns Whether this command has data for registering application commands.
   */
  public hasApplicationCommandsRegisteringData(): boolean {
    if (
      !this?.applicationCommandsData?.chatInput &&
      !this?.applicationCommandsData?.userContextMenu &&
      !this?.applicationCommandsData?.messageContextMenu &&
      Reflect.has(this, 'registerApplicationCommands')
    ) {
      this.registerApplicationCommands();
    }

    return (
      Boolean(this?.applicationCommandsData?.chatInput) ||
      Boolean(this?.applicationCommandsData?.userContextMenu) ||
      Boolean(this?.applicationCommandsData?.messageContextMenu)
    );
  }

  /**
   * Derives a standard name (in kebab-case) for the command, based on a raw
   * `CamelCaseCommand`-style name.
   *
   * @param rawName The raw name, presumably from the constructor.
   */
  public deriveName(rawName: string): void {
    const dashesLower = rawName.replace(/([A-Z])/g, '-$1').toLowerCase();
    const nameResult = dashesLower.substring(1, dashesLower.lastIndexOf('-'));
    this.name = nameResult;
  }

  public registerDefaultMessageTrigger(): void {
    const dot = '.';
    const rawLowercase = this.name.toLowerCase();

    const separated = rawLowercase.split(/[\s-_.,]+/);
    const variants =
      separated.length === 1
        ? [rawLowercase]
        : [
            rawLowercase,
            separated.join('-'),
            separated.join('_'),
            separated.join(''),
          ];

    this.messageTrigger = (message) => {
      if (!message.content.startsWith(dot)) {
        return false;
      }

      const content = message.content.toLowerCase().replace(dot, '');

      return variants.some((word) => content.startsWith(word));
    };
  }

  public async runMessageTrigger(message: Message): Promise<boolean> {
    return this.messageTrigger(message);
  }

  public async runPreconditions(
    o: ChatInputCommandInteraction | ContextMenuCommandInteraction | Message
  ): Promise<PreconditionResult[]> {
    if (!this.preconditions) {
      return [];
    }

    let results: PreconditionResult[] = [];

    for (const precondition of this.preconditions) {
      if (
        o instanceof ChatInputCommandInteraction &&
        precondition.hasChatInput()
      ) {
        const result = await precondition.runChatInputCheck(o);

        results.push(result);
      }

      if (o instanceof Message && precondition.hasMessage()) {
        const result = await precondition.runMessageCheck(o);

        results.push(result);
      }

      if (
        o instanceof ContextMenuCommandInteraction &&
        precondition.hasContextMenu()
      ) {
        const result = await precondition.runContextMenuCheck(o);

        results.push(result);
      }
    }

    return results;
  }
}

export type ChatInputCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | ((builder: SlashCommandBuilder) => unknown)
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
