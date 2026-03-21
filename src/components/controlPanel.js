'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const E = require('../emoji');

const buildControlPanel = (player) => {
  const isPaused = player?.shoukakuPlayer?.paused;
  const isLooping = player?.loopMode && player.loopMode !== 'off';

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('previous_track')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('play_pause')
      .setLabel(isPaused ? 'Resume' : 'Pause')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('stop_player')
      .setLabel('Stop')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('loop_toggle')
      .setLabel('Loop')
      .setStyle(isLooping ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('shuffle_queue')
      .setLabel('Shuffle')
      .setStyle(ButtonStyle.Secondary)
  );
};

module.exports = { buildControlPanel };
