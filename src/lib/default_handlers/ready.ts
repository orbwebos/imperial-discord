import { Handler } from '../handler';
import { Client } from 'discord.js';

export class ReadyHandler extends Handler {
  public constructor() {
    super({ event: 'ready', once: true });
  }

  public async run(client: Client) {
    const transcurred =
      client.readyAt.getTime() - client.instantiatedAt.getTime();

    client.logger.info(
      `Initialized in ${transcurred}ms. User tag: ${client.user.tag}`
    );

    if (client.shouldRegisterCommands !== false) {
      return client.smartRegisterCommands();
    }
  }
}
