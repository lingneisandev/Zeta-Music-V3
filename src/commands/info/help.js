'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  AttachmentBuilder,
} = require('discord.js');
const { buildHelpBanner } = require('../../utils/canvasBuilder');
const E = require('../../emoji');

const SYMBOLS = {
  info: '<:information_1:1484824669302427719>',
  music: '<:music:1484824641347260447>',
  premium: '<:like:1484824681943928902>',
  config: '<:configuration:1484826010590646343>',
  folder: '📁',
  arrow: '›',
  dot: '•',
  cross: E.cross,
  check: '<:emoji_29:1484824707516600382>',
  reset: '↺',
};

const CATEGORIES = {
  music: {
    symbol: SYMBOLS.music,
    label: 'Music',
    commands: [
      { name: 'play', usage: '/play <query> [source]', desc: 'Play a song or add to queue' },
      { name: 'skip', usage: '/skip [amount]', desc: 'Skip tracks' },
      { name: 'stop', usage: '/stop', desc: 'Stop and disconnect' },
      { name: 'queue', usage: '/queue [page]', desc: 'View the queue' },
      { name: 'nowplaying', usage: '/nowplaying', desc: 'Show current track' },
      { name: 'pause', usage: '/pause', desc: 'Pause playback' },
      { name: 'resume', usage: '/resume', desc: 'Resume playback' },
      { name: 'volume', usage: '/volume <1-100>', desc: 'Set volume' },
      { name: 'seek', usage: '/seek <time>', desc: 'Seek to position' },
      { name: 'loop', usage: '/loop <off|track|queue>', desc: 'Set loop mode' },
      { name: 'shuffle', usage: '/shuffle', desc: 'Shuffle the queue' },
      { name: 'remove', usage: '/remove <position>', desc: 'Remove a track' },
      { name: 'move', usage: '/move <from> <to>', desc: 'Move a track' },
      { name: 'lyrics', usage: '/lyrics [query]', desc: 'Get lyrics' },
      { name: 'autoplay', usage: '/autoplay', desc: 'Toggle autoplay (Premium)' },
      { name: '247', usage: '/247', desc: 'Toggle 24/7 mode (Premium)' },
      { name: 'source', usage: '/source [platform]', desc: 'Change source' },
      { name: 'filters', usage: '/filters <preset>', desc: 'Audio filters (Premium)' },
    ],
  },
  premium: {
    symbol: SYMBOLS.premium,
    label: 'Premium',
    commands: [
      { name: 'redeem', usage: '/redeem <key>', desc: 'Redeem a premium key' },
      { name: 'premiumstatus', usage: '/premiumstatus', desc: 'Check premium status' },
      { name: 'perks', usage: '/perks', desc: 'View premium perks' },
      { name: 'avatar', usage: '/avatar set/reset', desc: 'Custom bot avatar' },
      { name: 'banner', usage: '/banner set/reset', desc: 'Custom bot banner' },
    ],
  },
  config: {
    symbol: SYMBOLS.config,
    label: 'Config',
    commands: [
      { name: 'prefix', usage: '/prefix set/reset', desc: 'Set server prefix' },
      { name: 'dj', usage: '/dj set/remove', desc: 'Set DJ role' },
      { name: 'channel', usage: '/channel lock/unlock', desc: 'Lock music channel' },
      { name: 'language', usage: '/language set <lang>', desc: 'Set language' },
      { name: 'settings', usage: '/settings', desc: 'View server settings' },
    ],
  },
  info: {
    symbol: SYMBOLS.info,
    label: 'Info',
    commands: [
      { name: 'help', usage: '/help [category]', desc: 'Show this menu' },
      { name: 'ping', usage: '/ping', desc: 'Check latency' },
      { name: 'invite', usage: '/invite', desc: 'Get invite link' },
      { name: 'botinfo', usage: '/botinfo', desc: 'Bot information' },
      { name: 'serverinfo', usage: '/serverinfo', desc: 'Server information' },
    ],
  },
  spotify: {
    symbol: E.spotify,
    label: 'Spotify',
    commands: [
      { name: 'spotify login', usage: '/spotify login', desc: 'Link your Spotify account' },
      { name: 'spotify callback', usage: '/spotify callback <code>', desc: 'Complete login process' },
      { name: 'spotify playlist', usage: '/spotify playlist', desc: 'Fetch personal playlists' },
    ],
  },
};

