'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const { isPremium } = require('../../utils/premiumCheck');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the player volume')
    .addIntegerOption((opt) => opt.setName('level').setDescription('Volume level (1-200)').setRequired(true)),
  aliases: ['vol', 'v'],
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

    const level = ctx.isInteraction
      ? ctx.options.getInteger('level')
      : parseInt(ctx.args[0], 10);

    if (isNaN(level) || level < 1) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a valid volume level.')), ephemeral: true });
    }

    const premiumStatus = await isPremium(ctx.user.id, ctx.guild.id, ctx.client);
    const maxVol = premiumStatus.premium ? 200 : 100;

    if (level > maxVol) {
      return await ctx.reply({
        ...v2(errorContainer(`Volume cannot exceed **${maxVol}%**.${!premiumStatus.premium ? ` ${E.premium} Premium users can go up to 200%.` : ''}`)),
        ephemeral: true
      });
    }

    player.volume = level;
    await player.shoukakuPlayer.setFilterVolume(level / 100);

    await ctx.reply(v2(successContainer(`${E.volume} Volume set to **${level}%**`)));
  }
};
