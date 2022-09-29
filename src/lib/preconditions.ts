import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Message,
} from 'discord.js';
import { Base } from './base';
import {
  CommandType,
  ContextMapping,
  defaultContextMapping,
  getFromMapping,
} from './context_mapping';

export interface errorMessageOptions {
  messageOverride?: ContextMapping<string>;
  messageAddition?: ContextMapping<string>;
}

export function adjustUserPreconditionErrorMessage(message: string): string {
  if (!message) {
    return undefined;
  }

  return message.charAt(0) === '\n' ? message : ` ${message}`;
}

export interface PreconditionResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface PreconditionOptions {
  baseOptions?: Base.ClientOrOptions;
  name?: string;
  messageOverride?: ContextMapping<string>;
  messageAddition?: ContextMapping<string>;
}

function preconditionName(raw: string): string {
  const inter = raw
    .split(/(?=[A-Z])/)
    .join(' ')
    .toLowerCase()
    .replace(' precondition', '');

  return inter.charAt(0).toUpperCase() + inter.slice(1);
}

export abstract class Precondition extends Base {
  public name: string;
  public messageOverride: ContextMapping<string> = defaultContextMapping();
  public messageAddition: ContextMapping<string> = defaultContextMapping(''); // do this better
  private running: CommandType = CommandType.ChatInput;

  public constructor(options?: PreconditionOptions) {
    super(options?.baseOptions);

    this.name = options?.name ?? preconditionName(this.constructor.name);
    this.messageOverride = options?.messageOverride;
    this.messageAddition = options?.messageAddition;
  }

  public ok(): PreconditionResult {
    return { name: this.name, passed: true, message: '' };
  }

  public error(message: string): PreconditionResult {
    const inter = getFromMapping(this.messageOverride, this.running) ?? message;

    const addition = getFromMapping(this.messageAddition, this.running);
    const final = addition ? inter + addition : inter;

    return { name: this.name, passed: false, message: final };
  }

  private newInstance(options: errorMessageOptions): Precondition {
    return new (this.constructor as any)({
      baseOptions: this.client,
      name: this.name,
      messageOverride: options?.messageOverride ?? this.messageOverride,
      messageAddition: options?.messageAddition ?? this.messageAddition,
    });
  }

  /**
   * Overrides the error message. Note that this method returns a new instance
   * with the caller's override, instead of modifying the instance in which it's
   * being called. If you want to do the latter, assign your new value to the
   * actual property, like so:
   *
   * ```js
   * precondition.messageOverride = value;
   * ```
   * @param options A string (which will update all overrides) or a mapping of
   * command types to their respective overrides.
   * @returns The new instance with the relevant properties changed.
   */
  public overrideMessage(
    options: string | ContextMapping<string>
  ): Precondition {
    if (typeof options === 'string') {
      return this.newInstance({
        messageOverride: defaultContextMapping(options),
      });
    }

    return this.newInstance({
      messageOverride: {
        chatInput: options?.chatInput ?? this.messageOverride.chatInput,
        contextMenu: options?.contextMenu ?? this.messageOverride.contextMenu,
        message: options?.message ?? this.messageOverride.message,
      },
    });
  }

  /**
   * Adds to the error message. Note that this method returns a new instance
   * with the caller's override, instead of modifying the instance in which it's
   * being called. If you want to do the latter, assign your new value to the
   * actual property, like so:
   *
   * ```js
   * precondition.messageAddition = value;
   * ```
   * @param options A string (which will update all additions) or a mapping of
   * command types to their respective additions.
   * @returns The new instance with the relevant properties changed.
   */
  public addToMessage(options: string | ContextMapping<string>): Precondition {
    if (typeof options === 'string') {
      const addition = adjustUserPreconditionErrorMessage(options);

      return this.newInstance({
        messageAddition: defaultContextMapping(addition),
      });
    }

    return this.newInstance({
      messageAddition: {
        chatInput:
          adjustUserPreconditionErrorMessage(options?.chatInput) ??
          this.messageAddition.chatInput,
        contextMenu:
          adjustUserPreconditionErrorMessage(options?.contextMenu) ??
          this.messageAddition.contextMenu,
        message:
          adjustUserPreconditionErrorMessage(options?.message) ??
          this.messageAddition.message,
      },
    });
  }

  public async runChatInputCheck(
    interaction: ChatInputCommandInteraction
  ): Promise<PreconditionResult> {
    if (!this.hasChatInput()) {
      throw new Error('precondition has no method defined for chat input');
    }

    this.running = CommandType.ChatInput;

    return this.chatInputCheck(interaction);
  }

  public async runContextMenuCheck(
    interaction: ContextMenuCommandInteraction
  ): Promise<PreconditionResult> {
    if (!this.hasContextMenu()) {
      throw new Error('precondition has no method defined for context menu');
    }

    this.running = CommandType.ContextMenu;

    return this.contextMenuCheck(interaction);
  }

  public async runMessageCheck(message: Message): Promise<PreconditionResult> {
    if (!this.hasMessage()) {
      throw new Error('precondition has no method defined for message');
    }

    this.running = CommandType.Message;

    return this.messageCheck(message);
  }

  public async chatInputCheck?(
    interaction: ChatInputCommandInteraction
  ): Promise<PreconditionResult>;

  public async contextMenuCheck?(
    interaction: ContextMenuCommandInteraction
  ): Promise<PreconditionResult>;

  public async messageCheck?(message: Message): Promise<PreconditionResult>;

  public hasChatInput() {
    return Reflect.has(this, 'chatInputCheck');
  }

  public hasContextMenu() {
    return Reflect.has(this, 'contextMenuCheck');
  }

  public hasMessage() {
    return Reflect.has(this, 'messageCheck');
  }
}

export class OwnerExclusivePrecondition extends Precondition {
  public async chatInputCheck(interaction: ChatInputCommandInteraction) {
    return this.checkIfOwner(interaction.user.id);
  }

  public async contextMenuCheck(interaction: ContextMenuCommandInteraction) {
    return this.checkIfOwner(interaction.user.id);
  }

  public async messageCheck(message: Message) {
    return this.checkIfOwner(message.author.id);
  }

  private checkIfOwner(id: string) {
    return this.client.ownerIds.includes(id)
      ? this.ok()
      : this.error('You need owner permission to run this.');
  }
}

export class MustBeReplyPrecondition extends Precondition {
  public async messageCheck(message: Message) {
    if (message.reference === null) {
      return this.error('Your message must be a reply to another message.');
    }

    return this.ok();
  }
}

export const ownerExclusive = new OwnerExclusivePrecondition();
export const mustBeReply = new MustBeReplyPrecondition();
