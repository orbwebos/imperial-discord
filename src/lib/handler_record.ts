import { Handler } from './handler';
import { Record } from './record';

export class HandlerRecord extends Record<Handler> {
  public constructor(path: string) {
    super(path, 'handler');
  }
}
