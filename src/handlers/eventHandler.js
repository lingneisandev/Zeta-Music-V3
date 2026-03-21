'use strict';

const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');
const E = require('../emoji');

const loadEvents = (client) => {
  const eventsDir = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'));
  let count = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsDir, file);
    const event = require(filePath);

    if (!event.name || !event.execute) continue;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }

    log.event(`Registered event: ${event.name}`);
    count++;
  }

  log.event(`Loaded ${count} events`);
  return count;
};

module.exports = { loadEvents };
