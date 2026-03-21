'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const E = require('../../emoji');

const SUPPORTED_LANGUAGES = ['en', 'hi', 'es', 'fr', 'de'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('Set the bot language for this server')
    .addSubcommand((sub) => sub.setName('set').setDescription('Set language')
      .addStringOption((opt) => opt.setName('lang').setDescription('Language code').setRequired(true)
        .addChoices(
          { name: 'English', value: 'en' },
          { name: 'Hindi', value: 'hi' },
          { name: 'Spanish', value: 'es' },
          { name: 'French', value: 'fr' },
          { name: 'German', value: 'de' }
        ))),
  aliases: ['lang'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return await ctx.reply({ ...v2(errorContainer('You need the **Manage Server** permission.')), ephemeral: true });
    }

    const lang = ctx.isInteraction
      ? ctx.options.getString('lang')
      : (ctx.args[1] || ctx.args[0] || '').toLowerCase();

    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return await ctx.reply({
        ...v2(errorContainer(`Invalid language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`)),
        ephemeral: true
      });
    }

    await Guild.findOneAndUpdate(
      { guildId: ctx.guild.id },
      { guildId: ctx.guild.id, language: lang },
      { upsert: true }
    );

    const langNames = { en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German' };
    await ctx.reply(v2(successContainer(`${E.check} Language set to **${langNames[lang]}** (\`${lang}\`)`)));
  }
};
