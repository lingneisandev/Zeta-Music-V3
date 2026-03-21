'use strict';

const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require('axios');
const { COLORS } = require('../../utils/embedBuilder');
const nodeManager = require('../../lavalink/nodeManager');
const Premium = require('../../models/Premium');

const NO_PING = { allowedMentions: { parse: [] } };
const PAGES = ['Overview', 'System', 'Music'];
const PAGE_ICONS = ['◈', '⬡', '♪'];
const PAGE_CLRS = ['#e94560', '#5865F2', '#1DB954'];

const formatUptime = (ms) => {
  if (!ms || ms < 0) return '0s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (sec || !parts.length) parts.push(`${sec}s`);
  return parts.join(' ');
};

const fetchImage = async (url) => {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    return await loadImage(Buffer.from(res.data));
  } catch (_) { return null; }
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const buildStatsCanvas = async (client, page, stats) => {
  const CW = 900, CH = 240;
  const canvas = createCanvas(CW, CH);
  const ctx = canvas.getContext('2d');

  const BG = '#0f0f13';
  const SURFACE = '#17171d';
  const T_PRI = '#ffffff';
  const T_SEC = 'rgba(255,255,255,0.4)';
  const T_DIM = 'rgba(255,255,255,0.18)';
  const color = PAGE_CLRS[page];

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CW, CH);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, CW, 2);
  ctx.fillRect(0, 0, 3, CH);

  let tabX = CW - 16;
  for (let i = PAGES.length - 1; i >= 0; i--) {
    ctx.font = 'bold 11px sans-serif';
    const tw = ctx.measureText(PAGES[i]).width;
    const pw = tw + 18;
    tabX -= pw;
    roundRect(ctx, tabX, 16, pw, 22, 4);
    ctx.fillStyle = i === page ? color : SURFACE;
    ctx.fill();
    ctx.fillStyle = i === page ? T_PRI : T_DIM;
    ctx.fillText(PAGES[i], tabX + 9, 31);
    tabX -= 8;
  }

  ctx.save();
  ctx.font = 'bold 110px sans-serif';
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.04;
  ctx.textAlign = 'right';
  ctx.fillText(PAGE_ICONS[page], CW - 16, CH + 16);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.restore();

  const block = (x, y, label, value, accent) => {
    roundRect(ctx, x, y, 196, 72, 8);
    ctx.fillStyle = SURFACE;
    ctx.fill();
    roundRect(ctx, x, y, 3, 72, 2);
    ctx.fillStyle = accent || color;
    ctx.fill();
    ctx.font = '11px sans-serif';
    ctx.fillStyle = T_SEC;
    ctx.fillText(label.toUpperCase(), x + 14, y + 21);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = T_PRI;
    ctx.fillText(String(value), x + 14, y + 52);
  };

  const bar = (x, y, w, ratio, accent) => {
    roundRect(ctx, x, y, w, 5, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    if (ratio > 0) {
      roundRect(ctx, x, y, Math.max(w * ratio, 5), 5, 2);
      ctx.fillStyle = accent || color;
      ctx.fill();
    }
  };

  if (page === 0) {
    const AV = 72, AVX = 28, AVY = 28;
    const avatarUrl = client?.user?.displayAvatarURL?.({ extension: 'png', size: 128 });
    if (avatarUrl) {
      const img = await fetchImage(avatarUrl);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(AVX + AV / 2, AVY + AV / 2, AV / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, AVX, AVY, AV, AV);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(AVX + AV / 2, AVY + AV / 2, AV / 2, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    const TX = AVX + AV + 18;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = T_PRI;
    ctx.fillText(client?.user?.username || 'Mizuki', TX, 58);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = T_SEC;
    ctx.fillText(client?.user?.id || '', TX, 78);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = T_DIM;
    ctx.fillText('UPTIME', TX, 104);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = T_PRI;
    ctx.fillText(stats.uptime, TX, 122);

    const RY = CH - 90;
    block(28, RY, 'Guilds', stats.guilds, '#5865F2');
    block(236, RY, 'Users', stats.users.toLocaleString(), '#e94560');
    block(444, RY, 'Commands', stats.commands, '#1DB954');
    block(652, RY, 'Premium', stats.premium, '#f1c40f');

  } else if (page === 1) {
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = T_PRI;
    ctx.fillText('System', 28, 56);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = T_SEC;
    ctx.fillText(`Node.js ${process.version}  ·  discord.js v${require('discord.js').version}`, 28, 76);

    const memRatio = parseFloat(stats.mem) / parseFloat(stats.memTotal);
    const pingRatio = Math.min(stats.wsping / 300, 1);
    const pingColor = stats.wsping < 100 ? '#1DB954' : stats.wsping < 200 ? '#f39c12' : '#e94560';

    ctx.font = '11px sans-serif';
    ctx.fillStyle = T_DIM;
    ctx.fillText('MEMORY', 28, 106);
    bar(28, 112, 420, memRatio, '#5865F2');
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = T_PRI;
    ctx.fillText(`${stats.mem} MB  /  ${stats.memTotal} MB`, 28, 136);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = T_DIM;
    ctx.fillText('WEBSOCKET LATENCY', 28, 162);
    bar(28, 168, 420, pingRatio, pingColor);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = pingColor;
    ctx.fillText(`${stats.wsping}ms`, 28, 192);

    block(CW - 228, 52, 'Players', stats.players, '#e94560');
    block(CW - 228, 136, 'Nodes', stats.nodes, '#5865F2');

  } else {
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = T_PRI;
    ctx.fillText('Music', 28, 56);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = T_SEC;
    ctx.fillText('Live statistics across all servers', 28, 76);

    block(28, 100, 'Guilds', stats.guilds, '#5865F2');
    block(236, 100, 'Users', stats.users.toLocaleString(), '#e94560');
    block(444, 100, 'Active Players', stats.players, '#1DB954');
    block(652, 100, 'Lavalink Nodes', stats.nodes, '#f39c12');
    block(28, CH - 90, 'Commands', stats.commands, '#7289DA');
    block(236, CH - 90, 'Premium', stats.premium, '#f1c40f');
  }

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(28, CH - 1, CW - 56, 1);

  return canvas.toBuffer('image/png');
};

const sep = () =>
  new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

const buildNav = (current, disabled = false) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('stats_prev')
      .setLabel('←')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || current === 0),
    new ButtonBuilder()
      .setCustomId('stats_page_indicator')
      .setLabel(`${PAGES[current]}  ·  ${current + 1} / ${PAGES.length}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('stats_next')
      .setLabel('→')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || current === PAGES.length - 1)
  );

const buildPage = async (client, page, stats) => {
  const buffer = await buildStatsCanvas(client, page, stats);
  const attachment = new AttachmentBuilder(buffer, { name: 'stats.png' });
  const container = new ContainerBuilder().setAccentColor(COLORS.info);

  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL('attachment://stats.png')
    )
  );

  container.addSeparatorComponents(sep());

  if (page === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${client.user.username}**  ·  \`${client.user.id}\`\n` +
        `Created <t:${stats.createdAt}:R>  ·  Uptime \`${stats.uptime}\``
      )
    );
  } else if (page === 1) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Memory**  \`${stats.mem} / ${stats.memTotal} MB\`\n` +
        `**Node.js**  \`${process.version}\`  ·  **discord.js**  \`v${require('discord.js').version}\`\n` +
        `**WebSocket**  \`${stats.wsping}ms\``
      )
    );
  } else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Guilds**  \`${stats.guilds}\`  ·  **Users**  \`${stats.users.toLocaleString()}\`\n` +
        `**Active Players**  \`${stats.players}\`  ·  **Nodes**  \`${stats.nodes}\`\n` +
        `**Commands**  \`${stats.commands}\`  ·  **Premium**  \`${stats.premium}\``
      )
    );
  }

  container.addActionRowComponents(buildNav(page));

  return { files: [attachment], components: [container], flags: MessageFlags.IsComponentsV2, ...NO_PING };
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Show bot information and stats'),
  aliases: ['bi', 'about', 'stats', 'info'],
  premiumOnly: false,
  djOnly: false,
  cooldown: 5,
  execute: async (ctx) => {
    const { client } = ctx;
    const shoukaku = nodeManager.getShoukaku();

    let premium = 0;
    try { premium = await Premium.countDocuments({}); } catch (_) { }

    const stats = {
      uptime: formatUptime(client.uptime || 0),
      mem: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
      memTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1),
      guilds: client.guilds.cache.size,
      users: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      players: client.players?.size ?? 0,
      commands: client.commands?.size ?? 0,
      nodes: shoukaku?.nodes.size ?? 0,
      wsping: client.ws.ping,
      premium,
      createdAt: Math.floor(client.user.createdAt.getTime() / 1000)
    };

    let page = 0;
    const msg = await ctx.reply(await buildPage(client, page, stats));

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.user.id && ['stats_prev', 'stats_next'].includes(i.customId),
      time: 120_000
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'stats_next') page = Math.min(page + 1, PAGES.length - 1);
      if (i.customId === 'stats_prev') page = Math.max(page - 1, 0);
      await i.update(await buildPage(client, page, stats));
    });

    collector.on('end', async () => {
      try {
        const last = await buildPage(client, page, stats);
        last.components[0].spliceActionRowComponents(-1, 1, buildNav(page, true));
        await msg.edit(last);
      } catch (_) { }
    });
  }
};