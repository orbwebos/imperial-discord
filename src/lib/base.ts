import { Client } from 'discord.js';
import { ClientOrOptions as DefaultClientOrOptions } from './base_options';
import { Logger } from './logger';

// eslint-disable-next-line import/export
export abstract class Base {
  public client: Client;
  public logger: Logger;

  public constructor(optionsOrClient?: DefaultClientOrOptions) {
    if (optionsOrClient) {
      this.populateBase(optionsOrClient);
    }
  }

  public populateBase(optionsOrClient: DefaultClientOrOptions) {
    if (optionsOrClient instanceof Client) {
      this.client = optionsOrClient;
      this.logger = optionsOrClient.logger;
    } else {
      this.client = optionsOrClient.client;
      this.logger = optionsOrClient.logger;
    }
  }
}

// eslint-disable-next-line no-redeclare, import/export
export namespace Base {
  export type ClientOrOptions = DefaultClientOrOptions;
}
