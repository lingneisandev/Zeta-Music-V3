'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ChannelType } = require('discord.js');
const { COLORS } = require('../../utils/embedBuilder');
const { filterContent } = require('../../utils/mentionFilter');
const Guild = require('../../models/Guild');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show server information'),
  aliases: ['si', 'server'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const guild = ctx.guild;

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
    const roleCount = guild.roles.cache.size;

    let owner = null;
    try {
      owner = await guild.fetchOwner();
    } catch (_) {}

    let guildDoc = null;
    try {
      guildDoc = await Guild.findOne({ guildId: guild.id });
    } catch (_) {}

    const boostLevel = guild.premiumTier;
    const boostLabels = ['None', 'Level 1', 'Level 2', 'Level 3'];

    const container = new ContainerBuilder()
      .setAccentColor(COLORS.info);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.guilds} ${filterContent(guild.name)}`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.info} **ID:** \`${guild.id}\`\n` +
        `${E.crown} **Owner:** ${owner ? owner.user.tag : 'Unknown'}\n` +
        `${E.info} **Created:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:R>\n` +
        `${E.info} **Members:** ${guild.memberCount}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.info} **Text Channels:** ${textChannels}\n` +
        `${E.info} **Voice Channels:** ${voiceChannels}\n` +
        `${E.info} **Categories:** ${categories}\n` +
        `${E.info} **Roles:** ${roleCount}\n` +
        `${E.star} **Boost Level:** ${boostLabels[boostLevel] || 'None'}\n` +
        `${E.premium} **Premium:** ${guildDoc?.isPremium ? `${E.check} Active` : `${E.cross} Inactive`}`
      )
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
