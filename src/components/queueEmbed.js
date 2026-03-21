'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { formatDuration, COLORS } = require('../utils/embedBuilder');
const { filterContent } = require('../utils/mentionFilter');
const E = require('../emoji');

const buildQueueMessage = (queue, page, current) => {
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(queue.length / perPage));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * perPage;
  const end = Math.min(start + perPage, queue.length);

  const container = new ContainerBuilder()
    .setAccentColor(COLORS.queue);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${E.queue} Music Queue`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  if (current) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.play} **Now Playing:**\n[${filterContent(current.info.title)}](${current.info.uri}) - \`${formatDuration(current.info.length)}\``
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
  }

  let queueText = '';
  for (let i = start; i < end; i++) {
    const track = queue[i];
    const position = i + 1;
    queueText += `\`${position}.\` [${filterContent(track.info.title)}](${track.info.uri}) - \`${formatDuration(track.info.length)}\`\n`;
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(queueText || 'Queue is empty')
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`Page ${safePage}/${totalPages} ${E.dot} ${queue.length} tracks`)
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('queue_prev')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 1),
    new ButtonBuilder()
      .setCustomId('queue_next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= totalPages)
  );

  container.addActionRowComponents(navRow);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
};

module.exports = { buildQueueMessage };
