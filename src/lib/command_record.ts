import { Command } from './command';
import { Record } from './record';

export class CommandRecord extends Record<string, Command> {
  public constructor(path: string) {
    super(path, 'command');
  }
}
