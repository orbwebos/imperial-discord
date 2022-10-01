import {
  ChatInputApplicationCommandData,
  ContextMenuCommandBuilder,
  MessageApplicationCommandData,
  SlashCommandBuilder,
  UserApplicationCommandData,
} from 'discord.js';
import { Component } from './component';
import { ChatInputCommandBuilder } from './command';
import { isFunction } from './util';

// TODO: when all is said and done, check if it really needs to extend Component
export class ApplicationCommandDataManager extends Component {
  public normalizeChatInputData(
    data: ChatInputCommandBuilder | ChatInputApplicationCommandData
  ) {
    return isFunction(data)
      ? (data(new SlashCommandBuilder()) as SlashCommandBuilder) // TODO: should it be done like this?
      : data;
  }

  public normalizeContextMenuData(
    data:
      | ContextMenuCommandBuilder
      | UserApplicationCommandData
      | MessageApplicationCommandData
      | ((builder: ContextMenuCommandBuilder) => unknown)
  ) {
    return isFunction(data)
      ? (data(new ContextMenuCommandBuilder()) as ContextMenuCommandBuilder) // TODO: should it be done like this?
      : data;
  }
}
