import { CommandInteraction } from 'discord.js';

export class EmbedTitle {
  public readonly response: string;
  public readonly status: string;
  public readonly error: string;
  public readonly prompt: string;
  public readonly choice: string;
  public readonly cancelled: string;
  public readonly processing: string;
  public readonly stateError: string;

  public constructor(interaction: CommandInteraction) {
    const commandNameFirstCap =
      interaction.commandName.charAt(0).toUpperCase() +
      interaction.commandName.slice(1);

    const titleTemplate = !(interaction.options.getSubcommand(false) === null)
      ? `${commandNameFirstCap} ${interaction.options.getSubcommand()}`
      : `${interaction.commandName}`;

    this.response = `${titleTemplate} response`;
    this.status = `${titleTemplate} status`;
    this.error = `${titleTemplate} error`;
    this.prompt = `${titleTemplate} prompt`;
    this.choice = `${titleTemplate} choice`;
    this.cancelled = `${titleTemplate} cancelled`;
    this.processing = `${titleTemplate} processing...`;
    this.stateError = `${titleTemplate} state error`;
  }
}
