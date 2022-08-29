import { Client } from 'discord.js';
import { Logger } from './logger';

export interface BaseOptions {
  client: Client;
  logger: Logger;
}

export type ClientOrOptions = BaseOptions | Client;
