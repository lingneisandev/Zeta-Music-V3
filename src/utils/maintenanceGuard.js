'use strict';

const config = require('../config');

const isMaintenance = (userId) => {
  if (!config.maintenanceMode) return false;
  return !config.ownerIds.includes(userId);
};

module.exports = { isMaintenance };
