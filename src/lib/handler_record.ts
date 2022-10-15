import { Handler } from './handler';
import { Record } from './record';

export class HandlerRecord extends Record<Handler> {
  public constructor() {
    super({ name: 'handlers', discriminator: 'handler' });
  }
}
