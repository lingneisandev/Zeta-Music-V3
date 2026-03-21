'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { errorContainer, v2, COLORS } = require('../../utils/embedBuilder');
const { filterContent } = require('../../utils/mentionFilter');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildlist')
    .setDescription('List all guilds the bot is in')
    .addIntegerOption((opt) => opt.setName('page').setDescription('Page number').setRequired(false)),
  aliases: ['gl'],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const guilds = [...ctx.client.guilds.cache.values()];
    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(guilds.length / perPage));

    let page = ctx.isInteraction
      ? (ctx.options.getInteger('page') || 1)
      : (parseInt(ctx.args[0], 10) || 1);

    page = Math.max(1, Math.min(page, totalPages));
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, guilds.length);

    const container = new ContainerBuilder()
      .setAccentColor(COLORS.info);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.guilds} Guild List`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    let listText = '';
    for (let i = start; i < end; i++) {
      const g = guilds[i];
      listText += `\`${i + 1}.\` **${filterContent(g.name)}** (\`${g.id}\`)\n`;
      listText += `${E.arrow} Members: ${g.memberCount}\n`;
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(listText || 'No guilds')
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Page ${page}/${totalPages} ${E.dot} ${guilds.length} total guilds`)
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
  }
};
