'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { COLORS } = require('../../utils/embedBuilder');
const config = require('../../config');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot invite link'),
  aliases: ['inv'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&permissions=3427328&scope=bot%20applications.commands`;

    const container = new ContainerBuilder()
      .setAccentColor(COLORS.info);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${E.music} Invite Mizuki`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${E.arrow} **[Add to your server](${inviteUrl})**\n` +
        `${E.arrow} **[Support Server](https://discord.gg/aJHcQvrdxe)**\n` +
        `${E.arrow} **[YouTube](https://youtube.com/@titanxdev)**`
      )
    );

    await ctx.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
