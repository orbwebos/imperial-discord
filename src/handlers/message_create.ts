import { Message } from 'discord.js';
import { Handler } from '../lib/handler';
import { commandsTriggeredByMessage } from '../lib/message';

export class MessageCreateHandler extends Handler {
  public async run(message: Message) {
    const commands = await commandsTriggeredByMessage(message);

    if (!commands) {
      return;
    }

    return this.client.emit('messageCommandRun', message, commands);
  }
}
