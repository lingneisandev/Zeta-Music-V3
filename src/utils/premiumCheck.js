'use strict';

const Premium = require('../models/Premium');

const cacheStore = new Map();
const CACHE_TTL = 60000;

const isPremium = async (userId, guildId, client) => {
  const cacheKey = `${userId}_${guildId || 'none'}`;
  const cached = cacheStore.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  let premiumDoc = await Premium.findOne({ userId });

  if (!premiumDoc && guildId) {
    premiumDoc = await Premium.findOne({ guildId, tier: 'guild' });
  }

  if (!premiumDoc) {
    const result = { premium: false, tier: null, expiresAt: null };
    cacheStore.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  if (!premiumDoc.isLifetime && premiumDoc.expiresAt && premiumDoc.expiresAt < new Date()) {
    const result = { premium: false, tier: null, expiresAt: null };
    cacheStore.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  const result = {
    premium: true,
    tier: premiumDoc.tier,
    expiresAt: premiumDoc.isLifetime ? null : premiumDoc.expiresAt
  };

  cacheStore.set(cacheKey, { result, timestamp: Date.now() });
  return result;
};

const clearCache = (userId) => {
  for (const [key] of cacheStore) {
    if (key.startsWith(`${userId}_`)) {
      cacheStore.delete(key);
    }
  }
};

module.exports = { isPremium, clearCache };
