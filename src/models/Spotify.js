'use strict';

const { Schema, model } = require('mongoose');

const spotifySchema = new Schema({
  userId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  spotifyId: { type: String, default: null },
  displayName: { type: String, default: null }
}, { timestamps: true });

module.exports = model('Spotify', spotifySchema);
