'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successContainer, errorContainer, musicContainer, v2 } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Set or reset the server prefix')
    .addSubcommand((sub) => sub.setName('set').setDescription('Set a new prefix')
      .addStringOption((opt) => opt.setName('new').setDescription('New prefix (max 5 chars)').setRequired(true)))
    .addSubcommand((sub) => sub.setName('reset').setDescription('Reset prefix to default')),
  aliases: [],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return await ctx.reply({ ...v2(errorContainer('You need the **Manage Server** permission.')), ephemeral: true });
    }

    const subcommand = ctx.isInteraction
      ? ctx.options.getSubcommand()
      : (ctx.args[0] || 'set').toLowerCase();

    if (subcommand === 'reset') {
      await Guild.findOneAndUpdate(
        { guildId: ctx.guild.id },
        { prefix: config.defaultPrefix },
        { upsert: true }
      );
      return await ctx.reply(v2(
        successContainer(`${E.prefix} Prefix reset to \`${config.defaultPrefix}\``)
      ));
    }

    const newPrefix = ctx.isInteraction
      ? ctx.options.getString('new')
      : ctx.args[1];

    if (!newPrefix) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a new prefix.')), ephemeral: true });
    }

    if (newPrefix.length > 5) {
      return await ctx.reply({ ...v2(errorContainer('Prefix cannot be longer than 5 characters.')), ephemeral: true });
    }

    await Guild.findOneAndUpdate(
      { guildId: ctx.guild.id },
      { guildId: ctx.guild.id, prefix: newPrefix },
      { upsert: true }
    );

    await ctx.reply(v2(
      successContainer(`${E.prefix} Prefix set to \`${newPrefix}\``)
    ));
  }
};
