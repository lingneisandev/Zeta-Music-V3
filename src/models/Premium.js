'use strict';

const { Schema, model } = require('mongoose');

const premiumSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  guildId: { type: String, default: null },
  tier: { type: String, enum: ['user', 'guild'], default: 'user' },
  expiresAt: { type: Date, default: null },
  isLifetime: { type: Boolean, default: false },
  redeemedKey: { type: String, default: null },
  grantedBy: { type: String, enum: ['key', 'dev'], default: 'key' }
}, { timestamps: true });

module.exports = model('Premium', premiumSchema);
