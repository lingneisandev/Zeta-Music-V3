'use strict';

const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { log } = require('./logger');

const send = async (embeds) => {
  if (!config.devLogWebhook) return;
  try {
    await axios.post(config.devLogWebhook, { embeds }, { timeout: 5000 });
  } catch (err) {
    log.warn(`Dev webhook failed: ${err.message}`);
  }
};

const build = (color, title, fields = []) =>
  new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(fields)
    .setTimestamp()
    .toJSON();

const sendReady = async (client) => {
  await send([build(0x2ecc71, 'Bot Ready', [
    { name: 'Tag',    value: client.user.tag,                      inline: true },
    { name: 'Guilds', value: String(client.guilds.cache.size),     inline: true },
    { name: 'Users',  value: String(client.users.cache.size),      inline: true }
  ])]);
};

const sendCrash = async (error) => {
  await send([build(0xff3333, 'Crash Report', [
    { name: 'Error', value: error.message || 'Unknown' },
    { name: 'Stack', value: `\`\`\`${(error.stack || 'No stack').substring(0, 1000)}\`\`\`` }
  ])]);
};

const sendGuildJoin = async (guild) => {
  await send([build(0x2ecc71, 'Guild Joined', [
    { name: 'Name',    value: guild.name,              inline: true },
    { name: 'ID',      value: `\`${guild.id}\``,       inline: true },
    { name: 'Members', value: String(guild.memberCount), inline: true }
  ])]);
};

const sendGuildLeave = async (guild) => {
  await send([build(0x95a5a6, 'Guild Left', [
    { name: 'Name', value: guild.name,        inline: true },
    { name: 'ID',   value: `\`${guild.id}\``, inline: true }
  ])]);
};

const sendGuildBan = async (id, reason, mod) => {
  await send([build(0xff3333, 'Guild Banned', [
    { name: 'Guild ID', value: `\`${id}\``, inline: true },
    { name: 'By',       value: mod,          inline: true },
    { name: 'Reason',   value: reason }
  ])]);
};

const sendGuildUnban = async (id, mod) => {
  await send([build(0x2ecc71, 'Guild Unbanned', [
    { name: 'Guild ID', value: `\`${id}\``, inline: true },
    { name: 'By',       value: mod,          inline: true }
  ])]);
};

const sendUserBan = async (id, reason, mod) => {
  await send([build(0xff3333, 'User Banned', [
    { name: 'User ID', value: `\`${id}\``, inline: true },
    { name: 'By',      value: mod,          inline: true },
    { name: 'Reason',  value: reason }
  ])]);
};

const sendPremiumGrant = async (userId, days, mod) => {
  await send([build(0xf1c40f, 'Premium Granted', [
    { name: 'User ID',  value: `\`${userId}\``, inline: true },
    { name: 'Duration', value: `${days} days`,  inline: true },
    { name: 'By',       value: mod,              inline: true }
  ])]);
};

const sendPremiumRevoke = async (userId, mod) => {
  await send([build(0x95a5a6, 'Premium Revoked', [
    { name: 'User ID', value: `\`${userId}\``, inline: true },
    { name: 'By',      value: mod,              inline: true }
  ])]);
};

const sendMaintenance = async (state, mod) => {
  await send([build(0xf39c12, 'Maintenance Mode', [
    { name: 'State', value: state ? 'Enabled' : 'Disabled', inline: true },
    { name: 'By',    value: mod,                             inline: true }
  ])]);
};

const sendBroadcast = async (message, count) => {
  await send([build(0x5865F2, 'Broadcast Sent', [
    { name: 'Reached',  value: `${count} guilds`,                   inline: true },
    { name: 'Message',  value: message.substring(0, 500) }
  ])]);
};

module.exports = {
  sendReady, sendCrash,
  sendGuildJoin, sendGuildLeave,
  sendGuildBan, sendGuildUnban,
  sendUserBan,
  sendPremiumGrant, sendPremiumRevoke,
  sendMaintenance, sendBroadcast
};
