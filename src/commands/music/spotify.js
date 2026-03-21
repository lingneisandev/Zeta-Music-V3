'use strict';

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { successContainer, errorContainer, v2, musicContainer } = require('../../utils/embedBuilder');
const spotifyUtil = require('../../utils/spotify');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify')
    .setDescription('Spotify integration commands')
    .addSubcommand(sub => sub.setName('login').setDescription('Get the Spotify authorization link'))
    .addSubcommand(sub => sub.setName('callback').setDescription('Finish the login process with the provided code')
      .addStringOption(opt => opt.setName('code').setDescription('The code from the URL after authorization').setRequired(true)))
    .addSubcommand(sub => sub.setName('playlist').setDescription('View and play your Spotify playlists'))
    .addSubcommand(sub => sub.setName('disconnect').setDescription('Unlink your Spotify account')),

  execute: async (ctx) => {
    let subcommand = '';
    try {
      subcommand = ctx.isInteraction ? ctx.options.getSubcommand() : (ctx.args[0] || '').toLowerCase();
    } catch (_) { }

    if (!subcommand) {
      return await ctx.reply({
        ...v2(musicContainer(`${E.spotify} Spotify Commands`,
          `Manage your Spotify account and playlists.\n\n` +
          `**Subcommands:**\n` +
          `${E.dot} \`login\` - Link your Spotify account\n` +
          `${E.dot} \`playlist\` - List and play your playlists\n` +
          `${E.dot} \`disconnect\` - Unlink your account`)),
        ephemeral: true
      });
    }

    if (subcommand === 'login') {
      const url = spotifyUtil.getAuthUrl(ctx.user.id);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Connect Spotify')
          .setStyle(ButtonStyle.Link)
          .setURL(url),
        new ButtonBuilder()
          .setCustomId('spotify_submit_code')
          .setLabel('Submit Code')
          .setEmoji('📥')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('spotify_how_to')
          .setLabel('How to get?')
          .setStyle(ButtonStyle.Secondary)
      );

      return await ctx.reply({
        ...v2(musicContainer(`${E.spotify} Spotify Connection`,
          `Click the **Connect** button below to authorize the bot.\n\n` +
          `Once authorized, you will be redirected to a page. Copy the **code** parameter from the URL and click **Submit Code** here.`)),
        components: [row],
        ephemeral: true
      });
    }

    if (subcommand === 'callback') {
      const code = ctx.isInteraction ? ctx.options?.getString('code') : ctx.args[1];
      if (!code) {
        return await ctx.reply({
          ...v2(errorContainer('Please provide the authorization code.')),
          ephemeral: true
        });
      }
      try {
        const profile = await spotifyUtil.exchangeCode(ctx.user.id, code);
        return await ctx.reply({
          ...v2(successContainer(`${E.spotify} Successfully logged in as **${profile.display_name}**!`)),
          ephemeral: true
        });
      } catch (err) {
        return await ctx.reply({
          ...v2(errorContainer(`Failed to login: ${err.message}`)),
          ephemeral: true
        });
      }
    }

    if (subcommand === 'playlist') {
      const data = await spotifyUtil.getUserPlaylists(ctx.user.id);
      if (!data || !data.items.length) {
        return await ctx.reply({
          ...v2(errorContainer('No playlists found or not logged in. Use `/spotify login` first.')),
          ephemeral: true
        });
      }

      const options = data.items.slice(0, 25).map(p => ({
        label: p.name.slice(0, 100),
        value: p.id,
        description: `${p.tracks.total} tracks`
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('spotify_play_playlist')
          .setPlaceholder('Select a playlist to play')
          .addOptions(options)
      );

      return await ctx.reply({
        ...v2(musicContainer(`${E.spotify} Your Playlists`, 'Select a playlist to add all its tracks to the queue.')),
        components: [row],
        ephemeral: true
      });
    }

    if (subcommand === 'disconnect') {
      const Spotify = require('../../models/Spotify');
      const deleted = await Spotify.findOneAndDelete({ userId: ctx.user.id });
      if (deleted) {
        return await ctx.reply({
          ...v2(successContainer(`${E.spotify} Successfully unlinked your Spotify account.`)),
          ephemeral: true
        });
      } else {
        return await ctx.reply({
          ...v2(errorContainer('You don\'t have a Spotify account linked.')),
          ephemeral: true
        });
      }
    }
  }
};
