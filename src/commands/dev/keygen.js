'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, devContainer, v2 } = require('../../utils/embedBuilder');
const PremiumKey = require('../../models/PremiumKey');
const crypto = require('crypto');
const E = require('../../emoji');

const generateKey = () => {
  const segment = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TITAN-${segment()}-${segment()}-${segment()}`;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keygen')
    .setDescription('Generate premium keys')
    .addIntegerOption((opt) => opt.setName('amount').setDescription('Number of keys (1-50)').setRequired(true))
    .addStringOption((opt) => opt.setName('tier').setDescription('Premium tier').setRequired(true)
      .addChoices(
        { name: 'User', value: 'user' },
        { name: 'Guild', value: 'guild' }
      ))
    .addIntegerOption((opt) => opt.setName('days').setDescription('Duration in days (0 = lifetime)').setRequired(true)),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 10,
  execute: async (ctx) => {
    const amount = ctx.isInteraction
      ? ctx.options.getInteger('amount')
      : parseInt(ctx.args[0], 10);

    const tier = ctx.isInteraction
      ? ctx.options.getString('tier')
      : (ctx.args[1] || 'user');

    const days = ctx.isInteraction
      ? ctx.options.getInteger('days')
      : parseInt(ctx.args[2], 10);

    if (!amount || amount < 1 || amount > 50) {
      return await ctx.reply({ ...v2(errorContainer('Amount must be between 1 and 50.')), ephemeral: true });
    }

    if (isNaN(days) || days < 0) {
      return await ctx.reply({ ...v2(errorContainer('Days must be 0 or greater.')), ephemeral: true });
    }

    const keys = [];
    const docs = [];

    for (let i = 0; i < amount; i++) {
      const key = generateKey();
      keys.push(key);
      docs.push({
        key,
        tier,
        durationDays: days,
        generatedBy: ctx.user.id
      });
    }

    await PremiumKey.insertMany(docs);

    const keyList = keys.map((k) => `\`${k}\``).join('\n');

    await ctx.reply({
      ...v2(devContainer(
        `${E.key} Generated ${amount} Key(s)`,
        `**Tier:** ${tier}\n**Duration:** ${days > 0 ? `${days} days` : 'Lifetime'}\n\n${keyList}`
      )),
      ephemeral: true
    });
  }
};
