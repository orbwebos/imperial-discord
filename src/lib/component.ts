import { Client } from 'discord.js';
import { base } from './base';
import { ComponentOptions } from './component_options';
import { Logger } from './logger';

// eslint-disable-next-line import/export
export abstract class Component {
  public client: Client;
  public logger: Logger;

  public constructor(options?: ComponentOptions | Client) {
    if (options) {
      this.populateComponent(options);
    } else {
      this.populateComponent(base.client);
    }
  }

  public populateComponent(options: ComponentOptions | Client): void {
    if (options instanceof Client) {
      this.client = options;
      this.logger = options.logger;
    } else {
      this.client = options.client;
      this.logger = options.logger;
    }
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
