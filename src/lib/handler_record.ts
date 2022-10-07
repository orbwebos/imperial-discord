import { Handler } from './handler';
import { Record } from './record';

export class HandlerRecord extends Record<string, Handler> {
  public constructor(path: string) {
    super(path, 'handler');
  }
}
