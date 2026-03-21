'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { musicContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const E = require('../../emoji');

const FILTER_PRESETS = {
  bassboost: { equalizer: [{ band: 0, gain: 0.6 }, { band: 1, gain: 0.7 }, { band: 2, gain: 0.8 }, { band: 3, gain: 0.55 }, { band: 4, gain: 0.25 }] },
  nightcore: { timescale: { speed: 1.3, pitch: 1.3, rate: 1.0 } },
  vaporwave: { timescale: { speed: 0.85, pitch: 0.9, rate: 1.0 }, equalizer: [{ band: 0, gain: 0.3 }, { band: 1, gain: 0.3 }] },
  '8d': { rotation: { rotationHz: 0.2 } },
  earrape: { equalizer: Array.from({ length: 15 }, (_, i) => ({ band: i, gain: 1.0 })) },
  karaoke: { karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 } },
  tremolo: { tremolo: { frequency: 4.0, depth: 0.75 } },
  vibrato: { vibrato: { frequency: 4.0, depth: 0.75 } },
  rotation: { rotation: { rotationHz: 0.5 } },
  off: {}
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filters')
    .setDescription('Apply audio filter presets')
    .addStringOption((opt) => opt.setName('preset').setDescription('Filter preset').setRequired(true)
      .addChoices(
        { name: 'Bass Boost', value: 'bassboost' },
        { name: 'Nightcore', value: 'nightcore' },
        { name: 'Vaporwave', value: 'vaporwave' },
        { name: '8D Audio', value: '8d' },
        { name: 'Earrape', value: 'earrape' },
        { name: 'Karaoke', value: 'karaoke' },
        { name: 'Tremolo', value: 'tremolo' },
        { name: 'Vibrato', value: 'vibrato' },
        { name: 'Rotation', value: 'rotation' },
        { name: 'Off (Reset)', value: 'off' }
      )),
  aliases: ['filter', 'fx'],
  premiumOnly: true,
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

    const preset = ctx.isInteraction
      ? ctx.options.getString('preset')
      : (ctx.args[0] || '').toLowerCase();

    if (!FILTER_PRESETS[preset]) {
      const available = Object.keys(FILTER_PRESETS).join(', ');
      return await ctx.reply({ ...v2(errorContainer(`Invalid preset. Available: ${available}`)), ephemeral: true });
    }

    const filterData = FILTER_PRESETS[preset];

    try {
      await player.shoukakuPlayer.setFilters(filterData);
      player.activeFilter = preset === 'off' ? null : preset;
    } catch (err) {
      return await ctx.reply({ ...v2(errorContainer(`Failed to apply filter: ${err.message}`)), ephemeral: true });
    }

    if (preset === 'off') {
      await ctx.reply(v2(musicContainer(`${E.filters} Filters Reset`, 'All audio filters have been removed.')));
    } else {
      await ctx.reply(v2(
        musicContainer(`${E.filters} Filter Applied`, `Applied **${preset}** filter preset.`)
      ));
    }
  }
};
