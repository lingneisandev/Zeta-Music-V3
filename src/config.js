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
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
  supportServerUrl: process.env.SUPPORT_SERVER_URL || '',
  lavalink: {
    host: process.env.LAVALINK_HOST || 'YOUR_LAVA_HOST,YOUR_LAVA_HOST_2,YOUR_LAVA_HOST_3',
    port: parseInt(process.env.LAVALINK_PORT, 10) || 443,443,443,
    password: process.env.LAVALINK_PASSWORD || 'YOUR_PASS_LAVALINK,YOUR_PASS_LAVALINK_2,YOUR_PASS_LAVALINK_3',
    secure: process.env.LAVALINK_SECURE === 'true,true,true'
  },
  logs: {
    commands: process.env.LOG_COMMANDS_CHANNEL || '1484467879578570832',
    errors: process.env.LOG_ERRORS_CHANNEL || '1484467879578570832',
    guildJoin: process.env.LOG_GUILD_JOIN_CHANNEL || '1484467879578570832',
    guildLeave: process.env.LOG_GUILD_LEAVE_CHANNEL || '1484467879578570832'
  }
};

module.exports = config;
