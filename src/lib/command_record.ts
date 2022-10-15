import { Command } from './command';
import { Record } from './record';

export class CommandRecord extends Record<Command> {
  public constructor(path: string) {
    super({ name: 'commands', discriminator: 'command', path });
  }
}
