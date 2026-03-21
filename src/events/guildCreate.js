'use strict';

const { EmbedBuilder, Colors } = require('discord.js');
const config = require('../config');

const NO_PING = { allowedMentions: { parse: [] } };

module.exports = {
  name: 'guildCreate',
  once: false,
  execute: async (client, guild) => {
    const channelId = config.logs?.guildJoin;
    if (!channelId) return;

    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('Joined Guild')
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Name', value: guild.name, inline: true },
        { name: 'ID', value: `\`${guild.id}\``, inline: true },
        { name: 'Members', value: `\`${guild.memberCount}\``, inline: true },
        { name: 'Owner', value: owner ? `${owner.user.tag} \`${owner.id}\`` : '—', inline: false }
      )
      .setFooter({ text: `Total guilds: ${client.guilds.cache.size}` })
      .setTimestamp();

    try {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel?.isTextBased()) await channel.send({ embeds: [embed], ...NO_PING });
    } catch (_) {}
  }
};
