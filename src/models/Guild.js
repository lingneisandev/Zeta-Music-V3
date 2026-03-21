'use strict';

const { Schema, model } = require('mongoose');

const guildSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  djRoleId: { type: String, default: null },
  musicChannelId: { type: String, default: null },
  language: { type: String, default: 'en' },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: { type: Date, default: null },
  settings: {
    autoplay: { type: Boolean, default: false },
    defaultVolume: { type: Number, default: 50 },
    defaultSource: { type: String, default: 'youtube' },
    announceNowPlaying: { type: Boolean, default: true },
    stayInVC: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = model('Guild', guildSchema);
