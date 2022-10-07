import { Client, Interaction } from 'discord.js';
import { Command } from '../command';
import { Handler } from '../handler';
import { Replier } from '../replier';
import { EmbedTitle } from '../title';

export function commandIsAppropiateToInteraction(
  command: Command,
  interaction: Interaction
) {
  if (interaction.isChatInputCommand()) {
    return (
      interaction.commandName ===
        command?.applicationCommandsData?.chatInput?.name ||
      interaction.commandName === command.name
    );
  } else if (interaction.isContextMenuCommand()) {
    return (
      interaction.commandName ===
        command?.applicationCommandsData?.userContextMenu?.name ||
      interaction.commandName === command.name
    );
  }

  return false;
}

export class InteractionCreateHandler extends Handler {
  public constructor() {
    super({ event: 'interactionCreate' });
  }

  public async run(interaction: Interaction, client: Client) {
    // TODO: make it work on all kinds of interactions
    if (!interaction.isCommand()) {
      return;
    }

    const command = client.commandRecord.find((cmd) =>
      commandIsAppropiateToInteraction(cmd, interaction)
    );

    if (!command) {
      return;
    }

    // if (interaction.options.getSubcommand(false) === null) {
    client.logger.info(
      `${interaction.user.tag} in #${
        (interaction.channel as any).name
      } triggered an interaction: ${interaction.commandName}`
    );
    // } else {
    //   client.logger.info(
    //     `${interaction.user.tag} in #${
    //       (interaction.channel as any).name
    //     } triggered an interaction: ${
    //       interaction.commandName
    //     } ${interaction.options.getSubcommand(false)}`
    //   );
    // }

    const preconditionErrors = (
      await command.runPreconditions(interaction)
    ).filter((result) => !result.passed);

    if (preconditionErrors.length) {
      let text =
        preconditionErrors.length === 1
          ? `Sorry, but you didn't meet a precondition for this command (*${command.name}*). It is as follows:\n\n`
          : `Sorry, but you didn't meet some preconditions for this command (*${command.name}*). They are as follows:\n\n`;

      for (const result of preconditionErrors) {
        text += `**${result.name}**\n${result.message}\n\n`;
      }

      if (interaction.isChatInputCommand()) {
        return new Replier(interaction).embedReply(
          new EmbedTitle(command).error,
          text
        );
      } else {
        // TODO: do something about this situation
        return interaction.reply(text);
      }
    }

    try {
      if (interaction.isChatInputCommand()) {
        await command.chatInputExecute(interaction);
      } else {
        await command.contextMenuExecute(interaction);
      }
    } catch (error) {
      client.logger.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command.',
        ephemeral: true,
      });
    }
  }
}
