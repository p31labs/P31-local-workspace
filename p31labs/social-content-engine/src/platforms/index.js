/**
 * P31 Social Content Engine - Platform Publishers
 * 
 * @module platforms
 */

import Masto from 'mastodon-api';
import { BskyAgent } from '@atproto/api';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import { createReadStream } from 'fs';
import CONFIG from '../config/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// MASTODON
// ═══════════════════════════════════════════════════════════════════════════════

let mastoClient = null;

export async function initMastodon(config) {
  mastoClient = new Masto({
    access_token: config.accessToken,
    api_url: config.apiUrl || 'https://mastodon.social/api/v1/'
  });
  console.log('[Mastodon] Initialized');
}

export async function publishMastodon(data) {
  if (!mastoClient) {
    throw new Error('Mastodon not initialized');
  }
  
  const params = {
    status: data.body
  };
  
  if (data.replyTo) {
    params.in_reply_to_id = data.replyTo;
  }
  
  if (data.media && data.media.length > 0) {
    const mediaIds = [];
    for (const mediaPath of data.media) {
      const media = await mastoClient.post('media', {
        file: fs.createReadStream(mediaPath)
      });
      mediaIds.push(media.id);
    }
    params.media_ids = mediaIds;
  }
  
  const status = await mastoClient.post('statuses', params);
  
  return {
    id: status.id,
    url: status.url
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLUESKY
// ═══════════════════════════════════════════════════════════════════════════════

let bskyAgent = null;

export async function initBluesky(config) {
  bskyAgent = new BskyAgent({ service: 'https://bsky.social' });
  await bskyAgent.login({
    identifier: config.identifier,
    password: config.password
  });
  console.log('[Bluesky] Initialized');
}

export async function publishBluesky(data) {
  if (!bskyAgent) {
    throw new Error('Bluesky not initialized');
  }
  
  const record = {
    $type: 'app.bsky.feed.post',
    text: data.body,
    createdAt: new Date().toISOString()
  };
  
  if (data.replyTo) {
    record['reply'] = {
      parent: { uri: data.replyTo },
      root: { uri: data.replyTo }
    };
  }
  
  const result = await bskyAgent.post('app.bsky.feed.post', record);
  
  return {
    uri: result.uri,
    cid: result.cid
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TWITTER/X
// ═══════════════════════════════════════════════════════════════════════════════

let twitterClient = null;

export async function initTwitter(config) {
  const twitterConfig = config || CONFIG.getTwitterConfig();
  if (!twitterConfig) {
    throw new Error('Twitter not configured. Set TWITTER_ACCESS_TOKEN in .env');
  }
  twitterClient = new TwitterApi(twitterConfig);
  console.log('[Twitter] Initialized');
}

export async function publishTwitter(data) {
  if (!twitterClient) {
    throw new Error('Twitter not initialized');
  }
  
  const tweet = await twitterClient.v2.tweet(data.body);
  
  return {
    id: tweet.data.id,
    text: tweet.data.text
  };
}

export async function publishTwitterThread(data) {
  if (!twitterClient) {
    throw new Error('Twitter not initialized');
  }
  
  const ids = [];
  let replyTo = undefined;
  
  for (let i = 0; i < data.body.length; i++) {
    const result = await twitterClient.v2.tweet(data.body[i], {
      reply: replyTo ? { in_reply_to: replyTo } : undefined
    });
    ids.push(result.data.id);
    replyTo = result.data.id;
  }
  
  return { ids };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISCORD
// ═══════════════════════════════════════════════════════════════════════════════

let discordWebhook = null;

export async function initDiscord(config) {
  discordWebhook = config.webhookUrl;
  console.log('[Discord] Initialized');
}

export async function publishDiscord(data) {
  if (!discordWebhook) {
    throw new Error('Discord not initialized');
  }
  
  const response = await fetch(discordWebhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: data.body,
      embeds: data.embeds || []
    })
  });
  
  return {
    success: response.ok
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-PLATFORM ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

export async function publishToPlatform(platform, data) {
  switch (platform) {
    case 'mastodon':
      return publishMastodon(data);
    case 'bluesky':
      return publishBluesky(data);
    case 'twitter':
      return publishTwitter(data);
    case 'discord':
      return publishDiscord(data);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

export async function publishMulti(data) {
  const results = [];
  
  for (const platform of data.platforms) {
    try {
      const result = await publishToPlatform(platform, {
        body: data.body,
        media: data.media
      });
      results.push({ platform, success: true, result });
    } catch (error) {
      results.push({ platform, success: false, error: String(error) });
    }
  }
  
  return results;
}

export default {
  initMastodon,
  publishMastodon,
  initBluesky,
  publishBluesky,
  initTwitter,
  publishTwitter,
  publishTwitterThread,
  initDiscord,
  publishDiscord,
  publishToPlatform,
  publishMulti
};
