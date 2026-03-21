'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2, formatDuration } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

const parseTime = (str) => {
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs)) return null;
    return (mins * 60 + secs) * 1000;
  }
  if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    if (isNaN(hrs) || isNaN(mins) || isNaN(secs)) return null;
    return (hrs * 3600 + mins * 60 + secs) * 1000;
  }
  const seconds = parseInt(str, 10);
  if (isNaN(seconds)) return null;
  return seconds * 1000;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a position in the current track')
    .addStringOption((opt) => opt.setName('time').setDescription('Time to seek to (e.g. 1:23 or 83)').setRequired(true)),
  aliases: ['sk'],
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
    if (!player || !player.current) {
      return await ctx.reply({ ...v2(errorContainer('No music is currently playing.')), ephemeral: true });
    }

    const timeStr = ctx.isInteraction
      ? ctx.options.getString('time')
      : ctx.args[0];

    const ms = parseTime(timeStr);

    if (ms === null || ms < 0) {
      return await ctx.reply({ ...v2(errorContainer('Invalid time format. Use `1:23` or `83` (seconds).')), ephemeral: true });
    }

    if (ms > player.current.info.length) {
      return await ctx.reply({ ...v2(errorContainer(`Cannot seek beyond track duration (\`${formatDuration(player.current.info.length)}\`).`)), ephemeral: true });
    }

    await player.shoukakuPlayer.seekTo(ms);
    player.position = ms;

    await ctx.reply(v2(successContainer(`${E.seek} Seeked to \`${formatDuration(ms)}\``)));
  }
};
