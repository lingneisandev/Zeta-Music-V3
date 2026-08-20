'use strict';

require('dotenv').config();
const { log } = require('./utils/logger');

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'MONGO_URI', 'OWNER_IDS'];

for (const key of required) {
  if (!process.env[key]) {
    log.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  ownerIds: process.env.OWNER_IDS.split(',').map((id) => id.trim()),
  mongoUri: process.env.MONGO_URI,
  defaultPrefix: process.env.DEFAULT_PREFIX || 'z!',
  defaultVolume: parseInt(process.env.DEFAULT_VOLUME, 10) || 50,
  maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE, 10) || 1000,
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  devLogWebhook: process.env.DEV_LOG_WEBHOOK || '',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'https://discord.gg/RPuK3n8YBT',
  supportServerUrl: process.env.SUPPORT_SERVER_URL || '',
  lavalink: [
  {
    name: 'Node 1 (serentia/amane)',
    host: process.env.LAVALINK_HOST || 'lavalinkv4.serenetia.com',
    port: parseInt(process.env.LAVALINK_PORT, 10) || 443,
    password: process.env.LAVALINK_PASSWORD || 'https://seretia.link/discord',
    secure: process.env.LAVALINK_SECURE === 'true'
  },
  {
    name: 'Node 2 (millo 1)',
    host: process.env.LAVALINK_HOST_2 || 'lava-v4.millohost.my.id',
    port: parseInt(process.env.LAVALINK_PORT_2, 10) || 443,
    password: process.env.LAVALINK_PASSWORD_2 || 'https://discord.gg/mjS5J2K3ep',
    secure: process.env.LAVALINK_SECURE_2 === 'true'
  },
  logs: {
    commands: process.env.LOG_COMMANDS_CHANNEL || '1484467879578570832',
    errors: process.env.LOG_ERRORS_CHANNEL || '1484467879578570832',
    guildJoin: process.env.LOG_GUILD_JOIN_CHANNEL || '1484467879578570832',
    guildLeave: process.env.LOG_GUILD_LEAVE_CHANNEL || '1484467879578570832'
  }
};

module.exports = config;
