'use strict';

const { ActivityType, Events } = require('discord.js');
const { log } = require('../utils/logger');
const devLogger = require('../utils/devLogger');
const E = require('../emoji');

const { purgeExpired } = require('../utils/noPrefixCheck');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute: async (client) => {
    client.user.setPresence({
      activities: [{
        name: ` /play | z!play `,
        type: ActivityType.Listening
      }],
      status: 'idle'
    });

    log.ready(`${client.user.tag} is online`);
    await devLogger.sendReady(client);

    await purgeExpired(client);
    setInterval(() => purgeExpired(client), 10 * 60 * 1000);
  }
};
