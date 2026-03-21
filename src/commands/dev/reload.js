'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { log } = require('../../utils/logger');
const path = require('path');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload a command')
    .addStringOption((opt) => opt.setName('command').setDescription('Command name to reload').setRequired(true)),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const commandName = ctx.isInteraction
      ? ctx.options.getString('command')
      : ctx.args[0];

    if (!commandName) {
      return await ctx.reply({ ...v2(errorContainer('Please provide a command name.')), ephemeral: true });
    }

    const command = ctx.client.commands.get(commandName) ||
      ctx.client.commands.get(ctx.client.aliases.get(commandName));

    if (!command) {
      return await ctx.reply({ ...v2(errorContainer(`Command \`${commandName}\` not found.`)), ephemeral: true });
    }

    try {
      delete require.cache[require.resolve(command.filePath)];
      const reloaded = require(command.filePath);

      reloaded.category = command.category;
      reloaded.filePath = command.filePath;

      const cmdName = reloaded.data.name || reloaded.data.toJSON?.()?.name;
      ctx.client.commands.set(cmdName, reloaded);

      if (command.aliases) {
        for (const alias of command.aliases) {
          ctx.client.aliases.delete(alias);
        }
      }
      if (reloaded.aliases) {
        for (const alias of reloaded.aliases) {
          ctx.client.aliases.set(alias, cmdName);
        }
      }

      log.load(`${E.reload} Reloaded command: ${cmdName}`);
      await ctx.reply({ ...v2(successContainer(`${E.reload} Reloaded command \`${cmdName}\``)), ephemeral: true });
    } catch (err) {
      await ctx.reply({ ...v2(errorContainer(`Failed to reload: ${err.message}`)), ephemeral: true });
    }
  }
};
