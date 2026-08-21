'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const { filterContent } = require('../../utils/mentionFilter');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue')
    .addIntegerOption((opt) => opt.setName('position').setDescription('Position of the track to remove').setRequired(true)),
  aliases: ['rm', 'del'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 2,
  execute: async (ctx) => {
    if (!checkVC(ctx.member)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in a voice channel.')), ephemeral: true });
    }
    if (!checkSameVC(ctx.member, ctx.client)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in the same voice channel as the bot.')), ephemeral: true });
    }

    const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
    if (!player || player.queue.length === 0) {
      return await ctx.reply({ ...v2(errorContainer('The queue is empty.')), ephemeral: true });
    }

    const position = ctx.isInteraction
      ? ctx.options.getInteger('position')
      : parseInt(ctx.args[0], 10);

    if (isNaN(position) || position < 1 || position > player.queue.length) {
      return await ctx.reply({ ...v2(errorContainer(`Invalid position. Use a number between 1 and ${player.queue.length}.`)), ephemeral: true });
    }

    const removed = player.queue.splice(position - 1, 1)[0];

    await ctx.reply(v2(
      successContainer(`${E.remove} Removed **${filterContent(removed.info.title)}** from position \`#${position}\``)
    ));
  }
};
