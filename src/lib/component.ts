import { Client } from 'discord.js';
import { Base, base } from './base';
import { ComponentOptions } from './component_options';
import { Logger } from './logger';

// eslint-disable-next-line import/export
export abstract class Component {
  public client: Client;
  public logger: Logger;

  public constructor(options?: ComponentOptions | Client) {
    if (options instanceof Client) {
      this.client = options;
      this.logger = options.logger;
    } else if (options) {
      this.client = options.client;
      this.logger = options.logger;
    } else {
      this.client = base.client;
      this.logger = base.logger;
    }
  }

  public get base(): Base {
    return base;
  }
}

export interface ComponentCompliant {
  client: Client;
  logger: Logger;
}

// eslint-disable-next-line no-redeclare, import/export
export namespace Component {
  export type Options = ComponentOptions | Client;
}
