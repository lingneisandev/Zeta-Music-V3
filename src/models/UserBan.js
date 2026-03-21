'use strict';

const { Schema, model } = require('mongoose');

const userBanSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  reason: { type: String, default: null },
  bannedBy: { type: String, default: null }
}, { timestamps: true });

module.exports = model('UserBan', userBanSchema);
