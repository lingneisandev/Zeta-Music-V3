'use strict';

const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require('axios');
const { filterContent } = require('./mentionFilter');

const W = 512;
const H = 512;

const ACCENT   = '#e94560';
const BG       = '#0f0f13';
const SURFACE  = '#17171d';
const TEXT_PRI = '#ffffff';
const TEXT_SEC = 'rgba(255,255,255,0.45)';
const TRACK_BG = 'rgba(255,255,255,0.08)';
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

const fetchImage = async (url) => {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    return await loadImage(Buffer.from(res.data));
  } catch (_) {
    return null;
  }
};
const buildNowPlayingCard = async (track, player, requester) => {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const thumbImg = track.info.artworkUrl ? await fetchImage(track.info.artworkUrl) : null;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle blurred backdrop
  if (thumbImg) {
    ctx.save();
    ctx.filter = 'blur(50px) brightness(0.15) saturate(1.4)';
    ctx.drawImage(thumbImg, -40, -40, W + 80, H + 80);
    ctx.restore();
  }

  // Artwork
  const PAD = 40;
  const AS = W - PAD * 2;
  const AR = 24;

  if (thumbImg) {
    ctx.save();
    roundRect(ctx, PAD, PAD, AS, AS, AR);
    ctx.clip();
    ctx.drawImage(thumbImg, PAD, PAD, AS, AS);
    ctx.restore();

    // Premium Border
    ctx.save();
    roundRect(ctx, PAD, PAD, AS, AS, AR);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  } else {
    // Fallback Icon
    ctx.save();
    roundRect(ctx, PAD, PAD, AS, AS, AR);
    ctx.fillStyle = SURFACE;
    ctx.fill();
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♪', W / 2, H / 2 + 40);
    ctx.restore();
  }

  return canvas.toBuffer('image/png');
};

// ── Help Banner ───────────────────────────────────────────────────────────────

const buildHelpBanner = async () => {
  const BW = 900, BH = 220;
  const canvas = createCanvas(BW, BH);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, BW, BH);

  // Subtle dark surface band
  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, BH - 60, BW, 60);

  // Left accent bar
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, 3, BH);

  // Thin top rule
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, BW, 1);

  // Waveform bars
  const BAR_COUNT = 48;
  const BAR_W = 4;
  const GAP = 13;
  const TOTAL = BAR_COUNT * (BAR_W + GAP);
  const startX = (BW - TOTAL) / 2;

  for (let i = 0; i < BAR_COUNT; i++) {
    const x = startX + i * (BAR_W + GAP);
    const h = 10 + (Math.sin(i * 0.45 + 1.2) * 0.5 + 0.5) * 48 + Math.sin(i * 0.9) * 14;
    const alpha = 0.12 + (i / BAR_COUNT) * 0.1;
    roundRect(ctx, x, BH - h, BAR_W, h, 2);
    ctx.fillStyle = `rgba(233,69,96,${alpha})`;
    ctx.fill();
  }

  // Title
  ctx.fillStyle = TEXT_PRI;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px'; // If supported, otherwise I'll just draw it
  ctx.fillText('ZETA MUSIC', BW / 2, 82);

  // Underline
  ctx.fillStyle = ACCENT;
  ctx.fillRect(BW / 2 - 120, 92, 240, 2);

  // Subtitle
  ctx.fillStyle = TEXT_SEC;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('P R E M I U M   M U S I C   E X P E R I E N C E', BW / 2, 122);

  // Command hints
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '12px sans-serif';
  ctx.fillText('/play  ·  /queue  ·  /filters  ·  /lyrics  ·  and more', BW / 2, 142);

  // Separator
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(60, 156, BW - 120, 1);

  ctx.textAlign = 'left';

  return canvas.toBuffer('image/png');
};

module.exports = { buildNowPlayingCard, buildHelpBanner };
