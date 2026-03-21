'use strict';

const NoPrefix = require('../models/NoPrefix');
const { musicContainer, v2 } = require('./embedBuilder');
const E = require('../emoji');

const cache = new Map();

const checkNoPrefix = async (userId) => {
  if (cache.has(userId)) {
    const data = cache.get(userId);
    if (data.isLifetime || !data.expiresAt || data.expiresAt > Date.now()) {
      return true;
    }
    cache.delete(userId);
  }

  const np = await NoPrefix.findOne({ userId });
  if (np) {
    if (np.isLifetime || !np.expiresAt || np.expiresAt > Date.now()) {
      cache.set(userId, {
        isLifetime: np.isLifetime,
        expiresAt: np.expiresAt
      });
      return true;
    } else {
      await NoPrefix.deleteOne({ userId });
    }
  }

  return false;
};

const purgeExpired = async (client) => {
  try {
    const expired = await NoPrefix.find({
      isLifetime: false,
      expiresAt: { $lt: new Date() }
    });

    if (expired.length > 0) {
      for (const np of expired) {
        try {
          const user = await client.users.fetch(np.userId).catch(() => null);
          if (user) {
            const dmEmbed = musicContainer(
              `${E.cross} No-Prefix Expired`,
              `Your **No-Prefix** status has expired. You will need to use full command prefixes now.`
            );
            await user.send({ ...v2(dmEmbed) }).catch(() => {});
          }
        } catch (_) {}
        
        await NoPrefix.deleteOne({ userId: np.userId });
        cache.delete(np.userId);
      }
    }
  } catch (err) {
    console.error('Failed to purge expired noprefix:', err);
  }
};

module.exports = { checkNoPrefix, purgeExpired };
