'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const UserBan = require('../../models/UserBan');
const devLogger = require('../../utils/devLogger');
const { clearUserBanCache } = require('../../utils/blacklistCheck');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userban')
    .setDescription('Ban a user from using the bot')
    .addStringOption((opt) => opt.setName('id').setDescription('User ID').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Ban reason').setRequired(true)),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const userId = ctx.isInteraction ? ctx.options.getString('id') : ctx.args[0];
    const reason = ctx.isInteraction ? ctx.options.getString('reason') : ctx.args.slice(1).join(' ');

    if (!userId) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a user ID.')), ephemeral: true });
    }

    await UserBan.findOneAndUpdate(
      { userId },
      { userId, reason: reason || 'No reason', bannedBy: ctx.user.id },
      { upsert: true }
    );

    clearUserBanCache(userId);
    await devLogger.sendUserBan(userId, reason || 'No reason', ctx.user.tag);

    await ctx.reply({
      ...v2(successContainer(`${E.ban} User \`${userId}\` has been banned. Reason: ${reason || 'No reason'}`)),
      ephemeral: true
    });
  }
};
