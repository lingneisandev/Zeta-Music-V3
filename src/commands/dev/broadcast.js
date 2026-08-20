'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const devLogger = require('../../utils/devLogger');
const { filterContent } = require('../../utils/mentionFilter');
const { log } = require('../../utils/logger');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('Broadcast a message to all servers')
    .addStringOption((opt) => opt.setName('message').setDescription('Message to broadcast').setRequired(true))
    .addStringOption((opt) => opt.setName('type').setDescription('Broadcast type').setRequired(true)
      .addChoices(
        { name: 'DM Server Owners', value: 'dm' },
        { name: 'Guild Channels', value: 'guild' }
      )),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 60,
  execute: async (ctx) => {
    const message = ctx.isInteraction
      ? ctx.options.getString('message')
      : ctx.args.slice(1).join(' ');

    const type = ctx.isInteraction
      ? ctx.options.getString('type')
      : (ctx.args[0] || 'guild').toLowerCase();

    if (!message) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a message.')), ephemeral: true });
    }

    const safeMessage = filterContent(message);
    let success = 0;
    let fail = 0;

    await ctx.reply({
      ...v2(successContainer(`${E.broadcast} Broadcasting to ${ctx.client.guilds.cache.size} guilds...`)),
      ephemeral: true
    });

    for (const [, guild] of ctx.client.guilds.cache) {
      try {
        if (type === 'dm') {
          const owner = await guild.fetchOwner();
          if (owner) {
            await owner.send({
              content: `${E.broadcast} **Broadcast from Zeta Music:**\n\n${safeMessage}`,
              allowedMentions: { parse: [], repliedUser: false }
            });
            success++;
          }
        } else {
          const channel = guild.systemChannel ||
            guild.channels.cache.find((c) => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));

          if (channel) {
            await channel.send({
              content: `${E.broadcast} **Broadcast from Zeta Music:**\n\n${safeMessage}`,
              allowedMentions: { parse: [], repliedUser: false }
            });
            success++;
          } else {
            fail++;
          }
        }
      } catch (_) {
        fail++;
      }
    }

    log.info(`${E.broadcast} Broadcast complete: ${success} sent, ${fail} failed`);
    await devLogger.sendBroadcast(safeMessage, success);

    await ctx.followUp({
      ...v2(successContainer(`${E.broadcast} Broadcast complete!\n${E.check} Sent: ${success}\n${E.cross} Failed: ${fail}`)),
      ephemeral: true
    });
  }
};
