'use strict';

const { EmbedBuilder, Colors } = require('discord.js');
const config = require('../config');

const NO_PING = { allowedMentions: { parse: [] } };

module.exports = {
  name: 'guildDelete',
  once: false,
  execute: async (client, guild) => {
    const channelId = config.logs?.guildLeave;
    if (!channelId) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('Left Guild')
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Name', value: guild.name, inline: true },
        { name: 'ID', value: `\`${guild.id}\``, inline: true },
        { name: 'Members', value: `\`${guild.memberCount ?? '—'}\``, inline: true }
      )
      .setFooter({ text: `Total guilds: ${client.guilds.cache.size}` })
      .setTimestamp();

    try {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel?.isTextBased()) await channel.send({ embeds: [embed], ...NO_PING });
    } catch (_) {}
  }
};
