'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const devLogger = require('../../utils/devLogger');
const { clearGuildBanCache } = require('../../utils/blacklistCheck');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildban')
    .setDescription('Ban a guild from using the bot')
    .addStringOption((opt) => opt.setName('id').setDescription('Guild ID').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Ban reason').setRequired(true)),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const guildId = ctx.isInteraction ? ctx.options.getString('id') : ctx.args[0];
    const reason = ctx.isInteraction ? ctx.options.getString('reason') : ctx.args.slice(1).join(' ');

    if (!guildId) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a guild ID.')), ephemeral: true });
    }

    await Guild.findOneAndUpdate(
      { guildId },
      { guildId, isBlacklisted: true, blacklistReason: reason || 'No reason' },
      { upsert: true }
    );

    clearGuildBanCache(guildId);

    try {
      const guild = ctx.client.guilds.cache.get(guildId);
      if (guild) {
        await guild.leave();
      }
    } catch (_) {}

    await devLogger.sendGuildBan(guildId, reason || 'No reason', ctx.user.tag);

    await ctx.reply({
      ...v2(successContainer(`${E.ban} Guild \`${guildId}\` has been banned. Reason: ${reason || 'No reason'}`)),
      ephemeral: true
    });
  }
};
