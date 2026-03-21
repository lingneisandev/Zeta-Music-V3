'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const BotProfile = require('../../models/BotProfile');
const axios = require('axios');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Set a custom bot banner for this server')
    .addSubcommand((sub) => sub.setName('set').setDescription('Set custom banner')
      .addStringOption((opt) => opt.setName('url').setDescription('Banner image URL').setRequired(false))
      .addAttachmentOption((opt) => opt.setName('image').setDescription('Upload a banner image').setRequired(false)))
    .addSubcommand((sub) => sub.setName('reset').setDescription('Reset banner')),
  aliases: [],
  premiumOnly: true,
  djOnly: false,
  cooldown: 10,
  execute: async (ctx) => {
    const subcommand = ctx.isInteraction
      ? ctx.options.getSubcommand()
      : (ctx.args[0] || 'set').toLowerCase();

    if (subcommand === 'reset') {
      await BotProfile.findOneAndUpdate(
        { guildId: ctx.guild.id },
        { bannerUrl: null }
      );
      return await ctx.reply(v2(successContainer(`${E.banner} Banner has been reset.`)));
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
      return await ctx.reply({ ...v2(errorContainer('Please provide a banner URL or upload an image.')), ephemeral: true });
    }

    try {
      const response = await axios.head(url, { timeout: 5000 });
      const contentType = response.headers['content-type'] || '';
      if (!contentType.match(/^image\/(png|jpe?g|gif|webp)/i)) {
        throw new Error('URL is not a valid image');
      }
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      if (contentLength > 8 * 1024 * 1024) {
        throw new Error('Image exceeds 8MB limit');
      }
    } catch (err) {
      return await ctx.reply({ ...v2(errorContainer(`Invalid image: ${err.message}`)), ephemeral: true });
    }

    await BotProfile.findOneAndUpdate(
      { guildId: ctx.guild.id },
      { guildId: ctx.guild.id, bannerUrl: url },
      { upsert: true, new: true }
    );

    const {
      ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
      MediaGalleryBuilder, MediaGalleryItemBuilder,
      SeparatorSpacingSize, MessageFlags
    } = require('discord.js');

    const container = new ContainerBuilder()
      .setAccentColor(0x2ecc71);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.banner} Banner Updated`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${E.check} Custom banner has been set for this server.`)
    );
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(url)
      )
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
