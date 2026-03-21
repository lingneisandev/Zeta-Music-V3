'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { COLORS } = require('../../utils/embedBuilder');
const prettyMs = require('pretty-ms');
const nodeManager = require('../../lavalink/nodeManager');
const mongoose = require('mongoose');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botstatus')
    .setDescription('Show detailed bot status'),
  aliases: ['bs'],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const uptime = prettyMs(ctx.client.uptime || 0, { verbose: true });
    const memUsage = process.memoryUsage();
    const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    const rss = (memUsage.rss / 1024 / 1024).toFixed(2);

    const shoukaku = nodeManager.getShoukaku();
    const nodeCount = shoukaku ? shoukaku.nodes.size : 0;
    const playerCount = ctx.client.players ? ctx.client.players.size : 0;

    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

    let guildCount = 0;
    let userCount = 0;
    try {
      guildCount = ctx.client.guilds.cache.size;
      userCount = ctx.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    } catch (_) {}

    const container = new ContainerBuilder()
      .setAccentColor(COLORS.info);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.status} Bot Status`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.uptime} **Uptime:** ${uptime}\n` +
        `${E.info} **Memory:** ${heapUsed} / ${heapTotal} MB (RSS: ${rss} MB)\n` +
        `${E.guilds} **Guilds:** ${guildCount}\n` +
        `${E.info} **Users:** ${userCount}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.music} **Players:** ${playerCount}\n` +
        `${E.lavalink} **Lavalink Nodes:** ${nodeCount}\n` +
        `${E.db} **Database:** ${dbState}\n` +
        `${E.info} **Node.js:** ${process.version}\n` +
        `${E.info} **Discord.js:** v${require('discord.js').version}`
      )
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
  }
};
