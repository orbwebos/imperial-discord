import { Client, Collection } from 'discord.js';
import { Base, BaseCompliant } from './base';
import { Command } from './command';
import { Logger } from './logger';

export class CommandStore
  extends Collection<string, Command>
  implements BaseCompliant
{
  client: Client;
  logger: Logger;

  public constructor(optionsOrClient?: Base.ClientOrOptions) {
    super();

    if (optionsOrClient) {
      this.populateBase(optionsOrClient);
    }
  }

  public keysToArray(): string[] {
    return Array.from(this.keys());
  }

  public valuesToArray(): Command[] {
    return Array.from(this.values());
  }

  public populateBase(options: Base.ClientOrOptions) {
    if (options instanceof Client) {
      this.client = options;
      this.logger = options.logger;
    } else {
      this.client = options.client;
      this.logger = options.logger;
    }
  }
}
