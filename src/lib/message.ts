import { Collection, DMChannel, Message, ThreadChannel } from 'discord.js';
import { Command } from './command';
import { Replier } from './replier';
import { EmbedTitle } from './title';

export async function commandsTriggeredByMessage(
  message: Message
): Promise<Command[] | undefined> {
  if (message.author.bot) {
    return;
  }

  const commands: Command[] = [];
  for (const [, command] of message.client.commandStore) {
    if (command.hasMessage() && (await command.runMessageTrigger(message))) {
      commands.push(command);
    }
  }

  if (!commands.length) {
    return;
  }

  return commands;
}

export function variantsMessageTrigger(
  content: string,
  ...variants: string[]
): boolean {
  const dot = '.';

  if (!content.startsWith(dot)) {
    return false;
  }

  const noPrefix = content.toLowerCase().replace(dot, '');

  const separated = variants.map((variant) =>
    variant.toLowerCase().split(/[\s-_.,]+/)
  );

  const finalVariants = separated.flatMap((sep) =>
    sep.length === 1 ? [sep[0]] : [sep.join('-'), sep.join('_'), sep.join('')]
  );

  return finalVariants.some((word) => noPrefix.startsWith(word));
}
