'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const { buildSourceMenu } = require('../../components/sourceMenu');
const E = require('../../emoji');

const sourceColors = {
  youtube: 0xff0000,
  soundcloud: 0xff5500,
  spotify: 0x1db954,
  deezer: 0xfeaa2d,
  applemusic: 0xfc3c44
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('source')
    .setDescription('Change the music source for this session')
    .addStringOption((opt) => opt.setName('platform').setDescription('Source platform').setRequired(false)
      .addChoices(
        { name: 'YouTube', value: 'youtube' },
        { name: 'SoundCloud', value: 'soundcloud' },
        { name: 'Spotify', value: 'spotify' },
        { name: 'Deezer', value: 'deezer' },
        { name: 'Apple Music', value: 'applemusic' }
      )),
  aliases: ['src'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 3,
  execute: async (ctx) => {
    if (!checkVC(ctx.member)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in a voice channel.')), ephemeral: true });
    }

    const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
    if (!player) {
      return await ctx.reply({ ...v2(errorContainer('No active player.')), ephemeral: true });
    }

    const platform = ctx.isInteraction
      ? ctx.options.getString('platform')
      : (ctx.args[0] || '').toLowerCase();

    if (!platform) {
      const {
        ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
        SeparatorSpacingSize, MessageFlags
      } = require('discord.js');

      const container = new ContainerBuilder()
        .setAccentColor(sourceColors[player.currentSource || 'youtube'] || 0x5865f2);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${E.source} Select Music Source`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Current source: **${(player.currentSource || 'youtube').charAt(0).toUpperCase() + (player.currentSource || 'youtube').slice(1)}**`)
      );

      const sourceRow = buildSourceMenu(player.currentSource || 'youtube');
      container.addActionRowComponents(sourceRow);

      return await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const validSources = ['youtube', 'soundcloud', 'spotify', 'deezer', 'applemusic'];
    if (!validSources.includes(platform)) {
      return await ctx.reply({ ...v2(errorContainer('Invalid source. Choose from: youtube, soundcloud, spotify, deezer, applemusic')), ephemeral: true });
    }

    const premiumSources = ['spotify', 'deezer', 'applemusic'];
    if (premiumSources.includes(platform)) {
      const { isPremium } = require('../../utils/premiumCheck');
      const premiumStatus = await isPremium(ctx.user.id, ctx.guild.id, ctx.client);
      if (!premiumStatus.premium) {
        return await ctx.reply({
          ...v2(errorContainer(`${E.premium} **${platform.charAt(0).toUpperCase() + platform.slice(1)}** is a premium source. Upgrade to Premium to unlock it!`)),
          ephemeral: true
        });
      }
    }

    player.currentSource = platform;

    const {
      ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
      SeparatorSpacingSize, MessageFlags
    } = require('discord.js');

    const container = new ContainerBuilder()
      .setAccentColor(sourceColors[platform] || 0x5865f2);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.source} Source Changed`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Now using **${platform.charAt(0).toUpperCase() + platform.slice(1)}** as the music source.`)
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
