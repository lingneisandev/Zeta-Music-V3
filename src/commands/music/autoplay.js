'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, musicContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay - automatically play related tracks'),
  aliases: ['ap'],
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
    if (!player) {
      return await ctx.reply({ ...v2(errorContainer('No active player.')), ephemeral: true });
    }

    player.autoplay = !player.autoplay;

    await ctx.reply(v2(
      musicContainer(
        `${E.autoplay} Autoplay`,
        `Autoplay is now **${player.autoplay ? 'enabled' : 'disabled'}**`
      )
    ));
  }
};
