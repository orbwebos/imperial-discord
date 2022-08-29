import { DMChannel, Message, ThreadChannel } from 'discord.js';

export async function processMessage(message: Message) {
  if (message.author.bot) return;

  const where =
    message.channel instanceof DMChannel || message.channel.partial === true
      ? 'through DMs'
      : message.channel instanceof ThreadChannel
      ? `in #${message.channel.name}, thread under #${message.channel.parent.name},`
      : `in #${message.channel.name}`;

  const commands = message.client.commandStore.filter(
    (command) => command.hasMessage() && command.messageCallback(message)
  );

  if (!commands.size) return false;

  const promises: Promise<any>[] = [];
  for (const [, command] of commands) {
    message.client.logger.info(
      `${message.author.tag} ${where} triggered a message command: ${command.name}`
    );

    promises.push(command.messageExecute(message));
  }

  (await Promise.allSettled(promises)).forEach((promise) => {
    if (promise.status === 'rejected') {
      throw promise.reason;
    }
  });

  return true;
}
