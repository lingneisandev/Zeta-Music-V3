'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const axios = require('axios');
const { errorContainer, successContainer, v2 } = require('../../utils/embedBuilder');
const { setAvatar, resetAvatar } = require('../../utils/avatarEngine');
const BotProfile = require('../../models/BotProfile');

const NO_PING = { allowedMentions: { parse: [] } };

const validateImageUrl = async (url) => {
  const res = await axios.head(url, { timeout: 5000 });
  const ct = res.headers['content-type'] || '';
  if (!ct.match(/^image\/(png|jpe?g|gif|webp)/i)) throw new Error('URL is not a valid image.');
  const bytes = parseInt(res.headers['content-length'] || '0', 10);
  if (bytes > 8 * 1024 * 1024) throw new Error('Image exceeds 8 MB limit.');
};

const sep = () =>
  new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

const buildButtons = (disabled = false) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('cust_avatar').setLabel('Set Avatar').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('cust_banner').setLabel('Set Banner').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('cust_reset_avatar').setLabel('Reset Avatar').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('cust_reset_banner').setLabel('Reset Banner').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('cust_reset_all').setLabel('Reset All').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );

const buildPanel = async (guildId, disabled = false) => {
  const profile   = await BotProfile.findOne({ guildId }).catch(() => null);
  const avatarUrl = profile?.avatarUrl || null;
  const bannerUrl = profile?.bannerUrl || null;

  const container = new ContainerBuilder().setAccentColor(0x5865F2);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      '### Bot Customization\n' +
      'Personalize how the bot appears in this server.\n' +
      'Changes apply to webhook messages sent in this guild.'
    )
  );

  container.addSeparatorComponents(sep());

  if (avatarUrl) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('**Avatar**\nCustom avatar is active.')
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl))
    );
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Avatar**\nUsing default bot avatar.')
    );
  }

  container.addSeparatorComponents(sep());

  if (bannerUrl) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Banner**\nCustom banner is active.')
    );
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(bannerUrl)
      )
    );
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Banner**\nNo custom banner set.')
    );
  }

  container.addSeparatorComponents(sep());
  container.addActionRowComponents(buildButtons(disabled));

  return { components: [container], flags: MessageFlags.IsComponentsV2, ...NO_PING };
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('customize')
    .setDescription('Customize the bot avatar and banner for this server'),
  aliases: ['custom', 'botcustom'],
  premiumOnly: true,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const msg = await ctx.reply(await buildPanel(ctx.guild.id));

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.user.id,
      time: 300_000
    });

    collector.on('collect', async (i) => {
      const id = i.customId;

      // ── Reset actions — use i.update() to refresh the panel in one call ──
      if (id === 'cust_reset_avatar') {
        await resetAvatar(ctx.guild.id).catch(() => {});
        return i.update(await buildPanel(ctx.guild.id));
      }

      if (id === 'cust_reset_banner') {
        await BotProfile.findOneAndUpdate({ guildId: ctx.guild.id }, { bannerUrl: null }).catch(() => {});
        return i.update(await buildPanel(ctx.guild.id));
      }

      if (id === 'cust_reset_all') {
        await resetAvatar(ctx.guild.id).catch(() => {});
        await BotProfile.findOneAndUpdate(
          { guildId: ctx.guild.id },
          { avatarUrl: null, bannerUrl: null }
        ).catch(() => {});
        return i.update(await buildPanel(ctx.guild.id));
      }

      // ── Set actions — show modal (this IS the i acknowledgement) ──────────
      if (id === 'cust_avatar' || id === 'cust_banner') {
        const isAvatar = id === 'cust_avatar';
        const label    = isAvatar ? 'Avatar' : 'Banner';
        const inputId  = isAvatar ? 'avatar_url_input' : 'banner_url_input';

        await i.showModal(
          new ModalBuilder()
            .setCustomId(`modal_${id}`)
            .setTitle(`Set Custom ${label}`)
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId(inputId)
                  .setLabel(`${label} image URL`)
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder('https://example.com/image.png')
                  .setRequired(true)
              )
            )
        );

        // modal submit is a fresh interaction — defer it first, then followUp for errors
        const submitted = await i.awaitModalSubmit({ time: 120_000 }).catch(() => null);
        if (!submitted) return;

        await submitted.deferUpdate();

        const url = submitted.fields.getTextInputValue(inputId).trim();

        try {
          await validateImageUrl(url);
        } catch (err) {
          await submitted.followUp({ ...v2(errorContainer(`Invalid image: ${err.message}`)), ephemeral: true, ...NO_PING });
          return;
        }

        if (isAvatar) {
          try {
            await setAvatar(ctx.guild.id, url);
          } catch (err) {
            await submitted.followUp({ ...v2(errorContainer(`Failed to set avatar: ${err.message}`)), ephemeral: true, ...NO_PING });
            return;
          }
        } else {
          await BotProfile.findOneAndUpdate(
            { guildId: ctx.guild.id },
            { guildId: ctx.guild.id, bannerUrl: url },
            { upsert: true, new: true }
          );
        }

        await msg.edit(await buildPanel(ctx.guild.id));
        await submitted.followUp({ ...v2(successContainer(`${label} updated successfully.`)), ephemeral: true, ...NO_PING });
      }
    });

    collector.on('end', async () => {
      try {
        await msg.edit(await buildPanel(ctx.guild.id, true));
      } catch (_) {}
    });
  }
};
