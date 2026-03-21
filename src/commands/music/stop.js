'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { successContainer, errorContainer, v2 } = require('../../utils/embedBuilder');
const { checkVC, checkSameVC } = require('../../utils/permissions');
const playerManager = require('../../lavalink/playerManager');
const { buildConfirmRow } = require('../../components/confirmModal');
const E = require('../../emoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and disconnect the bot'),
  aliases: ['dc', 'leave'],
  premiumOnly: false,
  djOnly: true,
  cooldown: 3,
  execute: async (ctx) => {
    if (!checkVC(ctx.member)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in a voice channel.')), ephemeral: true });
    }
    if (!checkSameVC(ctx.member, ctx.client)) {
      return await ctx.reply({ ...v2(errorContainer('You need to be in the same voice channel as the bot.')), ephemeral: true });
    }

    const player = playerManager.getPlayer(ctx.client, ctx.guild.id);
    if (!player) {
      return await ctx.reply({ ...v2(errorContainer('No music is currently playing.')), ephemeral: true });
    }

    if (ctx.isInteraction) {
      const {
        ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
        SeparatorSpacingSize, MessageFlags
      } = require('discord.js');

      const container = new ContainerBuilder()
        .setAccentColor(0xff3333);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${E.stop} Stop Player`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Are you sure you want to stop the music and clear the queue?')
      );

      const confirmRow = buildConfirmRow('stop');
      container.addActionRowComponents(confirmRow);

      const msg = await ctx.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      try {
        const filter = (i) => i.user.id === ctx.user.id && i.customId.startsWith('confirm_');
        const collected = await msg.awaitMessageComponent({ filter, time: 15000 });

        if (collected.customId === 'confirm_yes_stop') {
          await playerManager.destroyPlayer(ctx.client, ctx.guild.id);
          await collected.update({
            ...v2(successContainer(`${E.stop} Player stopped and disconnected.`)),
            components: []
          });
        } else {
          await collected.update({
            ...v2(successContainer(`${E.cross} Stop cancelled.`)),
            components: []
          });
        }
      } catch (_) {
        await playerManager.destroyPlayer(ctx.client, ctx.guild.id);
      }
    } else {
      await playerManager.destroyPlayer(ctx.client, ctx.guild.id);
      await ctx.reply(v2(successContainer(`${E.stop} Player stopped and disconnected.`)));
    }
  }
};
