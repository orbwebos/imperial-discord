import { Message } from 'discord.js';
import { Handler } from '../handler';
import { processMessage } from '../message';

export class MessageCreateHandler extends Handler {
  public constructor() {
    super({ name: 'messageCreate' });
  }

  public async execute(message: Message) {
    processMessage(message);
  }
}