const capitalize = (str) => {
  if (!str || typeof str !== 'string') return 'Unknown';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getThumbnail = (client) =>
  client?.config?.assets?.helpThumbnail ||
  client?.config?.assets?.defaultThumbnail ||
  client?.user?.displayAvatarURL({ size: 512, extension: 'png' });

const createMainContainer = (client, prefix) => {
  const categoryKeys = Object.keys(CATEGORIES);
  const totalCommands = Object.values(CATEGORIES).reduce((sum, c) => sum + c.commands.length, 0);

  let content = `**Command Overview**\n\n`;
  content += `┌─ **${SYMBOLS.info} Statistics**\n`;
  content += `├─ Total Commands: ${totalCommands}\n`;
  content += `├─ Categories: ${categoryKeys.length}\n`;
  content += `└─ Prefix: \`${prefix}\` ${SYMBOLS.dot} Mention: \`@${client.user.username}\`\n\n`;
  content += `**Available Categories:**\n`;

  categoryKeys.forEach((key, index) => {
    const cat = CATEGORIES[key];
    const isLast = index === categoryKeys.length - 1;
    const pre = isLast ? '└─' : '├─';
    content += `${pre} **${cat.symbol} ${cat.label}** (${cat.commands.length} commands)\n`;
  });

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### Zeta MUSIC`),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  );

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(getThumbnail(client)));

  container.addSectionComponents(section);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('Select a category')
        .addOptions(
          categoryKeys.map((key) => ({
            label: CATEGORIES[key].label,
            value: key,
            emoji: CATEGORIES[key].symbol,
            description: `${CATEGORIES[key].commands.length} commands`,
          })),
        ),
    ),
  );

  return container;
};

const createCategoryContainer = (client, categoryKey) => {
  const cat = CATEGORIES[categoryKey];
  if (!cat) return createErrorContainer('Category not found.');

  let content = `**${capitalize(categoryKey)} Category**\n\n`;

  cat.commands.forEach((cmd, index) => {
    const isLast = index === cat.commands.length - 1;
    const pre = isLast ? '└──' : '├──';
    content += `${pre} ${SYMBOLS.info} \`${cmd.name}\`\n`;
  });

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`${cat.symbol} **${cat.label} Commands**`),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  );

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(getThumbnail(client)));

  container.addSectionComponents(section);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`help_command_select_${categoryKey}`)
        .setPlaceholder('Select a command for detailed info')
        .addOptions(
          cat.commands.slice(0, 25).map((cmd) => ({
            label: cmd.name,
            value: cmd.name,
            emoji: SYMBOLS.info,
            description: cmd.desc ? cmd.desc.slice(0, 100) : 'No description',
          })),
        ),
    ),
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_close')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger),
    ),
  );

  return container;
};

const createCommandContainer = (client, categoryKey, commandName) => {
  const cat = CATEGORIES[categoryKey];
  const cmd = cat?.commands.find((c) => c.name === commandName);
  if (!cmd) return createErrorContainer('Command not found.');

  let content = `**Command Information**\n\n`;
  content += `┌─ **${SYMBOLS.info} Basic Info**\n`;
  content += `├─ Description: ${cmd.desc || 'No description provided'}\n`;
  content += `├─ Usage: \`${cmd.usage || cmd.name}\`\n`;
  content += `└─ Category: ${capitalize(categoryKey)}\n`;

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`${SYMBOLS.info} **Command: ${cmd.name}**`),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  );

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(getThumbnail(client)));

  container.addSectionComponents(section);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`help_back_category_${categoryKey}`)
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Home')
        .setStyle(ButtonStyle.Primary),
    ),
  );

  return container;
};

const createErrorContainer = (msg) => {
  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`${SYMBOLS.cross} **Error**`),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  );

  const content =
    `**Something went wrong**\n\n` +
    `┌─ **${SYMBOLS.info} Issue:** ${msg}\n` +
    `└─ **${SYMBOLS.reset} Action:** Try again or contact support\n\n` +
    `*Please check your input and try again*`;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(content),
  );

  return container;
};

