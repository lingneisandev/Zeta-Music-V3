'use strict';

const { Shoukaku, Connectors } = require('shoukaku');
const config = require('../config');
const { log } = require('../utils/logger');
const E = require('../emoji');

let shoukaku = null;

const nodes = [{
  name: 'Main',
  url: `${config.lavalink.host}:${config.lavalink.port}`,
  auth: config.lavalink.password,
  secure: config.lavalink.secure
}];

const options = {
  moveOnDisconnect: true,
  resume: true,
  resumeTimeout: 60,
  reconnectTries: 5,
  restTimeout: 15000,
  voiceConnectionTimeout: 15000
};

const init = (client) => {
  shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, options);

  shoukaku.on('ready', (name) => {
    log.lavalink(`[NODE:READY] Node "${name}" successfully connected to Lavalink server`);
  });

  shoukaku.on('error', (name, error) => {
    log.crash(`[NODE:ERROR] Node "${name}" error: ${error.message}`);
  });

  shoukaku.on('disconnect', (name, count) => {
    log.warn(`[NODE:DISCONNECT] Node "${name}" disconnected. ${count} players affected.`);
  });

  shoukaku.on('reconnecting', (name, left, timeout) => {
    log.warn(`[NODE:RECONNECT] Node "${name}" attempting reconnection... (${left} attempts remaining, ${timeout}ms)`);
  });

  shoukaku.on('debug', (name, info) => {
    if (info.includes('VoiceServerUpdate') || info.includes('VoiceStateUpdate')) {
      log.music(`[DEBUG:VOICE] ${info}`);
    }
  });

  return shoukaku;
};

const getShoukaku = () => shoukaku;

module.exports = { init, getShoukaku };
