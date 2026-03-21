'use strict';

const { log } = require('../utils/logger');
const E = require('../emoji');
const { buildPlayerCard, deletePlayerCard } = require('../components/playerCard');
const { musicContainer, errorContainer, v2 } = require('../utils/embedBuilder');
const playerManager = require('../lavalink/playerManager');
const { sleep } = require('../utils/logger');

const NO_PING = { allowedMentions: { parse: [] } };

const setupPlayerEvents = (client, playerData) => {
  const { shoukakuPlayer, guildId } = playerData;

  const clearUpdateInterval = (player) => {
    if (player.updateInterval) {
      clearInterval(player.updateInterval);
      player.updateInterval = null;
    }
  };

  shoukakuPlayer.on('start', async () => {
    log.music(`[EVENT:START] Track started in guild ${guildId}`);
    const player = playerManager.getPlayer(client, guildId);
    if (!player || !player.current) return;

    clearUpdateInterval(player);

    try {
      await shoukakuPlayer.setGlobalVolume(player.volume ?? 50);
    } catch (_) { }

    try {
      const channel = await client.channels.fetch(player.textChannelId);
      if (!channel) return;

      if (player.lastMessageId) {
        try {
          const oldMsg = await channel.messages.fetch(player.lastMessageId);
          if (oldMsg) await deletePlayerCard(oldMsg);
        } catch (_) { }
      }

      const requester = player.current.requester || null;
      const cardMessage = await buildPlayerCard(player.current, player, requester);
      const sentMsg = await channel.send({ ...cardMessage, ...NO_PING });
      player.lastMessageId = sentMsg.id;

      // Auto-update progress every 8 seconds
      player.updateInterval = setInterval(async () => {
        const freshPlayer = playerManager.getPlayer(client, guildId);
        if (!freshPlayer || !freshPlayer.current || freshPlayer.paused) return;

        try {
          const updatedCard = await buildPlayerCard(freshPlayer.current, freshPlayer, freshPlayer.current.requester);
          await sentMsg.edit({ ...updatedCard, ...NO_PING }).catch(() => {
            clearUpdateInterval(freshPlayer);
          });
        } catch (_) {
          clearUpdateInterval(freshPlayer);
        }
      }, 8000);

    } catch (err) {
      log.error(`Failed to handle player message: ${err.message}`);
    }
  });

  shoukakuPlayer.on('end', async (data) => {
    log.music(`[EVENT:END] Track ended in guild ${guildId}. Reason: ${data.reason}`);
    const player = playerManager.getPlayer(client, guildId);
    if (!player) return;

    clearUpdateInterval(player);
    if (data.reason === 'replaced') return;

    if (player.loopMode === 'track' && player.current) {
      shoukakuPlayer.playTrack({ track: { encoded: player.current.encoded } });
      return;
    }

    if (player.loopMode === 'queue' && player.current) {
      player.queue.push(player.current);
    }

    if (player.queue.length > 0) {
      player.current = player.queue.shift();
      player.position = 0;
      shoukakuPlayer.playTrack({ track: { encoded: player.current.encoded } });
      return;
    }

    if (player.autoplay && player.current) {
      try {
        const spotifyUtil = require('../utils/spotify');
        const sourceResolver = require('../lavalink/sourceResolver');
        let nextTrack = null;

        if (player.current.info.spotifyId) {
          const rec = await spotifyUtil.getRecommendations(player.current.requester?.id, player.current.info.spotifyId);
          if (rec) {
            const result = await sourceResolver.resolve(`${rec.title} ${rec.author}`, 'youtube', true);
            if (result && result.data) {
              nextTrack = Array.isArray(result.data) ? result.data[0] : result.data;
              if (nextTrack) nextTrack.info.spotifyId = rec.id;
            }
          }
        }

        if (!nextTrack) {
          const nodeManager = require('../lavalink/nodeManager');
          const node = nodeManager.getShoukaku().nodes.values().next().value;
          if (node) {
            const result = await node.rest.resolve(`ytsearch:${player.current.info.title} ${player.current.info.author}`);
            if (result?.data?.length > 1) nextTrack = result.data[1];
          }
        }

        if (nextTrack) {
          nextTrack.requester = client.user;
          player.current = nextTrack;
          player.position = 0;
          shoukakuPlayer.playTrack({ track: { encoded: nextTrack.encoded } });
          return;
        }
      } catch (err) { log.error(`Autoplay error: ${err.message}`); }
    }

    player.current = null;
    try {
      const channel = await client.channels.fetch(player.textChannelId);
      if (channel && player.lastMessageId) {
        const oldMsg = await channel.messages.fetch(player.lastMessageId).catch(() => null);
        if (oldMsg) await deletePlayerCard(oldMsg);
        player.lastMessageId = null;
        await channel.send({ ...v2(musicContainer(`${E.stop} Queue Ended`, player.stayInVC ? '24/7 Mode is active.' : 'Disconnecting in 30 seconds...')), ...NO_PING });
      }
    } catch (_) { }

    await sleep(30000);
    const stillActive = playerManager.getPlayer(client, guildId);
    if (stillActive && !stillActive.current && stillActive.queue.length === 0 && !stillActive.stayInVC) {
      await playerManager.destroyPlayer(client, guildId);
    }
  });

  shoukakuPlayer.on('stuck', async () => {
    const player = playerManager.getPlayer(client, guildId);
    if (!player) return;
    clearUpdateInterval(player);
    if (player.queue.length > 0) {
      player.current = player.queue.shift();
      player.position = 0;
      shoukakuPlayer.playTrack({ track: { encoded: player.current.encoded } });
    } else {
      player.current = null;
      await playerManager.destroyPlayer(client, guildId);
    }
  });

  shoukakuPlayer.on('closed', async (data) => {
    const player = playerManager.getPlayer(client, guildId);
    if (player) clearUpdateInterval(player);
    if (data.code === 4014) await playerManager.destroyPlayer(client, guildId);
  });

  shoukakuPlayer.on('update', (data) => {
    const player = playerManager.getPlayer(client, guildId);
    if (player && data.state) player.position = data.state.position || 0;
  });
};

module.exports = { setupPlayerEvents };