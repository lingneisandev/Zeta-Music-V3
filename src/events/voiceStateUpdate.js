'use strict';

const { log } = require('../utils/logger');
const playerManager = require('../lavalink/playerManager');
const { sleep } = require('../utils/logger');
const E = require('../emoji');

module.exports = {
  name: 'voiceStateUpdate',
  once: false,
  execute: async (client, oldState, newState) => {
    const guildId = oldState.guild.id || newState.guild.id;
    const player = playerManager.getPlayer(client, guildId);
    if (!player) return;

    if (oldState.id === client.user.id && !newState.channelId) {
      log.music(`${E.stop} Bot disconnected from VC in guild ${guildId}`);
      await playerManager.destroyPlayer(client, guildId);
      return;
    }

    if (oldState.id === client.user.id && newState.channelId && oldState.channelId !== newState.channelId) {
      player.voiceChannelId = newState.channelId;
      log.music(`${E.move} Bot moved to new VC in guild ${guildId}`);
      return;
    }

    if (oldState.channelId === player.voiceChannelId && oldState.id !== client.user.id) {
      const voiceChannel = oldState.guild.channels.cache.get(player.voiceChannelId);
      if (!voiceChannel) return;

      const members = voiceChannel.members.filter((m) => !m.user.bot);
      if (members.size === 0) {
        if (player.stayInVC) {
          log.music(`${E.autoplay} 24/7 mode active, staying in empty VC in guild ${guildId}`);
          return;
        }

        log.music(`${E.pause} All users left VC in guild ${guildId}, pausing...`);
        if (player.shoukakuPlayer && !player.shoukakuPlayer.paused) {
          await player.shoukakuPlayer.setPaused(true);
        }

        await sleep(30000);

        const currentPlayer = playerManager.getPlayer(client, guildId);
        if (!currentPlayer) return;

        const currentChannel = oldState.guild.channels.cache.get(currentPlayer.voiceChannelId);
        if (!currentChannel) {
          await playerManager.destroyPlayer(client, guildId);
          return;
        }

        const currentMembers = currentChannel.members.filter((m) => !m.user.bot);
        if (currentMembers.size === 0) {
          log.music(`${E.stop} Auto-disconnecting from empty VC in guild ${guildId}`);
          await playerManager.destroyPlayer(client, guildId);
        } else {
          if (currentPlayer.shoukakuPlayer && currentPlayer.shoukakuPlayer.paused) {
            await currentPlayer.shoukakuPlayer.setPaused(false);
          }
        }
      }
    }
  }
};
