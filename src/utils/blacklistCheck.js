'use strict';

const Guild = require('../models/Guild');
const UserBan = require('../models/UserBan');

const guildBanCache = new Map();
const userBanCache = new Map();
const CACHE_TTL = 30000;

const isGuildBanned = async (guildId) => {
  const cached = guildBanCache.get(guildId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const guildDoc = await Guild.findOne({ guildId });
  const result = guildDoc ? guildDoc.isBlacklisted === true : false;
  guildBanCache.set(guildId, { result, timestamp: Date.now() });
  return result;
};

const isUserBanned = async (userId) => {
  const cached = userBanCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const ban = await UserBan.findOne({ userId });
  const result = !!ban;
  userBanCache.set(userId, { result, timestamp: Date.now() });
  return result;
};

const clearGuildBanCache = (guildId) => {
  guildBanCache.delete(guildId);
};

const clearUserBanCache = (userId) => {
  userBanCache.delete(userId);
};

module.exports = { isGuildBanned, isUserBanned, clearGuildBanCache, clearUserBanCache };
