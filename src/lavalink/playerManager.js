'use strict';

const { log } = require('../utils/logger');
const E = require('../emoji');
const nodeManager = require('./nodeManager');
const Guild = require('../models/Guild');

const createPlayer = async (client, guildId, voiceChannelId, textChannelId) => {
  const shoukaku = nodeManager.getShoukaku();
  if (!shoukaku) {
    throw new Error('Lavalink is not initialized');
  }

  const player = await shoukaku.joinVoiceChannel({
    guildId,
    channelId: voiceChannelId,
    shardId: 0,
    deaf: true
  });

  if (!player) {
    throw new Error('Failed to create player');
  }

  let guildDoc = null;
  try {
    guildDoc = await Guild.findOne({ guildId });
  } catch (_) { }

  const playerData = {
    shoukakuPlayer: player,
    guildId,
    voiceChannelId,
    textChannelId,
    queue: [],
    current: null,
    loopMode: 'off',
    volume: 50,
    autoplay: false,
    stayInVC: guildDoc?.settings?.stayInVC ?? false,
    position: 0,
    currentSource: 'youtube',
    lastMessageId: null
  };

  client.players.set(guildId, playerData);
  log.music(`${E.play} Player created for guild ${guildId}`);
  return playerData;
};

const getPlayer = (client, guildId) => {
  return client.players.get(guildId) || null;
};

const destroyPlayer = async (client, guildId) => {
  const playerData = client.players.get(guildId);
  if (!playerData) return;

  if (playerData.updateInterval) {
    clearInterval(playerData.updateInterval);
    playerData.updateInterval = null;
  }

  try {
    const shoukaku = nodeManager.getShoukaku();
    if (shoukaku) {
      await shoukaku.leaveVoiceChannel(guildId);
    }
  } catch (_) {
  }

  client.players.delete(guildId);
  log.music(`${E.stop} Player destroyed for guild ${guildId}`);
};

module.exports = { createPlayer, getPlayer, destroyPlayer };
