/**
 * Substack RSS Integration for P31 Social Content Engine
 * 
 * Fetches RSS feed and triggers cross-post to configured platforms.
 * Run via: node src/rss-substack.js
 */

import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { publishMulti } from './platforms/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUBSTACK_FEED_URL = 'https://thegeodesicself.substack.com/feed';
const STATE_FILE = path.join(__dirname, '../data/last-posted.json');

// Custom parser with user agent
const parser = new Parser({
  customFields: {
    item: ['guid', 'link']
  },
  headers: {
    'User-Agent': 'P31-SCE/1.0'
  }
});

/**
 * Load last posted item ID from state file
 */
function loadLastPosted() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('[Substack] Could not load state file');
  }
  return { lastGuid: null, lastLink: null };
}

/**
 * Save last posted item ID to state file
 */
function saveLastPosted(guid, link) {
  try {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify({ lastGuid: guid, lastLink: link }, null, 2));
  } catch (e) {
    console.error('[Substack] Failed to save state:', e.message);
  }
}

/**
 * Main function to check for new posts and cross-post
 */
async function checkAndPublish() {
  console.log('[Substack] Checking for new posts...');
  
  let feed;
  try {
    feed = await parser.parseURL(SUBSTACK_FEED_URL);
  } catch (e) {
    console.error('[Substack] Failed to parse feed:', e.message);
    return;
  }
  
  if (!feed.items || feed.items.length === 0) {
    console.log('[Substack] No items in feed');
    return;
  }
  
  const lastPosted = loadLastPosted();
  const latestItem = feed.items[0];
  
  // Check if we already posted this
  if (latestItem.guid === lastPosted.lastGuid || latestItem.link === lastPosted.lastLink) {
    console.log('[Substack] No new posts since last check');
    return;
  }
  
  console.log(`[Substack] New post found: "${latestItem.title}"`);
  
  // Extract content
  const title = latestItem.title || 'New Post';
  const link = latestItem.link || '';
  const excerpt = latestItem.contentSnippet?.slice(0, 200) || '';
  
  // Format for cross-platform posting
  const platforms = ['mastodon', 'bluesky', 'discord'];
  
  // Twitter thread format
  const twitterThread = [
    `📰 New from P31 Labs: ${title}`,
    `${excerpt}...`,
    `Read more: ${link}`,
    `#Neurodivergent #OpenSource #AssistiveTech`
  ];
  
  // Discord embed format
  const discordBody = `📰 **New Post**: ${title}\n\n${excerpt}\n\n🔗 Read more: ${link}`;
  
  // Publish to all platforms
  const results = await publishMulti({
    platforms,
    body: discordBody,
    media: []
  });
  
  console.log('[Substack] Cross-post results:', results);
  
  // Also try Twitter if configured
  try {
    const { initTwitter, publishTwitterThread } = await import('./platforms/index.js');
    await initTwitter();
    const twitterResult = await publishTwitterThread({ body: twitterThread });
    console.log('[Substack] Twitter thread result:', twitterResult);
  } catch (e) {
    console.log('[Substack] Twitter not configured, skipping');
  }
  
  // Save state
  saveLastPosted(latestItem.guid, latestItem.link);
  console.log('[Substack] State updated');
}

/**
 * Run once or on interval
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--watch' || args[0] === '-w') {
    // Run every 15 minutes
    console.log('[Substack] Running in watch mode (every 15 min)...');
    await checkAndPublish();
    setInterval(checkAndPublish, 15 * 60 * 1000);
  } else {
    // Run once
    await checkAndPublish();
  }
}

main().catch(console.error);