const setupCollector = (helpMessage, userId, client, prefix) => {
  const filter = (i) => i.user.id === userId;
  const collector = helpMessage.createMessageComponentCollector({ filter, time: 300_000 });

  collector.on('collect', async (interaction) => {
    try {
      await interaction.deferUpdate();

      if (interaction.customId === 'help_close') {
        await interaction.deleteReply().catch(() => { });
        collector.stop();
        return;
      }

      if (interaction.customId === 'help_back_main') {
        await interaction.editReply({
          components: [createMainContainer(client, prefix)],
        });
        return;
      }

      if (interaction.customId === 'help_category_select') {
        const categoryKey = interaction.values[0];
        await interaction.editReply({
          components: [createCategoryContainer(client, categoryKey)],
        });
        return;
      }

      if (interaction.customId.startsWith('help_command_select_')) {
        const categoryKey = interaction.customId.replace('help_command_select_', '');
        const commandName = interaction.values[0];
        await interaction.editReply({
          components: [createCommandContainer(client, categoryKey, commandName)],
        });
        return;
      }

      if (interaction.customId.startsWith('help_back_category_')) {
        const categoryKey = interaction.customId.replace('help_back_category_', '');
        await interaction.editReply({
          components: [createCategoryContainer(client, categoryKey)],
        });
        return;
      }
    } catch (err) {
      try {
        await interaction.followUp({
          content: 'An error occurred while processing your request. Please try again.',
          ephemeral: true,
        });
      } catch (_) { }
    }
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'limit' || reason === 'messageDelete') return;
    try {
      const fetched = await helpMessage.fetch().catch(() => null);
      if (!fetched) return;
      await fetched.edit({ components: fetched.components.map((c) => c.toJSON()) });
    } catch (_) { }
  });
};

const renderHelp = async (client, categoryKey, prefix) => {
  const bannerBuffer = await buildHelpBanner();
  const bannerAttachment = new AttachmentBuilder(bannerBuffer, { name: 'help_banner.png' });

  let container;

  if (categoryKey && CATEGORIES[categoryKey]) {
    container = createCategoryContainer(client, categoryKey);
  } else {
    const mainContainer = new ContainerBuilder();

    mainContainer.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://help_banner.png'),
      ),
    );

    mainContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small),
    );

    const categoryKeys = Object.keys(CATEGORIES);
    const totalCommands = Object.values(CATEGORIES).reduce((sum, c) => sum + c.commands.length, 0);

    let content = `**Command Overview**\n\n`;
    content += `┌─ **${SYMBOLS.info} Statistics**\n`;
    content += `├─ Total Commands: ${totalCommands}\n`;
    content += `├─ Categories: ${categoryKeys.length}\n`;
    content += `└─ Prefix: \`${prefix}\` ${SYMBOLS.dot} Mention: \`@${client.user.username}\`\n\n`;
    content += `**Available Categories:**\n`;

    categoryKeys.forEach((key, index) => {
      const cat = CATEGORIES[key];
      const isLast = index === categoryKeys.length - 1;
      const pre = isLast ? '└─' : '├─';
      content += `${pre} **${cat.symbol} ${cat.label}** (${cat.commands.length} commands)\n`;
    });

    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(getThumbnail(client)));

    mainContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${SYMBOLS.info} **Help Menu**`),
    );

    mainContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    mainContainer.addSectionComponents(section);

    mainContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    );

    mainContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_category_select')
          .setPlaceholder('Select a category')
          .addOptions(
            categoryKeys.map((key) => ({
              label: CATEGORIES[key].label,
              value: key,
              emoji: CATEGORIES[key].symbol,
              description: `${CATEGORIES[key].commands.length} commands`,
              default: categoryKey === key,
            })),
          ),
      ),
    );

    container = mainContainer;
  }

  return {
    components: [container],
    files: [bannerAttachment],
    flags: MessageFlags.IsComponentsV2,
  };
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all commands')
    .addStringOption((opt) =>
      opt
        .setName('category')
        .setDescription('Command category')
        .setRequired(false)
        .addChoices(
          { name: 'Music', value: 'music' },
          { name: 'Premium', value: 'premium' },
          { name: 'Config', value: 'config' },
          { name: 'Info', value: 'info' },
          { name: 'Spotify', value: 'spotify' },
        ),
    ),
  aliases: ['h'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 3,

  execute: async (ctx) => {
    const prefix = ctx.client.config.defaultPrefix || '!';
    const categoryKey = ctx.isInteraction
      ? ctx.options.getString('category')
      : (ctx.args[0] || '').toLowerCase();

    const response = await renderHelp(ctx.client, categoryKey, prefix);

    const helpMessage = ctx.isInteraction
      ? await ctx.interaction.reply({ ...response, fetchReply: true })
      : await ctx.reply(response);

    if (helpMessage) {
      setupCollector(helpMessage, ctx.user.id, ctx.client, prefix);
    }
  },

  renderHelp,
};
