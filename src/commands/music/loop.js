'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { musicContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set the loop mode')
    .addStringOption((opt) => opt.setName('mode').setDescription('Loop mode').setRequired(true)
      .addChoices(
        { name: 'Off', value: 'off' },
        { name: 'Track', value: 'track' },
        { name: 'Queue', value: 'queue' }
      )),
  aliases: ['l', 'lp', 'repeat'],
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

    let mode = ctx.isInteraction
      ? ctx.options.getString('mode')
      : (ctx.args[0] || '').toLowerCase();

    if (!['off', 'track', 'queue'].includes(mode)) {
      const modes = ['off', 'track', 'queue'];
      const currentIndex = modes.indexOf(player.loopMode);
      mode = modes[(currentIndex + 1) % modes.length];
    }

    player.loopMode = mode;

    const modeLabels = { off: 'Disabled', track: 'Track', queue: 'Queue' };
    await ctx.reply(v2(
      musicContainer(`${E.loop} Loop Mode`, `Loop set to: **${modeLabels[mode]}**`)
    ));
  }
};
