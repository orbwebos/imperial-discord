import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Message,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { Base } from './base';

export interface CommandOptions {
  name?: string;
  description?: string;
  category?: string;
}

export type MessageCallback = (message: Message) => boolean;
export class Command extends Base {
  public name: string;
  public category: string;
  public description: string;
  public chatInputData: RESTPostAPIApplicationCommandsJSONBody; // TODO: check typing
  public messageCallback: MessageCallback | null;
  public original:
    | Message
    | ChatInputCommandInteraction
    | ContextMenuCommandInteraction; // TODO: check typing

  public constructor(options?: CommandOptions) {
    super();
    this.name = options?.name ?? this.name;
    this.category = options?.category ?? this.category;
    this.description = options?.description ?? this.description;
    if (Reflect.has(this, 'registerMessageCallback')) {
      this.messageCallback = this.registerMessageCallback;
    }
    if (Reflect.has(this, 'registerApplicationCommand')) {
      const data = this.registerApplicationCommand();
      this.chatInputData = Reflect.has(data, 'toJSON')
        ? (data as any).toJSON()
        : data;
    }
  }

  public hasChatInput() {
    return (
      Reflect.has(this, 'registerApplicationCommand') &&
      Reflect.has(this, 'chatInputExecute')
    );
  }

  public hasMessage() {
    return (
      Reflect.has(this, 'registerMessageCallback') &&
      Reflect.has(this, 'messageExecute')
    );
  }

  public hasContextMenu() {
    return Reflect.has(this, 'contextMenuExecute');
  }

  public registerApplicationCommand?():
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    | RESTPostAPIApplicationCommandsJSONBody;

  public registerMessageCallback?(message: Message): boolean;

  public async chatInputExecute?(
    interaction: ChatInputCommandInteraction
  ): Promise<unknown>;

  public async messageExecute?(message: Message): Promise<unknown>;

  public async contextMenuExecute?(
    interaction: ContextMenuCommandInteraction
  ): Promise<unknown>;
}
