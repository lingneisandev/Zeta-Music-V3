'use strict';

const { SlashCommandBuilder } = require('discord.js');
const playerManager = require('../../lavalink/playerManager');
const { successContainer, devContainer, v2 } = require('../../utils/embedBuilder');
const { log, sleep } = require('../../utils/logger');
const E = require('../../emoji');

const NO_PING = { allowedMentions: { parse: [] } };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Forcefully shut down all active music sessions and exit'),
  aliases: ['die', 'exit', 'kill'],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const activeGuilds = Array.from(ctx.client.players.keys());
    const count = activeGuilds.length;

    await ctx.reply({
      ...v2(successContainer(`${E.shutdown} **Global Shutdown Initiated**\nTerminating \`${count}\` active sessions and disconnecting...`)),
      ...NO_PING
    });

    log.warn(`${E.shutdown} SHUTDOWN | Initiated by ${ctx.user.tag} (${ctx.user.id})`);
    
    if (count > 0) {
      log.music(`[SHUTDOWN] Terminating ${count} players...`);
      for (const guildId of activeGuilds) {
        try {
          await playerManager.destroyPlayer(ctx.client, guildId);
          log.music(`[SHUTDOWN] Disconnected from guild: ${guildId}`);
        } catch (err) {
          log.error(`[SHUTDOWN] Failed to disconnect from ${guildId}: ${err.message}`);
        }
      }
    }

    log.warn(`${E.shutdown} All sessions closed. Closing client gateway and exiting...`);
    
    await sleep(2000);
    try {
      await ctx.client.destroy();
    } catch (_) { }
    
    log.ready(`[SHUTDOWN] Process terminated safely. Goodbye!`);
    process.exit(0);
  }
};
