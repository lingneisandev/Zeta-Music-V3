'use strict';

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const E = require('../emoji');

const buildSourceMenu = (current) => {
  const options = [
    { label: 'YouTube', value: 'youtube', emoji: E.play, description: 'Search YouTube' },
    { label: 'SoundCloud', value: 'soundcloud', emoji: E.music, description: 'Search SoundCloud' },
    { label: 'Spotify (Premium)', value: 'spotify', emoji: E.premium, description: 'Search Spotify' },
    { label: 'Deezer (Premium)', value: 'deezer', emoji: E.premium, description: 'Search Deezer' },
    { label: 'Apple Music (Premium)', value: 'applemusic', emoji: E.premium, description: 'Search Apple Music' }
  ].map((opt) => ({
    ...opt,
    default: opt.value === (current || 'youtube')
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('source_select')
      .setPlaceholder(`${E.source} Select Music Source`)
      .addOptions(options)
  );

  return row;
};

module.exports = { buildSourceMenu };
