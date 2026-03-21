'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { errorContainer, v2, COLORS } = require('../../utils/embedBuilder');
const { filterContent } = require('../../utils/mentionFilter');
const playerManager = require('../../lavalink/playerManager');
const axios = require('axios');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Get lyrics for the current or specified song')
    .addStringOption((opt) => opt.setName('query').setDescription('Song name to search lyrics for').setRequired(false)),
  aliases: ['ly'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    let query = ctx.isInteraction
      ? ctx.options.getString('query')
      : ctx.args.join(' ');

    if (!query) {
      const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
      if (!player || !player.current) {
        return await ctx.reply({ ...v2(errorContainer('No music is playing and no query was provided.')), ephemeral: true });
      }
      query = `${player.current.info.title} ${player.current.info.author}`;
    }

    const safeQuery = filterContent(query);

    let lyrics = '';
    try {
      const titleParts = safeQuery.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim().split(' - ');
      const artist = titleParts.length > 1 ? titleParts[0].trim() : safeQuery.split(' ')[0];
      const title = titleParts.length > 1 ? titleParts[1].trim() : safeQuery;

      const response = await axios.get(`https://lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, { timeout: 10000 });
      lyrics = response.data.lyrics;
    } catch (_) {
      try {
        const response = await axios.get(`https://lyrics.ovh/v1/${encodeURIComponent(safeQuery)}/`, { timeout: 10000 });
        lyrics = response.data.lyrics;
      } catch (__) {
        return await ctx.reply({ ...v2(errorContainer(`${E.lyrics} No lyrics found for \`${safeQuery}\``)), ephemeral: true });
      }
    }

    if (!lyrics) {
      return await ctx.reply({ ...v2(errorContainer(`${E.lyrics} No lyrics found for \`${safeQuery}\``)), ephemeral: true });
    }

    const cleanLyrics = filterContent(lyrics);

    if (cleanLyrics.length <= 2000) {
      const container = new ContainerBuilder()
        .setAccentColor(COLORS.music);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${E.lyrics} Lyrics`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${safeQuery}**`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(cleanLyrics)
      );

      await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } else {
      const chunks = [];
      let remaining = cleanLyrics;
      while (remaining.length > 0) {
        chunks.push(remaining.substring(0, 1900));
        remaining = remaining.substring(1900);
      }

      const firstContainer = new ContainerBuilder()
        .setAccentColor(COLORS.music);

      firstContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${E.lyrics} Lyrics - ${safeQuery}`)
      );
      firstContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      firstContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(chunks[0])
      );
      firstContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Page 1/${chunks.length}*`)
      );

      await ctx.reply({ components: [firstContainer], flags: MessageFlags.IsComponentsV2 });

      for (let i = 1; i < chunks.length; i++) {
        const pageContainer = new ContainerBuilder()
          .setAccentColor(COLORS.music);

        pageContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(chunks[i])
        );
        pageContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`*Page ${i + 1}/${chunks.length}*`)
        );

        await ctx.followUp({ components: [pageContainer], flags: MessageFlags.IsComponentsV2 });
      }
    }
  }
};
