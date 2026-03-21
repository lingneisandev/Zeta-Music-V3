'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { errorContainer, v2, COLORS } = require('../../utils/embedBuilder');
const { isPremium } = require('../../utils/premiumCheck');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('premiumstatus')
    .setDescription('Check your premium status'),
  aliases: ['ps'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const status = await isPremium(ctx.user.id, ctx.guild?.id, ctx.client);

    const container = new ContainerBuilder()
      .setAccentColor(status.premium ? COLORS.premium : COLORS.dev);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.premium} Premium Status`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    if (status.premium) {
      let expiryText = 'Lifetime';
      if (status.expiresAt) {
        expiryText = `Expires <t:${Math.floor(status.expiresAt.getTime() / 1000)}:R>`;
      }

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${E.check} **Premium Active**\n\n` +
          `**Tier:** ${status.tier}\n` +
          `**${expiryText}**\n\n` +
          `${E.star} Unlocked Features:\n` +
          `${E.arrow} Spotify, Deezer, Apple Music\n` +
          `${E.arrow} Audio Filters (Nightcore, 8D, etc.)\n` +
          `${E.arrow} Autoplay\n` +
          `${E.arrow} Custom Bot Avatar\n` +
          `${E.arrow} Volume up to 200%`
        )
      );
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${E.cross} **No Active Premium**\n\n` +
          `Use \`/redeem <key>\` to activate premium.\n` +
          `Use \`/perks\` to see what you're missing!`
        )
      );
    }

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
  }
};
