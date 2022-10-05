import { Client, Collection } from 'discord.js';
import { base, Base } from './base';
import { ProvidesBCL } from './component';
import { Logger } from './logger';

export class ExtendedCollection<K, V>
  extends Collection<K, V>
  implements ProvidesBCL
{
  public keysToArray(): K[] {
    return Array.from(this.keys());
  }

  public valuesToArray(): V[] {
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
