'use strict';

const { Client, Collection, GatewayIntentBits, Partials, Events } = require('discord.js');
const mongoose = require('mongoose');
const config = require('./config');
const E = {
  info: 'ℹ',
  ready: '✓',
  warn: '⚠',
  error: '✖',
  load: '⬢',
  event: '➤',
  boot: '▲',
  db: '▣',
  check: '✔',
  arrow: '➜',
  dot: '•',
  line: '━',
  lavalink: '◉',
  music: '♫',
  shutdown: '⛔',
  online: '●',
  guilds: '⌘',
  cmds: '✦',
  uptime: '⏱',
  handler: '🔧',
};
const { log, printLine, sleep, animateBar, C } = require('./utils/logger');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const nodeManager = require('./lavalink/nodeManager');
const antiCrash = require('./utils/antiCrash');
const devLogger = require('./utils/devLogger');

const printBanner = () => {
  printLine(E.line, 56, C.blue);
  console.log(`${C.blue}${E.line}${C.reset}                                                      ${C.blue}${E.line}${C.reset}`);
  console.log(`${C.blue}${E.line}${C.reset}        ${C.cyan}${C.bold}MIZUKI MUSIC${C.reset}                 ${C.blue}${E.line}${C.reset}`);
  console.log(`${C.blue}${E.line}${C.reset}                                                      ${C.blue}${E.line}${C.reset}`);
  console.log(`${C.blue}${E.line}${C.reset}  ${E.arrow} ${C.cyan}Version${C.reset}   ${E.dot} ${C.white}2.2.0${C.reset}                            ${C.blue}${E.line}${C.reset}`);
  console.log(`${C.blue}${E.line}${C.reset}  ${E.arrow} ${C.cyan}Engine${C.reset}    ${E.dot} ${C.white}Discord.js v14 (Latest)${C.reset}           ${C.blue}${E.line}${C.reset}`);
  console.log(`${C.blue}${E.line}${C.reset}  ${E.arrow} ${C.cyan}Developer${C.reset} ${E.dot} ${C.white}CassetteDev${C.reset}                      ${C.blue}${E.line}${C.reset}`);
  console.log(`${C.blue}${E.line}${C.reset}                                                      ${C.blue}${E.line}${C.reset}`);
  printLine(E.line, 56, C.blue);
  console.log('');
};

const bootSequence = async () => {
  printBanner();
  await animateBar('Database', E.db, C.cyan, 20, 20);
  await animateBar('Core Modules', E.handler, C.cyan, 20, 15);
  await animateBar('Cmd Handler', E.cmds, C.magenta, 20, 15);
  await animateBar('Event Handler', E.event, C.blue, 20, 15);
  await animateBar('Lavalink Sys', E.lavalink, C.blue, 20, 20);
  await animateBar('Voice Gateway', E.music, C.yellow, 20, 15);
  await animateBar('Gateway Login', E.boot, C.green, 20, 25);
  console.log('');
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User,
    Partials.Reaction
  ],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: false }
});

client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
client.config = config;
client.players = new Map();
client.premiumCache = new Map();

antiCrash.init(client);

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  log.crash(`Unhandled Rejection: ${err.message}`);
  devLogger.sendCrash(err).catch(() => { });
});

process.on('uncaughtException', (err) => {
  log.crash(`Uncaught Exception: ${err.message}`);
  log.crash(err.stack || 'No stack trace');
  devLogger.sendCrash(err).catch(() => { });
  setTimeout(() => process.exit(1), 1000);
});

process.on('SIGINT', () => {
  log.warn(`${E.shutdown} SIGINT received, shutting down gracefully...`);
  client.destroy();
  process.exit(0);
});

(async () => {
  try {
    await bootSequence();

    log.db(`${E.db} Connecting to MongoDB...`);
    await mongoose.connect(config.mongoUri);
    log.db(`${E.check} MongoDB connected`);

    const cmdCount = loadCommands(client);
    log.load(`${E.check} Loaded ${cmdCount} commands`);

    const evtCount = loadEvents(client);
    log.event(`${E.check} Loaded ${evtCount} events`);

    log.lavalink(`${E.lavalink} Initializing Lavalink...`);
    nodeManager.init(client);

    log.info(`${E.boot} Logging in to Discord...`);
    await client.login(config.token);

    await sleep(2000);

    printLine(E.line, 56, C.green);
    log.ready(`${E.online}  ONLINE    ${E.arrow} ${client.user.tag}`);
    log.ready(`${E.guilds}  GUILDS    ${E.arrow} ${client.guilds.cache.size}`);
    log.ready(`${E.cmds}  COMMANDS  ${E.arrow} ${client.commands.size}`);
    log.ready(`${E.uptime}  UPTIME    ${E.arrow} ${new Date().toUTCString()}`);

    const shoukaku = nodeManager.getShoukaku();
    log.ready(`${E.lavalink}  NODES     ${E.arrow} ${shoukaku ? shoukaku.nodes.size : 0}`);
    printLine(E.line, 56, C.green);
  } catch (err) {
    log.crash(`Fatal boot error: ${err.message}`);
    log.crash(err.stack || 'No stack trace');
    process.exit(1);
  }
})();
