'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { COLORS } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('View all current server settings'),
  aliases: ['config'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    let guildDoc = await Guild.findOne({ guildId: ctx.guild.id });
    if (!guildDoc) {
      guildDoc = {
        prefix: config.defaultPrefix,
        djRoleId: null,
        musicChannelId: null,
        language: 'en',
        isPremium: false,
        settings: {
          defaultVolume: config.defaultVolume,
          autoplay: false,
          announceNowPlaying: true,
          defaultSource: 'youtube'
        }
      };
    }

    const djRole = guildDoc.djRoleId ? `<@&${guildDoc.djRoleId}>` : 'None';
    const musicChannel = guildDoc.musicChannelId ? `<#${guildDoc.musicChannelId}>` : 'All channels';
    const langNames = { en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German' };

    const container = new ContainerBuilder()
      .setAccentColor(COLORS.info);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.cmds} Server Settings`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.prefix} **Prefix:** \`${guildDoc.prefix || config.defaultPrefix}\`\n` +
        `${E.dj} **DJ Role:** ${djRole}\n` +
        `${E.music} **Music Channel:** ${musicChannel}\n` +
        `${E.info} **Language:** ${langNames[guildDoc.language] || 'English'}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.premium} **Premium:** ${guildDoc.isPremium ? `${E.check} Active` : `${E.cross} Inactive`}\n` +
        `${E.volume} **Default Volume:** ${guildDoc.settings?.defaultVolume || config.defaultVolume}%\n` +
        `${E.autoplay} **Autoplay:** ${guildDoc.settings?.autoplay ? 'Enabled' : 'Disabled'}\n` +
        `${E.play} **Announce Now Playing:** ${guildDoc.settings?.announceNowPlaying !== false ? 'Yes' : 'No'}\n` +
        `${E.source} **Default Source:** ${(guildDoc.settings?.defaultSource || 'youtube').charAt(0).toUpperCase() + (guildDoc.settings?.defaultSource || 'youtube').slice(1)}`
      )
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
