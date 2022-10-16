import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Message,
} from 'discord.js';
import { Precondition } from '../lib/preconditions';

export class OwnerExclusivePrecondition extends Precondition {
  public async chatInputCheck(interaction: ChatInputCommandInteraction) {
    return this.checkIfOwner(interaction.user.id);
  }

  public async contextMenuCheck(interaction: ContextMenuCommandInteraction) {
    return this.checkIfOwner(interaction.user.id);
  }

  public async messageCheck(message: Message) {
    return this.checkIfOwner(message.author.id);
  }

  private checkIfOwner(id: string) {
    return this.client.ownerIds.includes(id)
      ? this.ok()
      : this.error('You need owner permission to run this.');
  }
}

export const ownerExclusive = new OwnerExclusivePrecondition();
