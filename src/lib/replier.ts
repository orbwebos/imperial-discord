import {
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  Message,
  EmbedBuilder,
  EmbedData,
  ReplyMessageOptions,
  APIEmbed,
} from 'discord.js';
import { Component } from './component';
import { Command } from './command';
import { BrandedEmbed } from './embeds';
import { isNullOrUndefined } from './util';

export interface ReplierEmbedOptions {
  title: string;
  body: string;
  ephemeral?: boolean;
}

type MixedReplierEmbedOptions<T> =
  | T
  | InteractionReplyOptions
  | ReplyMessageOptions
  | ReplierEmbedOptions
  | EmbedBuilder
  | EmbedBuilder[]
  | APIEmbed
  | APIEmbed[];

export class EmbedReplyState extends Component {
  public messageOptions: ReplyMessageOptions | InteractionReplyOptions;
  public ephemeral: InteractionReplyOptions['ephemeral'];
  public embedUserName: string;
  public embedAvatarUrl: string;
  public embedTitle: EmbedData['title'];
  public embedBody: EmbedData['description'];
  public embeds: APIEmbed[];

  public constructor(
    clientOrOptions: Component.Options,
    userName: string,
    avatar: string
  ) {
    super(clientOrOptions);
    this.embedUserName = userName;
    this.embedAvatarUrl = avatar;
    this.messageOptions = {};
    this.embeds = [];
  }

  public addToOtherEmbeds(
    embeds: EmbedBuilder | EmbedBuilder[] | APIEmbed | APIEmbed[]
  ) {
    if (Array.isArray(embeds)) {
      if (!embeds.length) {
        return;
      }

      for (const el of embeds) {
        if (el instanceof EmbedBuilder) {
          this.embeds.push(el.data);
        } else {
          this.embeds.push(el);
        }
      }
    } else {
      if (embeds instanceof EmbedBuilder) {
        this.embeds.push(embeds.data);
      } else {
        this.embeds.push(embeds);
      }
    }
  }

  public extractOptions(options: MixedReplierEmbedOptions<unknown>) {
    if (isReplierEmbedOptions(options)) {
      this.embedTitle = options.title;
      this.embedBody = options.body;
      this.ephemeral = options.ephemeral ?? this.ephemeral;

      return this;
    }

    if (isReplyOptions(options)) {
      for (const property in options) {
        if (property === 'embeds') {
          for (const embed of options[property]) {
            if ('toJSON' in embed) {
              this.embeds.push(embed.toJSON());
            } else {
              this.embeds.push(embed);
            }
          }
        } else if (property === 'ephemeral') {
          this.ephemeral = options[property] ?? this.ephemeral;
        } else {
          this.messageOptions[property] =
            options[property] ?? this.messageOptions[property];
        }
      }

      return this;
    }

    this.addToOtherEmbeds(options);
  }

  public extractOptionsTitle(
    titleOrOptions: MixedReplierEmbedOptions<string>
  ): EmbedReplyState {
    if (typeof titleOrOptions === 'string') {
      this.embedTitle = titleOrOptions;
      return this;
    }

    this.extractOptions(titleOrOptions);

    return this;
  }

  public extractOptionsBody(
    bodyOrOptions: MixedReplierEmbedOptions<string>
  ): EmbedReplyState {
    if (isNullOrUndefined(bodyOrOptions)) {
      return this;
    }

    if (typeof bodyOrOptions === 'string') {
      this.embedBody = bodyOrOptions;
      return this;
    }

    this.extractOptions(bodyOrOptions);

    return this;
  }

  public extractOptionsEphemeral(
    ephemeralOrOptions: MixedReplierEmbedOptions<boolean>
  ): EmbedReplyState {
    if (isNullOrUndefined(ephemeralOrOptions)) {
      return this;
    }

    if (typeof ephemeralOrOptions === 'boolean') {
      this.ephemeral = ephemeralOrOptions;
      return this;
    }

    this.extractOptions(ephemeralOrOptions);

    return this;
  }

  public getEmbeds(): APIEmbed[] {
    return [
      new BrandedEmbed(this.client).construct({
        title: this.embedTitle,
        body: this.embedBody,
        userName: this.embedUserName,
        avatarUrl: this.embedAvatarUrl,
      }).data,
    ].concat(this.embeds);
  }

  public getOptions(): InteractionReplyOptions | ReplyMessageOptions {
    const options = this.messageOptions;
    options.embeds = this.getEmbeds();

    return options;
  }
}

export class Replier extends Component {
  original: Message | ChatInputCommandInteraction;

  public constructor(
    original: Message | ChatInputCommandInteraction | Command
  ) {
    super(original.client);
    if (original instanceof Command) {
      if (
        !(
          original.original instanceof Message ||
          original.original instanceof ChatInputCommandInteraction
        )
      ) {
        throw new Error('passed non-message non-chat input command to replier');
      }
      this.original = original.original;
    } else {
      this.original = original;
    }
  }

  public embedReply(
    titleOrOptions: MixedReplierEmbedOptions<string>,
    bodyOrOptions?: MixedReplierEmbedOptions<string>,
    ephemeralOrOptions?: MixedReplierEmbedOptions<boolean>
  ) {
    const userName =
      this.original instanceof ChatInputCommandInteraction
        ? this.original.user.tag
        : this.original.author.tag;

    const avatarUrl =
      this.original instanceof ChatInputCommandInteraction
        ? this.original.user.displayAvatarURL()
        : this.original.author.displayAvatarURL();

    const embedState = new EmbedReplyState(this.client, userName, avatarUrl)
      .extractOptionsTitle(titleOrOptions)
      .extractOptionsBody(bodyOrOptions)
      .extractOptionsEphemeral(ephemeralOrOptions);

    const options = embedState.getOptions();

    return this.original.reply(options as any);
  }

  public isMessageReplier() {
    return this.original instanceof Message;
  }

  public isInteractionReplier() {
    return this.original instanceof ChatInputCommandInteraction;
  }
}

function isReplierEmbedOptions(o: any): o is ReplierEmbedOptions {
  return 'body' in o;
}

// should do more exhaustive check. consult documentation
function isReplyOptions(
  o: any
): o is InteractionReplyOptions | ReplyMessageOptions {
  return 'content' in o || 'embeds' in o;
}

function isInteractionReplyOptions(o: any): o is InteractionReplyOptions {
  return (
    isReplyOptions(o) && ('ephemeral' in o || 'fetchReply' in o || 'flags' in o)
  );
}

function isReplyMessageOptions(o: any): o is ReplyMessageOptions {
  return isReplyOptions(o) && ('failIfNotExists' in o || 'stickers' in o);
}
