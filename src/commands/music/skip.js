'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const { filterContent } = require('../../utils/mentionFilter');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track or multiple tracks')
    .addIntegerOption((opt) => opt.setName('amount').setDescription('Number of tracks to skip').setRequired(false)),
  aliases: ['s', 'fs'],
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
    if (!player || !player.current) {
      return await ctx.reply({ ...v2(errorContainer('No music is currently playing.')), ephemeral: true });
    }

    const amount = ctx.isInteraction
      ? (ctx.options.getInteger('amount') || 1)
      : (parseInt(ctx.args[0], 10) || 1);

    const skipped = [];
    skipped.push(player.current.info.title);

    if (amount > 1) {
      const toRemove = Math.min(amount - 1, player.queue.length);
      for (let i = 0; i < toRemove; i++) {
        skipped.push(player.queue.shift().info.title);
      }
    }

    await player.shoukakuPlayer.stopTrack();

    await ctx.reply(v2(
      successContainer(
        `${E.skip} Skipped **${skipped.length}** track(s)\n${E.arrow} ${filterContent(skipped[0])}`
      )
    ));
  }
};
