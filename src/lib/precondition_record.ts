import { Precondition } from './preconditions';
import { Record } from './record';

export class PreconditionRecord extends Record<Precondition> {
  public constructor() {
    super({ name: 'preconditions', discriminator: 'precondition' });
  }
}
