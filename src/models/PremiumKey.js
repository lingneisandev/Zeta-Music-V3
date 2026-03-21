'use strict';

const { Schema, model } = require('mongoose');

const premiumKeySchema = new Schema({
  key: { type: String, required: true, unique: true },
  tier: { type: String, enum: ['user', 'guild'], default: 'user' },
  durationDays: { type: Number, required: true },
  isUsed: { type: Boolean, default: false },
  usedBy: { type: String, default: null },
  usedAt: { type: Date, default: null },
  generatedBy: { type: String, default: null }
}, { timestamps: true });

module.exports = model('PremiumKey', premiumKeySchema);
