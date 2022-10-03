import { Client, Collection, GuildEmoji } from 'discord.js';
import { Base, base } from './base';
import { ComponentCompliant } from './component';
import { Logger } from './logger';

/**
 * A Collection (discord.js' extension of a Map) of all available emojis, with
 * additional methods to setup the store and to refresh it.
 *
 * @example
 * ```typescript
 * client.emojiStore.setup();
 * client.emojiStore.forEach((emoji) => console.log(emoji.name));
 *
 * client.emojiStore.refresh();
 * console.log(client.emojiStore.size);
 * ```
 */
export class EmojiStore
  extends Collection<string, GuildEmoji>
  implements ComponentCompliant
{
  public client: Client;
  public logger: Logger;

  public constructor() {
    super();

    this.client = base.client;
    this.logger = base.logger;
  }

  public setup(): void {
    this.client.emojis.cache.forEach((value, key) => this.set(key, value));
  }

  /**
   * @warning
   * Don't use this method before calling the setup method.
   */
  public async refresh(): Promise<void> {
    const guilds = await this.client.guilds.fetch();
    const placeholderCache = new Collection<string, GuildEmoji>();

    // eslint-disable-next-line no-restricted-syntax
    for (const [, oauth2guild] of guilds) {
      // eslint-disable-next-line no-await-in-loop
      const guild = await oauth2guild.fetch();
      // eslint-disable-next-line no-await-in-loop
      const emojis = await guild.emojis.fetch();
      emojis.forEach((value, key) => placeholderCache.set(key, value));
    }

    this.clear();
    placeholderCache.forEach((value, key) => this.set(key, value));
  }

  public get base(): Base {
    return base;
  }
}
