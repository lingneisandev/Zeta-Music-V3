'use strict';

const { handleHybrid } = require('../handlers/hybridHandler');
const Guild = require('../models/Guild');
const config = require('../config');
const { filterContent } = require('../utils/mentionFilter');
const { checkNoPrefix } = require('../utils/noPrefixCheck');
const {
  EmbedBuilder,
  Colors,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
} = require('discord.js');

const NO_PING = { allowedMentions: { parse: [] } };

const sendLog = async (client, type, embed) => {
  const channelId = config.logs?.[type];
  if (!channelId) return;
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (channel?.isTextBased()) await channel.send({ embeds: [embed], ...NO_PING });
  } catch (_) { }
};

const logCommand = (client, message, commandName, args) => {
  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
    .setTitle('Command Used')
    .addFields(
      { name: 'Command', value: `\`${commandName}\``, inline: true },
      { name: 'Args', value: args.length ? `\`${args.join(' ')}\`` : '—', inline: true },
      { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Guild', value: `${message.guild.name} \`${message.guild.id}\``, inline: false }
    )
    .setTimestamp();
  sendLog(client, 'commands', embed);
};

const logError = (client, message, commandName, err) => {
  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle('Command Error')
    .addFields(
      { name: 'Command', value: `\`${commandName}\``, inline: true },
      { name: 'User', value: `${message.author.tag} \`${message.author.id}\``, inline: true },
      { name: 'Guild', value: `${message.guild.name} \`${message.guild.id}\``, inline: false },
      { name: 'Error', value: `\`\`\`${String(err.message).slice(0, 1000)}\`\`\`` }
    )
    .setTimestamp();
  sendLog(client, 'errors', embed);
};

const handleMentionReply = async (message, prefix) => {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Hey, ${message.author}! 👋\n` +
        `I'm **${message.client.user.username}** — here to help.\n\n` +
        `> Prefix in this server: \`${prefix}\`\n` +
        `> You can also mention me instead of the prefix.\n\n` +
        `Use \`${prefix}help\` to browse all available commands.`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Help')
          .setStyle(ButtonStyle.Primary)
          .setCustomId(`help_menu_${message.author.id}`),
        new ButtonBuilder()
          .setLabel('Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL(config.supportServerUrl),
        new ButtonBuilder()
          .setLabel('Invite Me')
          .setStyle(ButtonStyle.Link)
          .setURL(
            config.inviteUrl ??
            `https://discord.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot+applications.commands`
          )
      )
    );

  await message.reply({
    components: [container],
    flags: ['IsComponentsV2'],
    ...NO_PING,
  });
};

module.exports = {
  name: 'messageCreate',
  once: false,
  execute: async (client, message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.system) return;

    let prefix = config.defaultPrefix;
    let allowedChannels = [];

    try {
      const guildDoc = await Guild.findOne({ guildId: message.guild.id });
      if (guildDoc?.prefix) prefix = guildDoc.prefix;
      if (Array.isArray(guildDoc?.commandChannels)) allowedChannels = guildDoc.commandChannels;
    } catch (_) { }

    const mentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*`);
    const mentionMatch = message.content.match(mentionRegex);

    if (mentionMatch && message.content.trim().match(new RegExp(`^<@!?${client.user.id}>\\s*$`))) {
      return handleMentionReply(message, prefix);
    }

    let content = '';
    let type = 'prefix';

    if (mentionMatch) {
      content = message.content.slice(mentionMatch[0].length).trim();
      type = 'mention';
    } else if (message.content.toLowerCase().startsWith(prefix.toLowerCase())) {
      content = message.content.slice(prefix.length).trim();
    } else {
      const isNoPrefix = await checkNoPrefix(message.author.id);
      if (isNoPrefix) {
        content = message.content.trim();
        type = 'noprefix';
      } else {
        return;
      }
    }

    if (!content) return handleMentionReply(message, prefix);

    const args = content.split(/\s+/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    const command =
      client.commands.get(commandName) ||
      client.commands.get(client.aliases.get(commandName));
    if (!command) return;

    if (allowedChannels.length && !allowedChannels.includes(message.channel.id)) {
      return message
        .reply({
          content: `Commands can only be used in ${allowedChannels.map(id => `<#${id}>`).join(', ')}.`,
          ...NO_PING,
        })
        .then(m => setTimeout(() => m.delete().catch(() => { }), 5000));
    }

    const ctx = {
      type,
      commandName,
      args,
      member: message.member,
      guild: message.guild,
      channel: message.channel,
      user: message.author,
      client,
      isInteraction: false,
      raw: message,
      reply: async (options) => {
        if (typeof options === 'string') {
          return message.reply({ content: filterContent(options), ...NO_PING });
        }
        return message.reply({ ...options, ...NO_PING });
      },
      followUp: async (options) => {
        if (typeof options === 'string') {
          return message.channel.send({ content: filterContent(options), ...NO_PING });
        }
        return message.channel.send({ ...options, ...NO_PING });
      },
    };

    logCommand(client, message, commandName, args);

    try {
      await handleHybrid(ctx);
    } catch (err) {
      logError(client, message, commandName, err);
    }
  },
};