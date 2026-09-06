#!/usr/bin/env node
/**
 * scripts/fetch-substack-rss.mjs
 * Build-time RSS fetcher + merger for the P31 blog.
 * Zero npm dependencies — uses built-in fetch + regex XML parsing.
 *
 * Usage:
 *   node scripts/fetch-substack-rss.mjs [--dry-run] [--verbose]
 *
 * Reads:
 *   - https://thegeodesicself.substack.com/feed (RSS 2.0)
 *   - apps/phosphorus31/src/data/manual-posts.json (optional)
 *
 * Writes:
 *   - apps/phosphorus31/src/data/blog-posts.json (merged, sorted by date desc)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const FEED_URL = 'https://thegeodesicself.substack.com/feed';
const MANUAL_POSTS_PATH = resolve(REPO_ROOT, 'apps/phosphorus31/src/data/manual-posts.json');
const OUTPUT_PATH = resolve(REPO_ROOT, 'apps/p31ca/src/data/blog-posts.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

function log(...a) { if (VERBOSE) console.log('[rss]', ...a); }

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toISOString().split('T')[0];
}

function parseFeed(xml) {
  const posts = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const get = (tag) => {
      // Try content:encoded first (full HTML body)
      const encoded = new RegExp(`<content:encoded><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/content:encoded>`).exec(item);
      const cdataBody = encoded ? encoded[1] : null;

      const cdata = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`).exec(item);
      if (cdata) return cdata[1];

      const plain = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(item);
      if (plain) return plain[1];

      // For description, fall back to content:encoded
      if (tag === 'description' && cdataBody) return cdataBody;

      return '';
    };

    const title = get('title').trim();
    const link = get('link').trim();
    const description = get('description').trim();
    const contentEncoded = get('content:encoded').trim();
    const pubDate = get('pubDate').trim();
    const author = get('dc:creator').trim() || get('author').trim() || 'Will Johnson';

    // Extract categories as tags
    const tagMatches = item.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/g) || [];
    const tags = tagMatches.map(t => t.replace(/<\/?category><!\[CDATA\[|\]\]><\/category>/g, '').trim());

    // Use content:encoded as body if available, otherwise description
    const body = contentEncoded || description;

    if (!title || !link) continue;

    // Skip placeholder posts
    if (title.toLowerCase() === 'coming soon') continue;

    posts.push({
      title,
      slug: slugify(title),
      date: parseRssDate(pubDate),
      author,
      excerpt: stripHtml(description).slice(0, 280),
      body,
      url: link,
      source: 'substack',
      tags,
    });
  }

  return posts;
}

async function fetchFeed() {
  log('Fetching', FEED_URL);
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'P31-Blog-Bot/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  log('Fetched', xml.length, 'bytes');

  return parseFeed(xml);
}

function loadManualPosts() {
  if (!existsSync(MANUAL_POSTS_PATH)) {
    log('No manual posts file found');
    return [];
  }

  try {
    const raw = readFileSync(MANUAL_POSTS_PATH, 'utf-8');
    const posts = JSON.parse(raw);
    log('Loaded', posts.length, 'manual posts');
    return posts;
  } catch (err) {
    console.error('[rss] Warning: failed to parse manual-posts.json:', err.message);
    return [];
  }
}

function mergePosts(rssPosts, manualPosts) {
  const seen = new Set();
  const merged = [];

  // RSS posts take precedence
  for (const post of rssPosts) {
    if (!seen.has(post.slug)) {
      seen.add(post.slug);
      merged.push(post);
    }
  }

  // Manual posts fill gaps
  for (const post of manualPosts) {
    if (!seen.has(post.slug)) {
      seen.add(post.slug);
      merged.push(post);
    }
  }

  // Sort by date descending
  merged.sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return 0;
    return db - da;
  });

  return merged;
}

function writeOutput(posts) {
  const json = JSON.stringify(posts, null, 2) + '\n';

  if (DRY_RUN) {
    console.log('[rss] Dry run — would write', posts.length, 'posts to', OUTPUT_PATH);
    console.log(json);
    return;
  }

  writeFileSync(OUTPUT_PATH, json, 'utf-8');
  console.log(`[rss] Wrote ${posts.length} posts to ${OUTPUT_PATH}`);
}

// --- main ---

try {
  const [rssPosts, manualPosts] = await Promise.all([
    fetchFeed(),
    Promise.resolve(loadManualPosts()),
  ]);

  const merged = mergePosts(rssPosts, manualPosts);
  writeOutput(merged);

  if (VERBOSE) {
    for (const p of merged) {
      console.log(`  ${p.source === 'substack' ? '📡' : '✏️ '} ${p.date} — ${p.title}`);
    }
  }
} catch (err) {
  console.error('[rss] Fatal:', err.message);
  process.exit(1);
}
