'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');
const { filterContent } = require('./mentionFilter');

const COLORS = {
  music:   0xe94560,
  error:   0xff3333,
  success: 0x2ecc71,
  premium: 0xf1c40f,
  info:    0x5865F2,
  dev:     0x2f3136,
  queue:   0x7289DA,
  warning: 0xf39c12
};

const v2 = (...components) => ({
  components,
  flags: MessageFlags.IsComponentsV2
});

const separator = (divider = true) =>
  new SeparatorBuilder().setDivider(divider).setSpacing(SeparatorSpacingSize.Small);

const text = (content) =>
  new TextDisplayBuilder().setContent(content);

const musicContainer = (title, desc, color) => {
  const container = new ContainerBuilder().setAccentColor(color || COLORS.music);
  if (title) {
    container.addTextDisplayComponents(text(`### ${filterContent(title)}`));
    container.addSeparatorComponents(separator());
  }
  if (desc) container.addTextDisplayComponents(text(filterContent(desc)));
  return container;
};

const errorContainer = (desc) =>
  new ContainerBuilder()
    .setAccentColor(COLORS.error)
    .addTextDisplayComponents(text(`**✗** ${filterContent(desc)}`));

const successContainer = (desc) =>
  new ContainerBuilder()
    .setAccentColor(COLORS.success)
    .addTextDisplayComponents(text(`**✓** ${filterContent(desc)}`));

const premiumContainer = (desc) =>
  new ContainerBuilder()
    .setAccentColor(COLORS.premium)
    .addTextDisplayComponents(text(`**★** ${filterContent(desc)}`));

const infoContainer = (title, desc, color) => {
  const container = new ContainerBuilder().setAccentColor(color || COLORS.info);
  if (title) {
    container.addTextDisplayComponents(text(`### ${filterContent(title)}`));
    container.addSeparatorComponents(separator());
  }
  if (desc) container.addTextDisplayComponents(text(filterContent(desc)));
  return container;
};

const devContainer = (title, desc, fields) => {
  const container = new ContainerBuilder().setAccentColor(COLORS.dev);
  if (title) {
    container.addTextDisplayComponents(text(`### ${filterContent(title)}`));
    container.addSeparatorComponents(separator());
  }
  if (desc) container.addTextDisplayComponents(text(filterContent(desc)));
  if (Array.isArray(fields) && fields.length) {
    container.addSeparatorComponents(separator());
    for (const field of fields) {
      container.addTextDisplayComponents(
        text(`**${filterContent(field.name)}**\n${filterContent(field.value)}`)
      );
    }
  }
  return container;
};

const queueContainer = (tracks, page, current) => {
  const perPage = 10;
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, tracks.length);
  const totalPages = Math.ceil(tracks.length / perPage);

  const container = new ContainerBuilder().setAccentColor(COLORS.queue);

  container.addTextDisplayComponents(text('### Queue'));
  container.addSeparatorComponents(separator());

  if (current) {
    container.addTextDisplayComponents(
      text(`**Now Playing**\n[${filterContent(current.info.title)}](${current.info.uri})  \`${formatDuration(current.info.length)}\``)
    );
    container.addSeparatorComponents(separator());
  }

  const lines = [];
  for (let i = start; i < end; i++) {
    const t = tracks[i];
    lines.push(`\`${i + 1}.\` [${filterContent(t.info.title)}](${t.info.uri})  \`${formatDuration(t.info.length)}\``);
  }

  container.addTextDisplayComponents(text(lines.join('\n') || 'The queue is empty.'));
  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(text(`Page \`${page}/${totalPages}\`  ·  ${tracks.length} tracks`));

  return container;
};

const webhookEmbed = (title, desc, color) =>
  new EmbedBuilder()
    .setColor(color || COLORS.info)
    .setTitle(title ? filterContent(title) : null)
    .setDescription(desc ? filterContent(desc) : null)
    .setTimestamp();

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

module.exports = {
  v2, COLORS, formatDuration,
  musicContainer, errorContainer, successContainer,
  premiumContainer, infoContainer, devContainer,
  queueContainer, webhookEmbed
};
