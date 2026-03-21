'use strict';

const { log } = require('./logger');
const devLogger = require('./devLogger');

const init = (client) => {
  process.on('uncaughtException', (err) => {
    log.crash(`Uncaught Exception: ${err.message}`);
    log.crash(err.stack || 'No stack trace');
    devLogger.sendCrash(err).catch(() => {});
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    log.crash(`Unhandled Rejection: ${err.message}`);
    log.crash(err.stack || 'No stack trace');
    devLogger.sendCrash(err).catch(() => {});
  });

  process.on('warning', (warning) => {
    log.warn(`Process Warning: ${warning.message}`);
  });
};

module.exports = { init };
