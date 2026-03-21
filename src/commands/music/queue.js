'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { errorContainer, v2 } = require('../../utils/embedBuilder');
const playerManager = require('../../lavalink/playerManager');
const { buildQueueMessage } = require('../../components/queueEmbed');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the music queue')
    .addIntegerOption((opt) => opt.setName('page').setDescription('Page number').setRequired(false)),
  aliases: ['q'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 3,
  execute: async (ctx) => {
    const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
    if (!player || (!player.current && player.queue.length === 0)) {
      return await ctx.reply({ ...v2(errorContainer('The queue is empty.')), ephemeral: true });
    }

    const page = ctx.isInteraction
      ? (ctx.options.getInteger('page') || 1)
      : (parseInt(ctx.args[0], 10) || 1);

    const queueMessage = buildQueueMessage(player.queue, page, player.current);
    await ctx.reply(queueMessage);
  }
};
