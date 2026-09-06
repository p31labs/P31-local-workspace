#!/usr/bin/env node
/**
 * scripts/generate-feed.mjs
 * Generates RSS feed.xml for phosphorus31.org at build time.
 * Run after fetch-substack-rss.mjs and before astro build.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const POSTS_PATH = resolve(REPO_ROOT, 'apps/p31ca/src/data/blog-posts.json');
const OUTPUT_DIR = resolve(REPO_ROOT, 'apps/phosphorus31/public');
const OUTPUT_PATH = resolve(OUTPUT_DIR, 'feed.xml');

const SITE_URL = 'https://phosphorus31.org';

const posts = JSON.parse(readFileSync(POSTS_PATH, 'utf-8'));

const items = posts.map((post) => {
  const postUrl = post.url || `${SITE_URL}/blog/${post.slug}`;
  const description = post.excerpt || '';

  return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="${!post.url}">${postUrl}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${description}]]></description>
      <author>${post.author}</author>${post.tags?.length ? '\n      <category>' + post.tags.map((t) => `<![CDATA[${t}]]>`).join('</category>\n      <category>') + '</category>' : ''}
    </item>`;
}).join('\n');

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>P31 Labs — The Geodesic Self</title>
    <link>${SITE_URL}</link>
    <description>Notes from the lab — engineering, care science, post-quantum cryptography, and the sovereignty stack.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, feed, 'utf-8');
console.log(`[feed] Wrote ${items.split('<item>').length - 1} items to ${OUTPUT_PATH}`);
