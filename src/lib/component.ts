import { Client } from 'discord.js';
import { Base, base } from './base';
import { Logger } from './logger';
import { MaybePromise } from './util';

export interface ProvidesBCL {
  get base(): Base;
  get client(): Client;
  get logger(): Logger;
}

export abstract class Component implements ProvidesBCL {
  public get base(): Base {
    return base;
  }

  public get client(): Client {
    return base.client;
  }

  public get logger(): Logger {
    return base.logger;
  }

  public syncHook(): MaybePromise<unknown> {
    return undefined;
  }

  public unsyncHook(): MaybePromise<unknown> {
    return undefined;
  }
}
