import { Client } from 'discord.js';
import { Base, base } from './base';
import { Logger } from './logger';

export abstract class Component {
  public client: Client;
  public logger: Logger;

  public constructor() {
    this.client = base.client;
    this.logger = base.logger;
  }

  public get base(): Base {
    return base;
  }
}

export interface ComponentCompliant {
  client: Client;
  logger: Logger;
  get base(): Base;
}
