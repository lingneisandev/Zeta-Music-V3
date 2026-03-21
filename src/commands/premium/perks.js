'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { COLORS } = require('../../utils/embedBuilder');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perks')
    .setDescription('View free vs premium feature comparison'),
  aliases: [],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const container = new ContainerBuilder()
      .setAccentColor(COLORS.premium);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.crown} Free vs Premium`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${E.music} Music Sources**\n` +
        `Free: YouTube, SoundCloud\n` +
        `${E.premium} Premium: + Spotify, Deezer, Apple Music\n`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${E.volume} Volume**\n` +
        `Free: Up to 100%\n` +
        `${E.premium} Premium: Up to 200%\n`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${E.filters} Audio Filters**\n` +
        `Free: ${E.cross} Not available\n` +
        `${E.premium} Premium: Bassboost, Nightcore, 8D, Vaporwave, + more\n`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${E.autoplay} Autoplay**\n` +
        `Free: ${E.cross} Not available\n` +
        `${E.premium} Premium: ${E.check} Auto-queue related tracks\n`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${E.avatar} Custom Bot Avatar**\n` +
        `Free: ${E.cross} Not available\n` +
        `${E.premium} Premium: ${E.check} Per-server custom avatar & banner`
      )
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
