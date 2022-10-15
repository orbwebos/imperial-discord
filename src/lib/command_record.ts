import { Command } from './command';
import { Record } from './record';

export class CommandRecord extends Record<Command> {
  public constructor() {
    super({ name: 'commands', discriminator: 'command' });
  }
}
