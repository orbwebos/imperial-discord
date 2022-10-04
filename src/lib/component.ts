import { Client } from 'discord.js';
import { Base, base } from './base';
import { Logger } from './logger';

export abstract class Component {
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

export interface ComponentCompliant {
  get base(): Base;
  get client(): Client;
  get logger(): Logger;
}
