import { Client } from 'discord.js';
import { Logger } from './logger';

export interface ComponentOptions {
  client: Client;
  logger: Logger;
}
