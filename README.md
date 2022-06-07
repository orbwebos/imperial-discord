# Imperial Discord

A small Discord framework for personal use. It's in its earliest stages.

## Installation

```
npm install imperial-discord discord.js
```

## Example usage (subject to change)

```ts
import { Intents } from 'discord.js';
import { ImperialClient } from 'imperial-discord';

const client = new ImperialClient({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
  logger: {
    level: 'debug',
  },
});

const sourcePath = '/path/to/bot/src';

client.setupCommands(`${sourcePath}/commands`);
client.setupHandlers(`${sourcePath}/handlers`);

client.login(process.env.DISCORD_TOKEN);
```

## License

[MIT](https://spdx.org/licenses/MIT.html).
