/**
 * P31 Social Content Engine - Configuration Loader
 * @module config
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if exists
function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  const envExamplePath = path.join(__dirname, '../../.env.example');
  
  const targetPath = fs.existsSync(envPath) ? envPath : envExamplePath;
  
  if (!fs.existsSync(targetPath)) {
    console.warn('[Config] No .env file found. Using defaults.');
    return {};
  }
  
  const envContent = fs.readFileSync(targetPath, 'utf-8');
  const config = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return config;
}

const CONFIG = loadEnv();

export default {
  // Twitter/X
  TWITTER_APP_KEY: CONFIG.TWITTER_APP_KEY || '',
  TWITTER_APP_SECRET: CONFIG.TWITTER_APP_SECRET || '',
  TWITTER_ACCESS_TOKEN: CONFIG.TWITTER_ACCESS_TOKEN || '',
  TWITTER_ACCESS_SECRET: CONFIG.TWITTER_ACCESS_SECRET || '',
  TWITTER_BEARER_TOKEN: CONFIG.TWITTER_BEARER_TOKEN || '',
  
  // Mastodon
  MASTODON_ACCESS_TOKEN: CONFIG.MASTODON_ACCESS_TOKEN || '',
  MASTODON_API_URL: CONFIG.MASTODON_API_URL || 'https://mastodon.social/api/v1/',
  
  // Bluesky
  BLUESKY_IDENTIFIER: CONFIG.BLUESKY_IDENTIFIER || '',
  BLUESKY_PASSWORD: CONFIG.BLUESKY_PASSWORD || '',
  
  // Discord
  DISCORD_WEBHOOK_URL: CONFIG.DISCORD_WEBHOOK_URL || '',
  
  // BONDING
  BONDING_WEBHOOK_URL: CONFIG.BONDING_WEBHOOK_URL || 'https://webhook.p31ca.org/webhook/bonding',
  
  // SCE Config
  DATABASE_PATH: CONFIG.DATABASE_PATH || './data/sce.db',
  DEFAULT_PLATFORMS: (CONFIG.DEFAULT_PLATFORMS || 'discord,mastodon,bluesky').split(','),
  
  // Helpers
  getTwitterConfig() {
    if (!this.TWITTER_ACCESS_TOKEN) return null;
    return {
      appKey: this.TWITTER_APP_KEY,
      appSecret: this.TWITTER_APP_SECRET,
      accessToken: this.TWITTER_ACCESS_TOKEN,
      accessSecret: this.TWITTER_ACCESS_SECRET,
      bearerToken: this.TWITTER_BEARER_TOKEN
    };
  },
  
  getMastodonConfig() {
    if (!this.MASTODON_ACCESS_TOKEN) return null;
    return {
      accessToken: this.MASTODON_ACCESS_TOKEN,
      apiUrl: this.MASTODON_API_URL
    };
  },
  
  getBlueskyConfig() {
    if (!this.BLUESKY_IDENTIFIER) return null;
    return {
      identifier: this.BLUESKY_IDENTIFIER,
      password: this.BLUESKY_PASSWORD
    };
  },
  
  isConfigured(platform) {
    switch (platform) {
      case 'twitter': return !!this.TWITTER_ACCESS_TOKEN;
      case 'mastodon': return !!this.MASTODON_ACCESS_TOKEN;
      case 'bluesky': return !!this.BLUESKY_IDENTIFIER;
      case 'discord': return !!this.DISCORD_WEBHOOK_URL;
      default: return false;
    }
  }
};
