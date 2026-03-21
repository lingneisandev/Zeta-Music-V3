'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { errorContainer, v2 } = require('../../utils/embedBuilder');
const playerManager = require('../../lavalink/playerManager');
const { buildPlayerCard } = require('../../components/playerCard');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing track'),
  aliases: ['np', 'now'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 3,
  execute: async (ctx) => {
    const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
    if (!player || !player.current) {
      return await ctx.reply({ ...v2(errorContainer('No music is currently playing.')), ephemeral: true });
    }

    const requester = player.current.requester || ctx.user;
    const cardMessage = await buildPlayerCard(player.current, player, requester);
    await ctx.reply(cardMessage);
  }
};
