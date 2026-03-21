'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const { COLORS } = require('../../utils/embedBuilder');

const NO_PING = { allowedMentions: { parse: [] } };

const qualityLabel = (ms) => {
  if (ms < 100) return 'Excellent';
  if (ms < 200) return 'Good';
  if (ms < 300) return 'Fair';
  return 'Poor';
};

const accentColor = (ms) => {
  if (ms < 100) return 0x1db954;
  if (ms < 200) return 0xf39c12;
  return 0xe94560;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  aliases: ['latency'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 3,
  execute: async (ctx) => {
    const start = Date.now();

    const loading = new ContainerBuilder()
      .setAccentColor(COLORS.info)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### Measuring latency…')
      );

    const msg = await ctx.reply({
      components: [loading],
      flags: MessageFlags.IsComponentsV2,
      ...NO_PING
    });

    const rest = Date.now() - start;
    const ws = ctx.client.ws.ping;
    const worst = Math.max(rest, ws);

    const result = new ContainerBuilder().setAccentColor(accentColor(worst));

    result.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### Pong!')
    );

    result.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    result.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `┌─ **WebSocket**\n` +
        `├─ Latency  \`${ws}ms\`\n` +
        `├─ Quality  \`${qualityLabel(ws)}\`\n` +
        `│\n` +
        `├─ **REST API**\n` +
        `├─ Latency  \`${rest}ms\`\n` +
        `└─ Quality  \`${qualityLabel(rest)}\``
      )
    );

    const payload = {
      components: [result],
      flags: MessageFlags.IsComponentsV2,
      ...NO_PING
    };

    if (ctx.isInteraction) {
      await ctx.raw.editReply(payload);
    } else {
      await msg.edit(payload);
    }
  }
};