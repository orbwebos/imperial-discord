import { Client, ClientOptions } from 'discord.js';
import { ImperialClient } from './client';
import { isNullOrUndefined } from './util';

export class Imperial {
  public static async start(options: ClientOptions): Promise<Client> {
    const client = new ImperialClient(options);

    await client.setupCommands(client.commandsDirectory);
    await client.setupDefaultHandlers(options.defaultHandlers);
    await client.setupHandlers(client.handlersDirectory);

    if (!isNullOrUndefined(options.token)) {
      await client.login(options.token);

      client.shouldRegisterCommands = options.registerCommands ?? true;
    }

    return client;
  }
}
