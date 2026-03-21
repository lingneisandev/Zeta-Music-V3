'use strict';

const winston = require('winston');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m'
};

const tag = (color, label) => {
  const padded = label.padEnd(9);
  return `${color}${C.bold}[ ${padded}]${C.reset}`;
};

const log = {
  info: (...args) => console.log(`  ◈  ${tag(C.cyan, 'INFO')} ${C.white}${args.join(' ')}${C.reset}`),
  ready: (...args) => console.log(`  ✔  ${tag(C.green, 'READY')} ${C.white}${args.join(' ')}${C.reset}`),
  warn: (...args) => console.log(`  ⚠  ${tag(C.yellow, 'WARN')} ${C.yellow}${args.join(' ')}${C.reset}`),
  error: (...args) => console.log(`  ✖  ${tag(C.red, 'ERROR')} ${C.red}${args.join(' ')}${C.reset}`),
  load: (...args) => console.log(`  ⬡  ${tag(C.magenta, 'LOAD')} ${C.white}${args.join(' ')}${C.reset}`),
  event: () => { },
  music: () => { },
  premium: (...args) => console.log(`  ★  ${tag(C.yellow, 'PREMIUM')} ${C.yellow}${args.join(' ')}${C.reset}`),
  lavalink: (...args) => console.log(`  ♪  ${tag(C.blue, 'LAVALINK')} ${C.white}${args.join(' ')}${C.reset}`),
  db: (...args) => console.log(`  ⬢  ${tag(C.cyan, 'DATABASE')} ${C.white}${args.join(' ')}${C.reset}`),
  crash: (...args) => console.log(`  ✖  ${tag(C.red, 'CRASH')} ${C.red}${args.join(' ')}${C.reset}`),
  dev: (...args) => console.log(`  ◇  ${tag(C.gray, 'DEV')} ${C.gray}${args.join(' ')}${C.reset}`),
  handler: (...args) => console.log(`  ◆  ${tag(C.cyan, 'HANDLER')} ${C.white}${args.join(' ')}${C.reset}`)
};

const printLine = (char = '─', length = 60, color = C.white) => {
  console.log(`${color}${char.repeat(length)}${C.reset}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const animateBar = async (label, symbol, color, steps = 20, delay = 40) => {
  const total = steps;
  for (let i = 0; i <= total; i++) {
    const filled = Math.round((i / total) * 20);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percent = Math.round((i / total) * 100);
    process.stdout.write(`\r  ${symbol} ${color}${C.bold}${label}${C.reset} ${C.gray}[${bar}] ${percent}%${C.reset}`);
    await sleep(delay);
  }
  process.stdout.write(`\r  ${symbol} ${color}${C.bold}${label}${C.reset} ${C.green}${C.bold}[${'█'.repeat(20)}] done${C.reset}   \n`);
};

const fileLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = { log, printLine, sleep, animateBar, C, fileLogger };