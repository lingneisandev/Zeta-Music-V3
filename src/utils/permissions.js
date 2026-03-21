'use strict';

const { PermissionsBitField } = require('discord.js');

const checkDJ = (member, guildDoc) => {
  if (!guildDoc || !guildDoc.djRoleId) return true;
  if (member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;
  const voiceChannel = member.voice?.channel;
  if (voiceChannel && voiceChannel.members.filter((m) => !m.user.bot).size <= 1) return true;
  return member.roles.cache.has(guildDoc.djRoleId);
};

const checkVC = (member) => {
  return !!member.voice?.channel;
};

const checkSameVC = (member, client) => {
  const botVoice = member.guild.members.cache.get(client.user.id)?.voice?.channel;
  if (!botVoice) return true;
  return member.voice?.channel?.id === botVoice.id;
};

const checkOwner = (userId, config) => {
  return config.ownerIds.includes(userId);
};

module.exports = { checkDJ, checkVC, checkSameVC, checkOwner };
