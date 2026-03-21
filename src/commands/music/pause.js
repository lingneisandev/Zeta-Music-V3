'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current track'),
  aliases: ['pa'],
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
    if (!player || !player.current) {
      return await ctx.reply({ ...v2(errorContainer('No music is currently playing.')), ephemeral: true });
    }

    if (player.shoukakuPlayer.paused) {
      return await ctx.reply({ ...v2(errorContainer('The player is already paused.')), ephemeral: true });
    }

    await player.shoukakuPlayer.setPaused(true);
    await ctx.reply(v2(successContainer(`${E.pause} Paused the current track.`)));
  }
};
