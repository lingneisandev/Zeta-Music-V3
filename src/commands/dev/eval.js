'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { devContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const config = require('../../config');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Execute JavaScript code')
    .addStringOption((opt) => opt.setName('code').setDescription('Code to execute').setRequired(true)),
  aliases: ['ev'],
  premiumOnly: false,
  ownerOnly: true,
  djOnly: false,
  cooldown: 0,
  execute: async (ctx) => {
    const code = ctx.isInteraction
      ? ctx.options.getString('code')
      : ctx.args.join(' ');

    if (!code) {
      return await ctx.reply({ ...v2(errorContainer('Please provide code to evaluate.')), ephemeral: true });
    }

    let output;
    let isError = false;

    try {
      const result = await eval(`(async () => { ${code} })()`);
      output = typeof result === 'string' ? result : require('util').inspect(result, { depth: 2 });
    } catch (err) {
      output = err.message;
      isError = true;
    }

    output = output.replace(new RegExp(config.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[REDACTED]');

    if (output.length > 1900) {
      output = output.substring(0, 1900) + '...';
    }

    await ctx.reply({
      ...v2(devContainer(
        `${E.eval} Eval`,
        `**Input:**\n\`\`\`js\n${code.substring(0, 500)}\n\`\`\`\n**Output${isError ? ' (Error)' : ''}:**\n\`\`\`js\n${output}\n\`\`\``
      )),
      ephemeral: true
    });
  }
};
