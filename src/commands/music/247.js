'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2, musicContainer } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const { isPremium } = require('../../utils/premiumCheck');
const { checkDJ } = require('../../utils/permissions');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Toggle 24/7 mode (Bot stays in VC after music ends)'),
  aliases: ['24-7', 'stay'],
  premiumOnly: false,
  djOnly: true,
  cooldown: 5,
  execute: async (ctx) => {
    const { guild, client } = ctx;
    
    let guildDoc = null;
    try {
      guildDoc = await Guild.findOne({ guildId: guild.id });
      if (!guildDoc) {
        guildDoc = await Guild.create({ guildId: guild.id });
      }
    } catch (_) { }

    const currentState = guildDoc.settings?.stayInVC ?? false;
    const newState = !currentState;

    await Guild.findOneAndUpdate(
      { guildId: guild.id },
      { $set: { 'settings.stayInVC': newState } }
    );

    // Update player data if active
    const player = client.players.get(guild.id);
    if (player) {
      player.stayInVC = newState;
    }

    await ctx.reply({
      ...v2(successContainer(`${E.autoplay} 24/7 mode has been **${newState ? 'Enabled' : 'Disabled'}**.`)),
      ephemeral: true
    });
  }
};
