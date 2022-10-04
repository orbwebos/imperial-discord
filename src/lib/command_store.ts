import { Client, Collection } from 'discord.js';
import { ComponentCompliant } from './component';
import { Command } from './command';
import { Logger } from './logger';
import { Base, base } from './base';

export class CommandStore
  extends Collection<string, Command>
  implements ComponentCompliant
{
  public keysToArray(): string[] {
    return Array.from(this.keys());
  }

  public valuesToArray(): Command[] {
    return Array.from(this.values());
  }

  public get base(): Base {
    return base;
  }

  public get client(): Client {
    return base.client;
  }

  public get logger(): Logger {
    return base.logger;
  }
}
