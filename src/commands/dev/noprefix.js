'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2, musicContainer } = require('../../utils/embedBuilder');
const NoPrefix = require('../../models/NoPrefix');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('noprefix')
    .setDescription('Grant or revoke no-prefix status for a user')
    .addSubcommand((sub) => sub.setName('grant').setDescription('Grant no-prefix status')
      .addStringOption((opt) => opt.setName('user').setDescription('User ID or Mention').setRequired(true))
      .addIntegerOption((opt) => opt.setName('days').setDescription('Duration in days (0 = lifetime)').setRequired(true)))
    .addSubcommand((sub) => sub.setName('revoke').setDescription('Revoke no-prefix status')
      .addStringOption((opt) => opt.setName('user').setDescription('User ID or Mention').setRequired(true))),
  aliases: ['np'],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const subcommand = ctx.isInteraction
      ? ctx.options.getSubcommand()
      : (ctx.args[0] || '').toLowerCase();

    if (subcommand === 'grant') {
      let userId = ctx.isInteraction ? ctx.options.getString('user') : ctx.args[1];
      const days = ctx.isInteraction ? ctx.options.getInteger('days') : parseInt(ctx.args[2], 10);

      if (!userId) {
        return await ctx.reply({ ...v2(errorContainer('Please provide a user ID or mention.')), ephemeral: true });
      }

      userId = userId.replace(/[<@!>]/g, '');

      if (isNaN(days)) {
        return await ctx.reply({ ...v2(errorContainer('Please provide a valid duration in days.')), ephemeral: true });
      }

      const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

      await NoPrefix.findOneAndUpdate(
        { userId },
        {
          userId,
          expiresAt,
          isLifetime: days <= 0,
          grantedBy: ctx.user.id
        },
        { upsert: true, new: true }
      );

      // DM User
      try {
        const user = await ctx.client.users.fetch(userId);
        if (user) {
          const dmEmbed = musicContainer(
            `${E.check} No-Prefix Granted`,
            `You have been granted **No-Prefix** status!\n\n` +
            `Now you can use bot commands without any prefix.\n` +
            `**Duration**: ${days > 0 ? `${days} Days` : 'Lifetime'}\n` +
            `**Expires**: ${expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Never'}`
          );
          await user.send({ ...v2(dmEmbed) }).catch(() => {});
        }
      } catch (_) {}

      await ctx.reply({
        ...v2(successContainer(`No-prefix granted to <@${userId}> for ${days > 0 ? `${days} days` : 'lifetime'}.`)),
        ephemeral: true
      });
    } else if (subcommand === 'revoke' || subcommand === 'remove') {
      let userId = ctx.isInteraction ? ctx.options.getString('user') : ctx.args[1];

      if (!userId) {
        return await ctx.reply({ ...v2(errorContainer('Please provide a user ID or mention.')), ephemeral: true });
      }

      userId = userId.replace(/[<@!>]/g, '');

      const deleted = await NoPrefix.findOneAndDelete({ userId });

      if (deleted) {
        // DM User
        try {
          const user = await ctx.client.users.fetch(userId);
          if (user) {
            const dmEmbed = musicContainer(
              `${E.cross} No-Prefix Revoked`,
              `Your **No-Prefix** status has been revoked by an administrator.`
            );
            await user.send({ ...v2(dmEmbed) }).catch(() => {});
          }
        } catch (_) {}

        await ctx.reply({
          ...v2(successContainer(`No-prefix status revoked from <@${userId}>.`)),
          ephemeral: true
        });
      } else {
        await ctx.reply({
          ...v2(errorContainer(`<@${userId}> does not have no-prefix status.`)),
          ephemeral: true
        });
      }
    } else {
      await ctx.reply({ ...v2(errorContainer('Use `grant` or `revoke` subcommand.')), ephemeral: true });
    }
  }
};
