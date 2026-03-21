'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the queue'),
  aliases: ['sh'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 3,
  execute: async (ctx) => {
    if (!checkVC(ctx.member)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in a voice channel.')), ephemeral: true });
    }
    if (!checkSameVC(ctx.member, ctx.client)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in the same voice channel as the bot.')), ephemeral: true });
    }

    const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
    if (!player || player.queue.length < 2) {
      return await ctx.reply({ ...v2(errorContainer('Not enough tracks in the queue to shuffle.')), ephemeral: true });
    }

    for (let i = player.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
    }

    await ctx.reply(v2(successContainer(`${E.shuffle} Shuffled **${player.queue.length}** tracks.`)));
  }
};
