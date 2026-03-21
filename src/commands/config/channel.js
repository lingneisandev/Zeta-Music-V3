'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel')
    .setDescription('Lock or unlock music commands to a specific channel')
    .addSubcommand((sub) => sub.setName('lock').setDescription('Lock music to a channel')
      .addChannelOption((opt) => opt.setName('channel').setDescription('Text channel').setRequired(true)))
    .addSubcommand((sub) => sub.setName('unlock').setDescription('Unlock music from channel restriction')),
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
      : (ctx.args[0] || 'lock').toLowerCase();

    if (subcommand === 'unlock') {
      await Guild.findOneAndUpdate(
        { guildId: ctx.guild.id },
        { musicChannelId: null },
        { upsert: true }
      );
      return await ctx.reply(v2(successContainer(`${E.check} Music commands unlocked from channel restriction.`)));
    }

    let channelId = null;

    if (ctx.isInteraction) {
      const channel = ctx.options.getChannel('channel');
      channelId = channel?.id;
    } else {
      const mention = ctx.args[1];
      if (mention) {
        const match = mention.match(/^<#(\d+)>$/) || [null, mention];
        channelId = match[1];
      }
    }

    if (!channelId) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a valid channel.')), ephemeral: true });
    }

    const channel = ctx.guild.channels.cache.get(channelId);
    if (!channel) {
      return await ctx.reply({ ...v2(errorContainer('Channel not found.')), ephemeral: true });
    }

    await Guild.findOneAndUpdate(
      { guildId: ctx.guild.id },
      { guildId: ctx.guild.id, musicChannelId: channelId },
      { upsert: true }
    );

    await ctx.reply(v2(successContainer(`${E.check} Music commands locked to <#${channelId}>`)));
  }
};
