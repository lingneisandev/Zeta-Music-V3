'use strict';

const { MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { handleHybrid } = require('../handlers/hybridHandler');
const { log } = require('../utils/logger');
const { errorContainer, v2, musicContainer, successContainer } = require('../utils/embedBuilder');
const { buildPlayerCard } = require('../components/playerCard');
const playerManager = require('../lavalink/playerManager');
const helpCommand = require('../commands/info/help');
const E = require('../emoji');
const spotifyUtil = require('../utils/spotify');

const NO_PING = { allowedMentions: { parse: [] } };

module.exports = {
  name: 'interactionCreate',
  once: false,
  execute: async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
      const ctx = {
        type: 'slash',
        commandName: interaction.commandName,
        args: [],
        member: interaction.member,
        guild: interaction.guild,
        channel: interaction.channel,
        user: interaction.user,
        client,
        isInteraction: true,
        raw: interaction,
        replied: false,
        deferred: false,
        reply: async (options) => {
          if (typeof options === 'string') options = { content: options };
          const payload = { ...options, ...NO_PING };
          if (interaction.replied || interaction.deferred) {
            return await interaction.followUp(payload);
          }
          ctx.replied = true;
          return await interaction.reply(payload);
        },
        followUp: async (options) => {
          if (typeof options === 'string') options = { content: options };
          return await interaction.followUp({ ...options, ...NO_PING });
        },
        deferReply: async (options) => {
          ctx.deferred = true;
          return await interaction.deferReply(options);
        }
      };

      const options = interaction.options;
      if (options) {
        ctx.args = [];
        for (const opt of options.data || []) {
          ctx.args.push(opt.value);
        }
        ctx.options = options;
      }

      await handleHybrid(ctx);
      return;
    }

    if (interaction.isButton()) {
      const player = playerManager.getPlayer(client, interaction.guild?.id);
      const customId = interaction.customId;

      if (customId === 'spotify_submit_code') {
        const modal = new ModalBuilder()
          .setCustomId('spotify_code_modal')
          .setTitle('Spotify Authorization');

        const input = new TextInputBuilder()
          .setCustomId('spotify_code_input')
          .setLabel('Paste the code from the URL')
          .setPlaceholder('AQB... (Paste the code parameter)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        return await interaction.showModal(modal);
      }

      if (customId === 'spotify_how_to') {
        return await interaction.reply({
          ...v2(musicContainer(`${E.info} How to link Spotify?`, 
            `1. Click the **Connect Spotify** button.\n` +
            `2. Log in and click **Agree**.\n` +
            `3. You will be redirected to a URL like \`https://discord.com/...code=XXXXX&state=...\`.\n` +
            `4. Copy the **code** part (\`XXXXX\`) and paste it in the **Submit Code** modal here.`)),
          ephemeral: true
        });
      }

      if (customId === 'play_pause') {
        if (!player || !player.current) {
          return await interaction.reply({ ...v2(errorContainer('No music is playing.')), ...NO_PING, ephemeral: true });
        }
        const paused = player.shoukakuPlayer.paused;
        await player.shoukakuPlayer.setPaused(!paused);
        await interaction.reply({
          ...v2(musicContainer(paused ? `${E.resume} Resumed` : `${E.pause} Paused`, paused ? 'Playback resumed.' : 'Playback paused.')),
          ...NO_PING,
          ephemeral: true
        });
        return;
      }

      if (customId === 'skip_track') {
        if (!player || !player.current) {
          return await interaction.reply({ ...v2(errorContainer('No music is playing.')), ...NO_PING, ephemeral: true });
        }
        const skipped = player.current.info.title;
        await player.shoukakuPlayer.stopTrack();
        await interaction.reply({
          ...v2(successContainer(`${E.skip} Skipped **${skipped}**`)),
          ...NO_PING,
          ephemeral: true
        });
        return;
      }

      if (customId === 'stop_player') {
        if (!player) {
          return await interaction.reply({ ...v2(errorContainer('No music is playing.')), ...NO_PING, ephemeral: true });
        }
        await playerManager.destroyPlayer(client, interaction.guild.id);
        await interaction.reply({
          ...v2(successContainer(`${E.stop} Player stopped and disconnected.`)),
          ...NO_PING,
          ephemeral: true
        });
        return;
      }

      if (customId === 'loop_toggle') {
        if (!player || !player.current) {
          return await interaction.reply({ ...v2(errorContainer('No music is playing.')), ...NO_PING, ephemeral: true });
        }
        const modes = ['off', 'track', 'queue'];
        const currentIndex = modes.indexOf(player.loopMode);
        player.loopMode = modes[(currentIndex + 1) % modes.length];
        await interaction.reply({
          ...v2(musicContainer(`${E.loop} Loop Mode`, `Loop set to: **${player.loopMode}**`)),
          ...NO_PING,
          ephemeral: true
        });
        return;
      }

      if (customId === 'shuffle_queue') {
        if (!player || player.queue.length < 2) {
          return await interaction.reply({ ...v2(errorContainer('Not enough tracks to shuffle.')), ...NO_PING, ephemeral: true });
        }
        for (let i = player.queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
        }
        await interaction.reply({
          ...v2(successContainer(`${E.shuffle} Shuffled ${player.queue.length} tracks.`)),
          ...NO_PING,
          ephemeral: true
        });
        return;
      }

      if (customId === 'previous_track') {
        await interaction.reply({
          ...v2(musicContainer(`${E.info} Previous`, 'Previous track is not available in this session.')),
          ...NO_PING,
          ephemeral: true
        });
        return;
      }

      if (customId === 'queue_prev' || customId === 'queue_next') {
        await interaction.deferUpdate();
        return;
      }

      if (customId.startsWith('confirm_yes_') || customId.startsWith('confirm_no_')) {
        if (customId.startsWith('confirm_no_')) {
          await interaction.update({
            ...v2(musicContainer(`${E.cross} Cancelled`, 'Action cancelled.')),
            components: [],
            ...NO_PING
          });
          return;
        }
        await interaction.deferUpdate();
        return;
      }

      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'source_select') {
        const player = playerManager.getPlayer(client, interaction.guild?.id);
        if (!player) {
          return await interaction.reply({ ...v2(errorContainer('No active player.')), ...NO_PING, ephemeral: true });
        }
        const selected = interaction.values[0];
        player.currentSource = selected;
        await interaction.reply({
          ...v2(successContainer(`${E.source} Source changed to **${selected}**`)),
          ...NO_PING,
          ephemeral: true
        });
        return;
      }

      if (interaction.customId === 'help_category') {
        const selected = interaction.values[0];
        const response = await helpCommand.renderHelp(client, selected);
        await interaction.update({ ...response, ...NO_PING });
        return;
      }

      const { isPremium } = require('../utils/premiumCheck');
      const spotifyUtil = require('../utils/spotify');
      const sourceResolver = require('../lavalink/sourceResolver');
      const { setupPlayerEvents } = require('../handlers/playerHandler');
      const { checkVC, checkSameVC } = require('../utils/permissions');

      if (interaction.customId === 'spotify_play_playlist') {
        if (!checkVC(interaction.member)) {
          return await interaction.reply({ ...v2(errorContainer('You need to be in a voice channel.')), ephemeral: true, ...NO_PING });
        }

        const playlistId = interaction.values[0];
        await interaction.deferReply({ ephemeral: true });

        const tracks = await spotifyUtil.getPlaylistTracks(interaction.user.id, playlistId);
        if (!tracks || !tracks.length) {
          return await interaction.editReply({ ...v2(errorContainer('Failed to fetch tracks or playlist is empty.')), ...NO_PING });
        }

        let player = playerManager.getPlayer(client, interaction.guild.id);
        if (!player) {
          player = await playerManager.createPlayer(client, interaction.guild.id, interaction.member.voice.channel.id, interaction.channel.id);
          setupPlayerEvents(client, player);
        } else {
          if (!checkSameVC(interaction.member, client)) {
            return await interaction.editReply({ ...v2(errorContainer('You need to be in the same voice channel.')), ...NO_PING });
          }
        }

        const premiumStatus = await isPremium(interaction.user.id, interaction.guild.id, client);
        let addedCount = 0;

        for (const track of tracks.slice(0, 50)) {
          try {
            const query = `${track.title} ${track.author}`;
            const result = await sourceResolver.resolve(query, 'youtube', premiumStatus.premium);
            if (result && result.data && (Array.isArray(result.data) ? result.data.length > 0 : !!result.data)) {
              const lavalinkTrack = Array.isArray(result.data) ? result.data[0] : result.data;
              lavalinkTrack.requester = interaction.user;
              lavalinkTrack.info.spotifyId = track.id; // Store for autoplay
              player.queue.push(lavalinkTrack);
              addedCount++;

              if (!player.current) {
                player.current = player.queue.shift();
                player.position = 0;
                player.shoukakuPlayer.playTrack({ track: { encoded: player.current.encoded } });
              }
            }
          } catch (_) { }
        }

        return await interaction.editReply({
          ...v2(successContainer(`${E.music} Successfully added **${addedCount}** tracks from Spotify to the queue.`)),
          ...NO_PING
        });
      }

      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'spotify_code_modal') {
        const code = interaction.fields.getTextInputValue('spotify_code_input');
        try {
          const profile = await spotifyUtil.exchangeCode(interaction.user.id, code);
          return await interaction.reply({
            ...v2(successContainer(`${E.spotify} Successfully logged in as **${profile.display_name}**!`)),
            ephemeral: true
          });
        } catch (err) {
          return await interaction.reply({
            ...v2(errorContainer(`Failed to login: ${err.message}`)),
            ephemeral: true
          });
        }
      }
      return;
    }
  }
};
