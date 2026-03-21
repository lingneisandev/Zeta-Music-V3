'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const devLogger = require('../../utils/devLogger');
const { clearGuildBanCache } = require('../../utils/blacklistCheck');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildunban')
    .setDescription('Unban a guild')
    .addStringOption((opt) => opt.setName('id').setDescription('Guild ID').setRequired(true)),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const guildId = ctx.isInteraction ? ctx.options.getString('id') : ctx.args[0];

    if (!guildId) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a guild ID.')), ephemeral: true });
    }

    await Guild.findOneAndUpdate(
      { guildId },
      { isBlacklisted: false, blacklistReason: null }
    );

    clearGuildBanCache(guildId);
    await devLogger.sendGuildUnban(guildId, ctx.user.tag);

    await ctx.reply({
      ...v2(successContainer(`${E.unban} Guild \`${guildId}\` has been unbanned.`)),
      ephemeral: true
    });
  }
};
