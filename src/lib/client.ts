import * as fs from 'fs';
import {
  Client,
  ClientOptions,
  Collection,
  CommandInteraction,
} from 'discord.js';
import { EmojiStore } from './emoji_store';
import { ImperialClientOptions } from './client_options';
import { ImperialLogger, Logger } from './logger';

export class ImperialClient<
  Ready extends boolean = boolean
> extends Client<Ready> {
  public readonly logger: Logger;
  public emojiStore: EmojiStore;
  public commands: Collection<
    string,
    (interaction: CommandInteraction) => Promise<void>
  >;

  public constructor(options: ClientOptions) {
    super(options);

    if (options.logger === null || options.logger === undefined) {
      this.logger = new ImperialLogger({});
    } else if ('info' in options.logger) {
      this.logger = options.logger;
    } else {
      this.logger = new ImperialLogger(options.logger);
    }

    this.commands = new Collection();
    this.emojiStore = new EmojiStore();
  }

  public setupCommands(path: fs.PathLike): void {
    const commandFiles = fs
      .readdirSync(path)
      .filter((file) => file.endsWith('.js'));

    commandFiles.forEach((file: string) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const cmd = require(`${path}/${file}`);
      this.commands.set(cmd.cmd.data.name, cmd.cmd.executer);
    });
  }

  public setupHandlers(path: fs.PathLike): void {
    const eventFiles = fs
      .readdirSync(path)
      .filter((file) => file.endsWith('.js'));

    eventFiles.forEach((file: string) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const Event = require(`${path}/${file}`).default;
      const data = new Event();

      if (data.once) {
        this.once(data.name, (...args) => Event.execute(...args, this));
      } else {
        this.on(data.name, (...args) => Event.execute(...args, this));
      }
    });
  }

  public async login(token?: string): Promise<string> {
    const returned = await super.login(token);

    return returned;
  }
}

declare module 'discord.js' {
  interface Client {
    readonly logger: Logger;
    emojiStore: EmojiStore;
    commands: Collection<
      string,
      (interaction: CommandInteraction) => Promise<void>
    >;
  }

  interface ClientOptions extends ImperialClientOptions {}
}
