'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { setAvatar, resetAvatar } = require('../../utils/avatarEngine');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Set a custom bot avatar for this server')
    .addSubcommand((sub) => sub.setName('set').setDescription('Set custom avatar')
      .addStringOption((opt) => opt.setName('url').setDescription('Image URL').setRequired(false))
      .addAttachmentOption((opt) => opt.setName('image').setDescription('Upload an image').setRequired(false)))
    .addSubcommand((sub) => sub.setName('reset').setDescription('Reset to default avatar')),
  aliases: [],
  premiumOnly: true,
  djOnly: false,
  cooldown: 10,
  execute: async (ctx) => {
    const subcommand = ctx.isInteraction
      ? ctx.options.getSubcommand()
      : (ctx.args[0] || 'set').toLowerCase();

    if (subcommand === 'reset') {
      await resetAvatar(ctx.guild.id);
      return await ctx.reply(v2(successContainer(`${E.avatar} Bot avatar has been reset to default.`)));
    }

    let url = null;

    if (ctx.isInteraction) {
      const attachment = ctx.options.getAttachment('image');
      url = ctx.options.getString('url') || (attachment ? attachment.url : null);
    } else {
      url = ctx.args[1] || null;
      if (!url && ctx.raw.attachments?.size > 0) {
        url = ctx.raw.attachments.first().url;
      }
    }

    if (!url) {
      return await ctx.reply({ ...v2(errorContainer('Please provide an image URL or upload an image.')), ephemeral: true });
    }

    try {
      await setAvatar(ctx.guild.id, url);
    } catch (err) {
      return await ctx.reply({ ...v2(errorContainer(`Failed to set avatar: ${err.message}`)), ephemeral: true });
    }

    const {
      ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
      SeparatorSpacingSize, ThumbnailBuilder, SectionBuilder,
      MessageFlags
    } = require('discord.js');

    const container = new ContainerBuilder()
      .setAccentColor(0x2ecc71);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.avatar} Avatar Updated`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${E.check} Custom avatar has been set for this server.\nThe bot will use this avatar when sending messages via webhook.`)
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(url)
      );

    container.addSectionComponents(section);

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
