'use strict';

const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const config = require('../../config');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deploy')
    .setDescription('Deploy slash commands')
    .addStringOption((opt) => opt.setName('scope').setDescription('Deploy scope').setRequired(true)
      .addChoices(
        { name: 'Global', value: 'global' },
        { name: 'Guild', value: 'guild' }
      )),
  aliases: [],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 30,
  execute: async (ctx) => {
    const scope = ctx.isInteraction
      ? ctx.options.getString('scope')
      : (ctx.args[0] || 'guild').toLowerCase();

    const commands = [];
    for (const [, cmd] of ctx.client.commands) {
      if (cmd.data && cmd.data.toJSON) {
        commands.push(cmd.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
      if (scope === 'global') {
        await rest.put(
          Routes.applicationCommands(config.clientId),
          { body: commands }
        );
      } else {
        if (!ctx.guild) {
          return await ctx.reply({ ...v2(errorContainer('Guild deployment requires being in a server.')), ephemeral: true });
        }
        await rest.put(
          Routes.applicationGuildCommands(config.clientId, ctx.guild.id),
          { body: commands }
        );
      }

      await ctx.reply({
        ...v2(successContainer(`${E.deploy} Deployed **${commands.length}** commands (${scope})`)),
        ephemeral: true
      });
    } catch (err) {
      await ctx.reply({ ...v2(errorContainer(`Deploy failed: ${err.message}`)), ephemeral: true });
    }
  }
};
