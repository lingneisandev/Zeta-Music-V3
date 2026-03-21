'use strict';

const nodeManager = require('./nodeManager');
const E = require('../emoji');

const SOURCES = {
  youtube: 'ytsearch',
  soundcloud: 'scsearch',
  spotify: 'spsearch',
  deezer: 'dzsearch',
  applemusic: 'amsearch',
  http: 'http'
};

const FREE_SOURCES = ['youtube', 'soundcloud', 'http'];
const PREMIUM_SOURCES = ['spotify', 'deezer', 'applemusic'];

const resolve = async (query, source, isPremium) => {
  source = source || 'youtube';

  if (PREMIUM_SOURCES.includes(source) && !isPremium) {
    throw new Error(`${E.premium} The source **${source}** is a premium feature. Upgrade to Premium to unlock it!`);
  }

  const shoukaku = nodeManager.getShoukaku();
  if (!shoukaku) {
    throw new Error('Lavalink is not initialized');
  }

  const node = shoukaku.nodes.values().next().value;
  if (!node) {
    throw new Error('No available Lavalink nodes');
  }

  let searchQuery = query;

  if (!query.startsWith('http://') && !query.startsWith('https://')) {
    const prefix = SOURCES[source] || SOURCES.youtube;
    searchQuery = `${prefix}:${query}`;
  }

  const result = await node.rest.resolve(searchQuery);
  return result;
};

module.exports = { resolve, SOURCES, FREE_SOURCES, PREMIUM_SOURCES };
