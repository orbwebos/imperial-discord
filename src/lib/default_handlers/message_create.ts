import { Message } from 'discord.js';
import { Handler } from '../handler';
import { commandsTriggeredByMessage } from '../message';

export class MessageCreateHandler extends Handler {
  public constructor() {
    super({ event: 'messageCreate' });
  }

  public async execute(message: Message) {
    const commands = await commandsTriggeredByMessage(message);

    if (!commands) {
      return;
    }

    return this.client.emit('messageCommandRun', message, commands);
  }
}
