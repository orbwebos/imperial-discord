import { Client } from 'discord.js';
import { ComponentOptions } from './component_options';
import { Logger } from './logger';

// eslint-disable-next-line import/export
export abstract class Component {
  public client: Client;
  public logger: Logger;

  public constructor(options?: ComponentOptions | Client) {
    if (options) {
      this.populateComponent(options);
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
  populateComponent(optionsOrClient: Component.Options): void;
}

// eslint-disable-next-line no-redeclare, import/export
export namespace Component {
  export type Options = ComponentOptions | Client;
}
