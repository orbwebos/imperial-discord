import { Client, Interaction } from 'discord.js';
import { Handler } from '../handler';

export class InteractionCreateHandler extends Handler {
  public constructor() {
    super({ name: 'interactionCreate' });
  }

  public async execute(interaction: Interaction, client: Client) {
    // TODO: make it work on all kinds of interactions
    if (!interaction.isCommand() || !interaction.isChatInputCommand()) {
      return;
    }

    const command = client.commandStore.find(
      (cmd) =>
        cmd.hasChatInput() && cmd.chatInputData.name === interaction.commandName
    );
    if (!command) return;

    if (interaction.options.getSubcommand(false) === null) {
      client.logger.info(
        `${interaction.user.tag} in #${
          (interaction.channel as any).name
        } triggered an interaction: ${interaction.commandName}`
      );
    } else {
      client.logger.info(
        `${interaction.user.tag} in #${
          (interaction.channel as any).name
        } triggered an interaction: ${
          interaction.commandName
        } ${interaction.options.getSubcommand(false)}`
      );
    }

    try {
      await command.chatInputExecute(interaction);
    } catch (error) {
      client.logger.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command.',
        ephemeral: true,
      });
    }
  }
}
