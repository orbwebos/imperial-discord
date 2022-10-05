import { Client, Collection } from 'discord.js';
import { ProvidesBCL } from './component';
import { Command } from './command';
import { Record } from './record';

export class CommandRecord extends Record<string, Command> {}
