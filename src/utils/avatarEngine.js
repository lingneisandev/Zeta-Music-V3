'use strict';

const { WebhookClient } = require('discord.js');
const BotProfile = require('../models/BotProfile');
const { log } = require('./logger');
const axios = require('axios');
const { filterContent } = require('./mentionFilter');

const getProfile = async (guildId) => {
  try {
    const profile = await BotProfile.findOne({ guildId });
    return profile;
  } catch (err) {
    log.error(`Failed to fetch bot profile for guild ${guildId}: ${err.message}`);
    return null;
  }
};

const sendAsWebhook = async (channel, content, embeds, files, guildId) => {
  try {
    const profile = await getProfile(guildId);

    if (!profile || (!profile.avatarUrl && !profile.webhookId)) {
      const sendOptions = {};
      if (content) sendOptions.content = filterContent(content);
      if (embeds) sendOptions.embeds = embeds;
      if (files) sendOptions.files = files;
      sendOptions.allowedMentions = { parse: [], repliedUser: false };
      return await channel.send(sendOptions);
    }

    let webhook = null;

    if (profile.webhookId && profile.webhookToken) {
      try {
        webhook = new WebhookClient({ id: profile.webhookId, token: profile.webhookToken });
      } catch (_) {
        webhook = null;
      }
    }

    if (!webhook) {
      try {
        const webhooks = await channel.fetchWebhooks();
        let existingWebhook = webhooks.find((wh) => wh.owner?.id === channel.client?.user?.id);

        if (!existingWebhook) {
          existingWebhook = await channel.createWebhook({
            name: 'Zeta Music',
            avatar: profile.avatarUrl || undefined
          });
        }

        profile.webhookId = existingWebhook.id;
        profile.webhookToken = existingWebhook.token;
        await profile.save();

        webhook = new WebhookClient({ id: existingWebhook.id, token: existingWebhook.token });
      } catch (err) {
        log.warn(`Webhook creation failed, falling back to channel.send: ${err.message}`);
        const sendOptions = {};
        if (content) sendOptions.content = filterContent(content);
        if (embeds) sendOptions.embeds = embeds;
        if (files) sendOptions.files = files;
        sendOptions.allowedMentions = { parse: [], repliedUser: false };
        return await channel.send(sendOptions);
      }
    }

    const webhookOptions = {
      username: 'Zeta Music',
      avatarURL: profile.avatarUrl || undefined,
      allowedMentions: { parse: [], repliedUser: false }
    };
    if (content) webhookOptions.content = filterContent(content);
    if (embeds) webhookOptions.embeds = embeds;
    if (files) webhookOptions.files = files;

    return await webhook.send(webhookOptions);
  } catch (err) {
    log.error(`sendAsWebhook failed: ${err.message}`);
    const sendOptions = {};
    if (content) sendOptions.content = filterContent(content);
    if (embeds) sendOptions.embeds = embeds;
    if (files) sendOptions.files = files;
    sendOptions.allowedMentions = { parse: [], repliedUser: false };
    return await channel.send(sendOptions);
  }
};

const setAvatar = async (guildId, url) => {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    const contentType = response.headers['content-type'] || '';
    if (!contentType.match(/^image\/(png|jpe?g|gif|webp)/i)) {
      throw new Error('URL is not a valid image');
    }
    const contentLength = parseInt(response.headers['content-length'] || '0', 10);
    if (contentLength > 8 * 1024 * 1024) {
      throw new Error('Image exceeds 8MB limit');
    }
  } catch (err) {
    if (err.message === 'URL is not a valid image' || err.message === 'Image exceeds 8MB limit') {
      throw err;
    }
    throw new Error(`Failed to validate image URL: ${err.message}`);
  }

  await BotProfile.findOneAndUpdate(
    { guildId },
    { guildId, avatarUrl: url },
    { upsert: true, new: true }
  );
};

const resetAvatar = async (guildId) => {
  const profile = await BotProfile.findOne({ guildId });
  if (!profile) return;

  profile.avatarUrl = null;
  profile.webhookId = null;
  profile.webhookToken = null;
  await profile.save();
};

module.exports = { getProfile, sendAsWebhook, setAvatar, resetAvatar };
