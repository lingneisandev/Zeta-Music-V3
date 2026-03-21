'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const { filterContent } = require('../../utils/mentionFilter');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Move a track to a different position in the queue')
    .addIntegerOption((opt) => opt.setName('from').setDescription('Current position').setRequired(true))
    .addIntegerOption((opt) => opt.setName('to').setDescription('New position').setRequired(true)),
  aliases: ['mv'],
  premiumOnly: false,
  djOnly: true,
  cooldown: 2,
  execute: async (ctx) => {
    if (!checkVC(ctx.member)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in a voice channel.')), ephemeral: true });
    }
    if (!checkSameVC(ctx.member, ctx.client)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in the same voice channel as the bot.')), ephemeral: true });
    }

    const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
    if (!player || player.queue.length < 2) {
      return await ctx.reply({ ...v2(errorContainer('Not enough tracks in the queue to move.')), ephemeral: true });
    }

    const from = ctx.isInteraction
      ? ctx.options.getInteger('from')
      : parseInt(ctx.args[0], 10);

    const to = ctx.isInteraction
      ? ctx.options.getInteger('to')
      : parseInt(ctx.args[1], 10);

    if (isNaN(from) || isNaN(to) || from < 1 || to < 1 || from > player.queue.length || to > player.queue.length) {
      return await ctx.reply({ ...v2(errorContainer(`Invalid positions. Use numbers between 1 and ${player.queue.length}.`)), ephemeral: true });
    }

    if (from === to) {
      return await ctx.reply({ ...v2(errorContainer('Source and destination positions are the same.')), ephemeral: true });
    }

    const [track] = player.queue.splice(from - 1, 1);
    player.queue.splice(to - 1, 0, track);

    await ctx.reply(v2(
      successContainer(`${E.move} Moved **${filterContent(track.info.title)}** from position \`#${from}\` to \`#${to}\``)
    ));
  }
};
