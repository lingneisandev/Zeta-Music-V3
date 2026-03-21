'use strict';

const { Schema, model } = require('mongoose');

const noPrefixSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, default: null },
  isLifetime: { type: Boolean, default: false },
  grantedBy: { type: String, required: true },
}, { timestamps: true });

module.exports = model('NoPrefix', noPrefixSchema);
