'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const Premium = require('../../models/Premium');
const devLogger = require('../../utils/devLogger');
const { clearCache } = require('../../utils/premiumCheck');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devpremium')
    .setDescription('Grant or revoke premium for a user')
    .addSubcommand((sub) => sub.setName('grant').setDescription('Grant premium')
      .addStringOption((opt) => opt.setName('id').setDescription('User ID').setRequired(true))
      .addIntegerOption((opt) => opt.setName('days').setDescription('Duration in days (0 = lifetime)').setRequired(true)))
    .addSubcommand((sub) => sub.setName('revoke').setDescription('Revoke premium')
      .addStringOption((opt) => opt.setName('id').setDescription('User ID').setRequired(true))),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const subcommand = ctx.isInteraction
      ? ctx.options.getSubcommand()
      : (ctx.args[0] || '').toLowerCase();

    if (subcommand === 'grant') {
      const userId = ctx.isInteraction ? ctx.options.getString('id') : ctx.args[1];
      const days = ctx.isInteraction ? ctx.options.getInteger('days') : parseInt(ctx.args[2], 10);

      if (!userId) {
        return await ctx.reply({ ...v2(errorContainer('Please provide a user ID.')), ephemeral: true });
      }

      const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

      await Premium.findOneAndUpdate(
        { userId },
        {
          userId,
          tier: 'user',
          expiresAt,
          isLifetime: days <= 0,
          grantedBy: 'dev'
        },
        { upsert: true, new: true }
      );

      clearCache(userId);
      await devLogger.sendPremiumGrant(userId, days, ctx.user.tag);

      await ctx.reply({
        ...v2(successContainer(`${E.premium} Premium granted to \`${userId}\` for ${days > 0 ? `${days} days` : 'lifetime'}`)),
        ephemeral: true
      });
    } else if (subcommand === 'revoke') {
      const userId = ctx.isInteraction ? ctx.options.getString('id') : ctx.args[1];

      if (!userId) {
        return await ctx.reply({ ...v2(errorContainer('Please provide a user ID.')), ephemeral: true });
      }

      await Premium.deleteOne({ userId });
      clearCache(userId);
      await devLogger.sendPremiumRevoke(userId, ctx.user.tag);

      await ctx.reply({
        ...v2(successContainer(`${E.premium} Premium revoked from \`${userId}\``)),
        ephemeral: true
      });
    } else {
      await ctx.reply({ ...v2(errorContainer('Use `grant` or `revoke` subcommand.')), ephemeral: true });
    }
  }
};
