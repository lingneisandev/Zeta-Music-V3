'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dj')
    .setDescription('Set or remove the DJ role')
    .addSubcommand((sub) => sub.setName('set').setDescription('Set DJ role')
      .addRoleOption((opt) => opt.setName('role').setDescription('DJ role').setRequired(true)))
    .addSubcommand((sub) => sub.setName('remove').setDescription('Remove DJ role restriction')),
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

    if (subcommand === 'remove') {
      await Guild.findOneAndUpdate(
        { guildId: ctx.guild.id },
        { djRoleId: null },
        { upsert: true }
      );
      return await ctx.reply(v2(successContainer(`${E.dj} DJ role restriction removed.`)));
    }

    let roleId = null;

    if (ctx.isInteraction) {
      const role = ctx.options.getRole('role');
      roleId = role?.id;
    } else {
      const mention = ctx.args[1];
      if (mention) {
        const match = mention.match(/^<@&(\d+)>$/) || [null, mention];
        roleId = match[1];
      }
    }

    if (!roleId) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a valid role.')), ephemeral: true });
    }

    const role = ctx.guild.roles.cache.get(roleId);
    if (!role) {
      return await ctx.reply({ ...v2(errorContainer('Role not found.')), ephemeral: true });
    }

    await Guild.findOneAndUpdate(
      { guildId: ctx.guild.id },
      { guildId: ctx.guild.id, djRoleId: roleId },
      { upsert: true }
    );

    await ctx.reply(v2(successContainer(`${E.dj} DJ role set to **${role.name}**`)));
  }
};
