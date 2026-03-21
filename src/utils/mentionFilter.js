'use strict';

const filterContent = (str) => {
  if (!str || typeof str !== 'string') return '';
  let filtered = str;
  filtered = filtered.replace(/@everyone/gi, '@\u200Beveryone');
  filtered = filtered.replace(/@here/gi, '@\u200Bhere');
  filtered = filtered.replace(/<@!?\d+>/g, '[user]');
  filtered = filtered.replace(/<@&\d+>/g, '[role]');
  filtered = filtered.replace(/<#\d+>/g, '[channel]');
  return filtered;
};

module.exports = { filterContent };
