'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { musicContainer, errorContainer, successContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const { filterContent } = require('../../utils/mentionFilter');
const playerManager = require('../../lavalink/playerManager');
const sourceResolver = require('../../lavalink/sourceResolver');
const { setupPlayerEvents } = require('../../handlers/playerHandler');
const { isPremium } = require('../../utils/premiumCheck');
const { sendAsWebhook } = require('../../utils/avatarEngine');

const NO_PING = { allowedMentions: { parse: [] } };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('Song name or URL').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('source').setDescription('Music source').setRequired(false)
        .addChoices(
          { name: 'YouTube', value: 'youtube' },
          { name: 'SoundCloud', value: 'soundcloud' },
          { name: 'Spotify', value: 'spotify' },
          { name: 'Deezer', value: 'deezer' },
          { name: 'Apple Music', value: 'applemusic' }
        )
    ),
  aliases: ['p', 'pl'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 3,

  execute: async (ctx) => {
    if (!checkVC(ctx.member)) {
      return ctx.reply({ ...v2(errorContainer('You need to be in a voice channel.')), ephemeral: true, ...NO_PING });
    }

    const query = ctx.isInteraction ? ctx.options.getString('query') : ctx.args.join(' ');

    if (!query) {
      return ctx.reply({ ...v2(errorContainer('Provide a song name or URL.')), ephemeral: true, ...NO_PING });
    }

    const source = ctx.isInteraction ? ctx.options.getString('source') || 'youtube' : 'youtube';

    const msg = await ctx.reply({ ...v2(musicContainer('Searching', `\`${filterContent(query)}\``)), ...NO_PING });

    const edit = (payload) => msg.edit({ ...payload, ...NO_PING });

    const premiumStatus = await isPremium(ctx.user.id, ctx.guild.id, ctx.client);

    let result;
    try {
      result = await sourceResolver.resolve(query, source, premiumStatus.premium);
    } catch (err) {
      return edit(v2(errorContainer(err.message)));
    }

    if (!result?.data || (Array.isArray(result.data) && result.data.length === 0)) {
      return edit(v2(errorContainer(`No results found for \`${filterContent(query)}\``)));
    }

    if (!checkSameVC(ctx.member, ctx.client)) {
      return edit(v2(errorContainer('You need to be in the same voice channel as the bot.')));
    }

    let player = playerManager.getPlayer(ctx.client, ctx.guild.id);

    if (!player) {
      player = await playerManager.createPlayer(
        ctx.client,
        ctx.guild.id,
        ctx.member.voice.channel.id,
        ctx.channel.id
      );
      setupPlayerEvents(ctx.client, player);
    }

    const isPlaylist = result.loadType === 'playlist';

    if (isPlaylist) {
      const tracks = result.data.tracks || result.data;
      for (const track of tracks) {
        track.requester = ctx.user;
        player.queue.push(track);
      }

      const playlistName = filterContent(result.data.info?.name || 'Unknown Playlist');

      await sendAsWebhook(ctx.channel, null, null, null, ctx.guild.id).catch(() => {});

      await edit(v2(successContainer(`Added **${playlistName}** — **${tracks.length}** tracks queued.`)));

      if (!player.current) {
        player.current = player.queue.shift();
        player.position = 0;
        player.shoukakuPlayer.playTrack({ track: { encoded: player.current.encoded } });
      }
    } else {
      const track = Array.isArray(result.data) ? result.data[0] : result.data;
      track.requester = ctx.user;

      if (!player.current) {
        player.current = track;
        player.position = 0;
        player.shoukakuPlayer.playTrack({ track: { encoded: track.encoded } });

        await edit(v2(musicContainer(
          'Now Playing',
          `**${filterContent(track.info.title)}**\n${filterContent(track.info.author)}`
        )));
      } else {
        player.queue.push(track);

        await edit(v2(successContainer(
          `Added **${filterContent(track.info.title)}** to the queue — position \`#${player.queue.length}\``
        )));
      }
    }
  }
};
