import { DMChannel, Message, ThreadChannel } from 'discord.js';
import { Command } from '../command';
import { Handler } from '../handler';
import { Replier } from '../replier';
import { EmbedTitle } from '../title';

export class MessageCommandRunHandler extends Handler {
  public async run(message: Message, commands: Command[]) {
    const where =
      message.channel instanceof DMChannel || message.channel.partial === true
        ? 'through DMs'
        : message.channel instanceof ThreadChannel
        ? `in #${message.channel.name}, thread under #${message.channel.parent.name},`
        : `in #${message.channel.name}`;

    const replier = new Replier(message);

    const promises: Promise<any>[] = [];
    for (const command of commands) {
      message.client.logger.info(
        `${message.author.tag} ${where} triggered a message command: ${command.name}`
      );

      const preconditionErrors = (
        await command.runPreconditions(message)
      ).filter((result) => !result.passed);

      if (preconditionErrors.length) {
        let text =
          preconditionErrors.length === 1
            ? `Sorry, but you didn't meet a precondition for this command (*${command.name}*). It is as follows:\n\n`
            : `Sorry, but you didn't meet some preconditions for this command (*${command.name}*). They are as follows:\n\n`;

        for (const result of preconditionErrors) {
          text += `**${result.name}**\n${result.message}\n\n`;
        }

        replier.embedReply(new EmbedTitle(command).error, text);
      } else {
        promises.push(command.messageExecute(message));
      }
    }

    (await Promise.allSettled(promises)).forEach((promise) => {
      if (promise.status === 'rejected') {
        throw promise.reason;
      }
    });
  }
}
