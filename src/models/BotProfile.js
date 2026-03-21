'use strict';

const { Schema, model } = require('mongoose');

const botProfileSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  avatarUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  webhookId: { type: String, default: null },
  webhookToken: { type: String, default: null }
}, { timestamps: true });

module.exports = model('BotProfile', botProfileSchema);
