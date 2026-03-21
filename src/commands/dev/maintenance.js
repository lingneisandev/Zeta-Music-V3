'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const config = require('../../config');
const devLogger = require('../../utils/devLogger');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Toggle maintenance mode')
    .addBooleanOption((opt) => opt.setName('state').setDescription('Enable or disable').setRequired(true)),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const state = ctx.isInteraction
      ? ctx.options.getBoolean('state')
      : ctx.args[0] === 'true' || ctx.args[0] === 'on';

    config.maintenanceMode = state;

    await devLogger.sendMaintenance(state, ctx.user.tag);

    await ctx.reply({
      ...v2(successContainer(
        `${E.maintenance} Maintenance mode **${state ? 'enabled' : 'disabled'}**`
      )),
      ephemeral: true
    });
  }
};
