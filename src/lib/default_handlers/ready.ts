import { Handler } from '../handler';
import { Client } from 'discord.js';

export class ReadyHandler extends Handler {
  public constructor() {
    super({ name: 'ready', once: true });
  }

  public async execute(client: Client) {
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
