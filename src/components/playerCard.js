'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  ThumbnailBuilder,
  SectionBuilder
} = require('discord.js');
const { buildNowPlayingCard } = require('../utils/canvasBuilder');
const { buildControlPanel } = require('./controlPanel');
const { formatDuration, COLORS } = require('../utils/embedBuilder');
const { filterContent } = require('../utils/mentionFilter');
const E = require('../emoji');

const NO_PING = { allowedMentions: { parse: [] } };

const buildPlayerCard = async (track, player, requester) => {
  const buffer = await buildNowPlayingCard(track, player, requester);
  const attachment = new AttachmentBuilder(buffer, { name: 'nowplaying.png' });

  const title = filterContent(track.info.title).slice(0, 50);
  const author = filterContent(track.info.author).slice(0, 30);
  const duration = track.info.length;
  const position = player.position || 0;

  // Calculate Progress Bar
  const totalBar = 12;
  const filledBar = Math.round((position / duration) * totalBar);
  const progressBar = E.bar.repeat(Math.max(0, filledBar)) + E.barEmpty.repeat(Math.max(0, totalBar - filledBar));
  const timeInfo = `\`${formatDuration(position)} / ${formatDuration(duration)}\``;

  const statusParts = [
    `${E.volume} \`${player.volume ?? 50}%\``,
    player.loopMode !== 'off' ? `${E.loop} \`${player.loopMode.toUpperCase()}\`` : null,
    player.paused ? `${E.pause} \`PAUSED\`` : null
  ].filter(Boolean).join('  ·  ');

  const container = new ContainerBuilder()
    .setAccentColor(COLORS.music);

  const section = new SectionBuilder()
    .setThumbnailAccessory(new ThumbnailBuilder().setURL('attachment://nowplaying.png'))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### MIZUKI MUSIC\n` +
        `┌─ **Track Info**\n` +
        `├─ Title: **${title}**\n` +
        `├─ Artist: **${author}**\n` +
        `└─ Duration: ${progressBar} ${timeInfo}\n\n` +
        `┌─ **Playback Status**\n` +
        `└─ ${statusParts}`
      )
    );

  container.addSectionComponents(section);

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  container.addActionRowComponents(buildControlPanel(player));

  return {
    files: [attachment],
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    ...NO_PING
  };
};

const deletePlayerCard = async (message) => {
  if (!message) return;
  try {
    await message.delete();
  } catch {
    // Message already deleted or missing permissions
  }
};

module.exports = { buildPlayerCard, deletePlayerCard };
