import { Client, Collection } from 'discord.js';
import { Component, ComponentCompliant } from './component';
import { Command } from './command';
import { Logger } from './logger';

export class CommandStore
  extends Collection<string, Command>
  implements ComponentCompliant
{
  client: Client;
  logger: Logger;

  public constructor(optionsOrClient?: Component.Options) {
    super();

    if (optionsOrClient) {
      this.populateComponent(optionsOrClient);
    }
  }

  public keysToArray(): string[] {
    return Array.from(this.keys());
  }

  public valuesToArray(): Command[] {
    return Array.from(this.values());
  }

  public populateComponent(options: Component.Options) {
    if (options instanceof Client) {
      this.client = options;
      this.logger = options.logger;
    } else {
      this.client = options.client;
      this.logger = options.logger;
    }
  }
}
