import { ImperialClient } from './client';
import { Logger } from './logger';
import { RecordManager } from './record_manager';

export interface Base {
  records: RecordManager;
  client: ImperialClient;
  logger: Logger;
}

export const base: Base = {
  records: new RecordManager(),
  client: null,
  logger: null,
};
