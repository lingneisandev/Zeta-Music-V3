'use strict';

const axios = require('axios');
const config = require('../config');
const Spotify = require('../models/Spotify');
const { log } = require('./logger');

const REDIRECT_URI = 'https://discord.com/api/oauth2/authorize'; // Placeholder, user should set this in dashboard
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

const spotifyUtil = {
  getAuthUrl: (userId) => {
    const params = new URLSearchParams({
      client_id: config.spotifyClientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: 'user-read-private user-read-email playlist-read-private playlist-read-collaborative',
      state: userId
    });
    return `${AUTH_URL}?${params.toString()}`;
  },

  exchangeCode: async (userId, code) => {
    try {
      const response = await axios.post(TOKEN_URL, new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }), {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      const profile = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      await Spotify.findOneAndUpdate(
        { userId },
        {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          spotifyId: profile.data.id,
          displayName: profile.data.display_name
        },
        { upsert: true, new: true }
      );

      return profile.data;
    } catch (err) {
      log.error(`Spotify Token Exchange Error: ${err.response?.data?.error || err.message}`);
      throw err;
    }
  },

  getAccessToken: async (userId) => {
    let tokenData = await Spotify.findOne({ userId });
    if (!tokenData) return null;

    if (new Date() > tokenData.expiresAt) {
      try {
        const response = await axios.post(TOKEN_URL, new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refreshToken
        }), {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const { access_token, expires_in } = response.data;
        tokenData.accessToken = access_token;
        tokenData.expiresAt = new Date(Date.now() + expires_in * 1000);
        await tokenData.save();
      } catch (err) {
        log.error(`Spotify Token Refresh Error: ${err.response?.data?.error || err.message}`);
        return null;
      }
    }
    return tokenData.accessToken;
  },

  getUserPlaylists: async (userId) => {
    const token = await spotifyUtil.getAccessToken(userId);
    if (!token) return null;

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      log.error(`Spotify Get Playlists Error: ${err.message}`);
      return null;
    }
  },

  getPlaylistTracks: async (userId, playlistId) => {
    const token = await spotifyUtil.getAccessToken(userId);
    if (!token) return null;

    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.items.map(i => ({
        id: i.track.id,
        title: i.track.name,
        author: i.track.artists.map(a => a.name).join(', '),
        thumbnail: i.track.album.images[0]?.url,
        duration: i.track.duration_ms
      }));
    } catch (err) {
      log.error(`Spotify Get Tracks Error: ${err.message}`);
      return null;
    }
  },

  getRecommendations: async (userId, seedTrackId) => {
    const token = await spotifyUtil.getAccessToken(userId);
    if (!token) return null;

    try {
      const response = await axios.get('https://api.spotify.com/v1/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { seed_tracks: seedTrackId, limit: 1 }
      });
      const rec = response.data.tracks[0];
      if (!rec) return null;

      return {
        id: rec.id,
        title: rec.name,
        author: rec.artists.map(a => a.name).join(', '),
        thumbnail: rec.album.images[0]?.url,
        duration: rec.duration_ms
      };
    } catch (err) {
      log.error(`Spotify Recommendations Error: ${err.message}`);
      return null;
    }
  }
};

module.exports = spotifyUtil;
