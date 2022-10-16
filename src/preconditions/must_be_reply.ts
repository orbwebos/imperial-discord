import { Message } from 'discord.js';
import { Precondition } from '../lib/preconditions';

export class MustBeReplyPrecondition extends Precondition {
  public async messageCheck(message: Message) {
    if (message.reference === null) {
      return this.error('Your message must be a reply to another message.');
    }

    return this.ok();
  }
}

export const mustBeReply = new MustBeReplyPrecondition();
