/**
 * Substack RSS Poller - Broadcasts new articles to Discord
 * 
 * Polls the Substack RSS feed and sends Discord embeds for new posts.
 * Run by calling startSubstackIntegration() on bot ready.
 */

import Parser from 'rss-parser';
import { WebhookClient, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

interface PollerState {
    lastPublishedDate: string;
}

const STATE_FILE = path.join(process.cwd(), 'data/substack_state.json');
const SUBSTACK_URL = 'https://thegeodesicself.substack.com/feed';
const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const parser = new Parser({
    headers: { 'User-Agent': 'P31-Discord-Bot/1.0' }
});

let webhookClient: WebhookClient | null = null;

export function initSubstackPoller(webhookUrl: string) {
    if (webhookUrl) {
        webhookClient = new WebhookClient({ url: webhookUrl });
        console.log('[Substack Poller] Discord webhook initialized');
    } else {
        console.warn('[Substack Poller] No webhook URL configured - skipping');
    }
}

function getLastPublishedDate(): Date {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf-8');
            const state: PollerState = JSON.parse(data);
            return new Date(state.lastPublishedDate);
        }
    } catch (error) {
        console.error('[Substack Poller] Error reading state file:', error);
    }
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

function saveLastPublishedDate(date: Date) {
    try {
        const dir = path.dirname(STATE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const state: PollerState = { lastPublishedDate: date.toISOString() };
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (error) {
        console.error('[Substack Poller] Error saving state file:', error);
    }
}

export async function checkSubstackFeed() {
    if (!webhookClient) {
        console.log('[Substack Poller] Webhook not configured, skipping poll');
        return;
    }

    console.log('[Substack Poller] Checking feed for new articles...');

    try {
        const feed = await parser.parseURL(SUBSTACK_URL);
        const lastDate = getLastPublishedDate();
        let newestDate = lastDate;
        let newPostsFound = false;

        const items = feed.items.reverse();

        for (const item of items) {
            const pubDate = new Date(item.pubDate || '');
            
            if (pubDate > lastDate) {
                newPostsFound = true;
                if (pubDate > newestDate) newestDate = pubDate;

                console.log(`[Substack Poller] New post found: ${item.title}`);

                const embed = new EmbedBuilder()
                    .setTitle(item.title || 'New Article')
                    .setURL(item.link || SUBSTACK_URL)
                    .setDescription(item.contentSnippet 
                        ? item.contentSnippet.substring(0, 280) + '...' 
                        : 'Click to read more.')
                    .setColor(0x00FFCC)
                    .setTimestamp(pubDate)
                    .setFooter({ text: 'P31 Labs • The Geodesic Self' });

                await webhookClient.send({
                    content: '📡 **New Transmission in the Content Forge**',
                    embeds: [embed]
                });
            }
        }

        if (newPostsFound) {
            saveLastPublishedDate(newestDate);
            console.log(`[Substack Poller] State updated to ${newestDate.toISOString()}`);
        } else {
            console.log('[Substack Poller] No new articles found.');
        }

    } catch (error) {
        console.error('[Substack Poller] Failed to fetch/parse RSS feed:', error);
    }
}

export function startSubstackIntegration() {
    if (!webhookClient) {
        console.log('[Substack Poller] Not starting - no webhook configured');
        return;
    }
    
    checkSubstackFeed();
    
    setInterval(checkSubstackFeed, POLL_INTERVAL_MS);
    console.log('[Substack Poller] Initialized and polling every 1 hour');
}