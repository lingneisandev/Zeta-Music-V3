'use strict';

const { Collection, MessageFlags } = require('discord.js');
const config = require('../config');
const { log } = require('../utils/logger');
const { errorContainer, v2 } = require('../utils/embedBuilder');
const { filterContent } = require('../utils/mentionFilter');
const { isPremium } = require('../utils/premiumCheck');
const { isGuildBanned, isUserBanned } = require('../utils/blacklistCheck');
const { isMaintenance } = require('../utils/maintenanceGuard');
const { checkDJ, checkOwner } = require('../utils/permissions');
const Guild = require('../models/Guild');
const E = require('../emoji');

const handleHybrid = async (ctx) => {
  try {
    const { client, user, guild, commandName } = ctx;

    const command = client.commands.get(commandName) ||
      client.commands.get(client.aliases.get(commandName));

    if (!command) return;

    if (await isUserBanned(user.id)) {
      return await ctx.reply({
        ...v2(errorContainer(`${E.ban} You are banned from using this bot.`)),
        ephemeral: true
      });
    }

    if (guild && await isGuildBanned(guild.id)) {
      return await ctx.reply({
        ...v2(errorContainer(`${E.ban} This server is banned from using this bot.`)),
        ephemeral: true
      });
    }

    if (isMaintenance(user.id)) {
      return await ctx.reply({
        ...v2(errorContainer(`${E.maintenance} Bot is currently under maintenance. Please try again later.`)),
        ephemeral: true
      });
    }

    if (command.ownerOnly && !checkOwner(user.id, config)) {
      return await ctx.reply({
        ...v2(errorContainer('This command is restricted to bot owners.')),
        ephemeral: true
      });
    }

    if (command.premiumOnly) {
      const premiumStatus = await isPremium(user.id, guild?.id, client);
      if (!premiumStatus.premium) {
        return await ctx.reply({
          ...v2(errorContainer(`${E.premium} This command requires Premium. Use \`/premium perks\` to learn more.`)),
          ephemeral: true
        });
      }
    }

    if (command.djOnly && guild) {
      let guildDoc = null;
      try {
        guildDoc = await Guild.findOne({ guildId: guild.id });
      } catch (_) {}

      if (!checkDJ(ctx.member, guildDoc)) {
        return await ctx.reply({
          ...v2(errorContainer(`${E.dj} This command requires the DJ role.`)),
          ephemeral: true
        });
      }
    }

    if (command.cooldown) {
      if (!client.cooldowns.has(commandName)) {
        client.cooldowns.set(commandName, new Collection());
      }

      const timestamps = client.cooldowns.get(commandName);
      const cooldownMs = (command.cooldown || 3) * 1000;

      if (timestamps.has(user.id)) {
        const expiration = timestamps.get(user.id) + cooldownMs;
        if (Date.now() < expiration) {
          const remaining = ((expiration - Date.now()) / 1000).toFixed(1);
          return await ctx.reply({
            ...v2(errorContainer(`Please wait **${remaining}s** before using this command again.`)),
            ephemeral: true
          });
        }
      }

      timestamps.set(user.id, Date.now());
      setTimeout(() => timestamps.delete(user.id), cooldownMs);
    }

    if (ctx.args && Array.isArray(ctx.args)) {
      ctx.args = ctx.args.map((arg) => typeof arg === 'string' ? filterContent(arg) : arg);
    }

    await command.execute(ctx);
  } catch (err) {
    log.error(`Command error: ${err.message}`);
    log.error(err.stack || 'No stack');

    try {
      const replyMethod = ctx.replied || ctx.deferred ? ctx.followUp : ctx.reply;
      await replyMethod.call(ctx, {
        ...v2(errorContainer(`An error occurred while executing this command.\n\`\`\`${err.message}\`\`\``)),
        ephemeral: true
      });
    } catch (_) {}
  }
};

module.exports = { handleHybrid };
