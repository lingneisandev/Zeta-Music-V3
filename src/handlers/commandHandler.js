'use strict';

const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');
const E = require('../emoji');

const loadCommands = (client) => {
  const commandsDir = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsDir);
  let count = 0;

  for (const category of categories) {
    const categoryPath = path.join(commandsDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      if (!command.data || !command.execute) continue;

      const commandName = command.data.name || command.data.toJSON?.()?.name;
      if (!commandName) continue;

      command.category = category;
      command.filePath = filePath;
      client.commands.set(commandName, command);

      if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          client.aliases.set(alias, commandName);
        }
      }

      count++;
    }
  }

  log.load(`Loaded ${count} commands`);
  return count;
};

module.exports = { loadCommands };
