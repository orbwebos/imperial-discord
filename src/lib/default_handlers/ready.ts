import { Handler } from '../handler';
import { Client } from 'discord.js';

export class ReadyHandler extends Handler {
  public constructor() {
    super({ name: 'ready', once: true });
  }

  public async execute(client: Client) {
    client.logger.info(`Ready. Logged in as ${client.user.tag}`);
  }
}
