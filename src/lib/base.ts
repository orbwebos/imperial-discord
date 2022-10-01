import { ImperialClient } from './client';
import { Logger } from './logger';

export interface Base {
  client: ImperialClient;
  logger: Logger;
}

export const base: Base = {
  client: null,
  logger: null,
};
