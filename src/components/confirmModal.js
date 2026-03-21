'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const buildConfirmRow = (action) => {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_yes_${action}`)
      .setLabel('Yes')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`confirm_no_${action}`)
      .setLabel('No')
      .setStyle(ButtonStyle.Secondary)
  );

  return row;
};

module.exports = { buildConfirmRow };
