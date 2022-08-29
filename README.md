# Imperial Discord

A small Discord framework for personal use. It's in its earliest stages.

## Installation

```
npm install imperial-discord discord.js
```

## Example usage (subject to change)

```ts
import { GatewayIntentBits } from 'discord.js';
import { Imperial } from 'imperial-discord';

Imperial.start({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  token: process.env.DISCORD_TOKEN
});
```

## License

[MIT](https://spdx.org/licenses/MIT.html).
