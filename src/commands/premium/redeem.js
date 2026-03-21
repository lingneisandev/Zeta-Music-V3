'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, premiumContainer, v2 } = require('../../utils/embedBuilder');
const PremiumKey = require('../../models/PremiumKey');
const Premium = require('../../models/Premium');
const { clearCache } = require('../../utils/premiumCheck');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a premium key')
    .addStringOption((opt) => opt.setName('key').setDescription('Premium key to redeem').setRequired(true)),
  aliases: [],
  premiumOnly: false,
  djOnly: false,
  cooldown: 10,
  execute: async (ctx) => {
    const key = ctx.isInteraction
      ? ctx.options.getString('key')
      : ctx.args[0];

    if (!key) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a premium key.')), ephemeral: true });
    }

    const keyDoc = await PremiumKey.findOne({ key: key.trim(), isUsed: false });

    if (!keyDoc) {
      return await ctx.reply({ ...v2(errorContainer(`${E.key} Invalid or already used key.`)), ephemeral: true });
    }

    const expiresAt = keyDoc.durationDays > 0
      ? new Date(Date.now() + keyDoc.durationDays * 24 * 60 * 60 * 1000)
      : null;

    await Premium.findOneAndUpdate(
      { userId: ctx.user.id },
      {
        userId: ctx.user.id,
        guildId: keyDoc.tier === 'guild' ? ctx.guild.id : null,
        tier: keyDoc.tier,
        expiresAt,
        isLifetime: keyDoc.durationDays <= 0,
        redeemedKey: key.trim(),
        grantedBy: 'key'
      },
      { upsert: true, new: true }
    );

    keyDoc.isUsed = true;
    keyDoc.usedBy = ctx.user.id;
    keyDoc.usedAt = new Date();
    await keyDoc.save();

    clearCache(ctx.user.id);

    const expiryText = expiresAt
      ? `Expires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`
      : 'Lifetime';

    await ctx.reply({
      ...v2(premiumContainer(
        `${E.premium} Premium Activated!\n\n` +
        `**Tier:** ${keyDoc.tier}\n` +
        `**${expiryText}**\n\n` +
        `Thank you for supporting Mizuki!`
      )),
      ephemeral: true
    });
  }
};
