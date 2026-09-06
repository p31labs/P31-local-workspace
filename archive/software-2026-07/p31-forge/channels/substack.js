/**
 * Substack — RSS feed scanner (no auth)
 * Substack has no inbound publish API. This channel scans a Substack
 * publication's OUTBOUND RSS feed and returns new posts as structured
 * data for cross-posting via `publishPack` to bluesky/mastodon/twitter.
 *
 * Origin: ported from p31labs/social-content-engine/src/rss-substack.js
 * — same diff-against-last-seen pattern, but without rss-parser or fs
 * deps so it runs in Cloudflare Workers. State lives in KV
 * (scan:substack:seen) when FORGE_KV is bound; otherwise every post
 * counts as new.
 *
 * content: {
 *   feed?: string,          // RSS URL (default SUBSTACK_FEED_URL env)
 *   limit?: number,         // cap items returned (default 5)
 *   hashtags?: string       // appended to each post body (default tasteful set)
 * }
 * env: {
 *   SUBSTACK_FEED_URL?: string,   // fallback feed URL if content.feed missing
 *   FORGE_KV?: KVNamespace        // Worker KV binding — if present, used for diff
 * }
 */

const DEFAULT_FEED = 'https://thegeodesicself.substack.com/feed';
const DEFAULT_HASHTAGS = '#Neurodivergent #OpenSource #AssistiveTech';
const SEEN_KEY = 'scan:substack:seen';

async function publish({ content = {}, env = {} }) {
  const feedUrl = content.feed || env.SUBSTACK_FEED_URL || DEFAULT_FEED;
  const limit = content.limit || 5;
  const hashtags = content.hashtags ?? DEFAULT_HASHTAGS;

  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'P31-Forge/0.1' }
  });
  if (!res.ok) {
    throw new Error(`Substack feed ${feedUrl}: HTTP ${res.status}`);
  }
  const xml = await res.text();
  const items = parseRssItems(xml).slice(0, limit);

  // Diff against KV if bound; otherwise treat every item as new.
  let seen = {};
  const kv = env.FORGE_KV;
  if (kv?.get) {
    const raw = await kv.get(SEEN_KEY);
    if (raw) { try { seen = JSON.parse(raw); } catch {} }
  }

  const now = new Date().toISOString();
  const newPosts = [];
  const allPosts = [];

  for (const it of items) {
    const id = it.guid || it.link;
    if (!id) continue;
    const post = shapePost(it, hashtags);
    allPosts.push(post);
    if (!seen[id]) {
      newPosts.push(post);
      seen[id] = now;
    }
  }

  if (kv?.put && newPosts.length > 0) {
    await kv.put(SEEN_KEY, JSON.stringify(seen));
  }

  return {
    success: true,
    platform: 'substack',
    feed: feedUrl,
    count: allPosts.length,
    newCount: newPosts.length,
    newPosts,      // shape matches social-pack posts: { id, content, meta }
    posts: allPosts
  };
}

// ─── Shape a feed item into a cross-post-ready payload ───────────────

function shapePost(item, hashtags) {
  const title = (item.title || 'New Post').trim();
  const link  = (item.link  || '').trim();
  const excerpt = textExcerpt(item.contentSnippet || item.description || '', 220);
  const shortBody = [
    `${title}`,
    excerpt,
    link,
    hashtags
  ].filter(Boolean).join('\n\n');

  // Long-form variant for dev.to/hashnode cross-posts
  const bodyMarkdown = [
    `> Originally published on [Substack](${link})`,
    '',
    excerpt,
    '',
    `**Read the full post:** ${link}`
  ].join('\n');

  return {
    id:       `substack:${slug(title)}`,
    occasion: 'substack cross-post',
    content:  shortBody,                        // for twitter/bluesky/mastodon
    longForm: {                                  // for devto/hashnode
      title,
      body_markdown: bodyMarkdown,
      canonical_url: link,
      description:   excerpt.slice(0, 160),
      tags:          ['neurodivergent', 'opensource', 'assistivetech']
    },
    meta: {
      title,
      link,
      guid:    item.guid || null,
      pubDate: item.pubDate || null,
      excerpt
    }
  };
}

// ─── Inline RSS parser (no rss-parser dep; works in CF Workers) ──────

function parseRssItems(xml) {
  const out = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const blk = m[1];
    out.push({
      title:          pick(blk, 'title'),
      link:           pick(blk, 'link'),
      guid:           pick(blk, 'guid'),
      pubDate:        pick(blk, 'pubDate'),
      description:    pick(blk, 'description'),
      contentSnippet: stripHtml(pick(blk, 'description'))
    });
  }
  return out;
}

function pick(blk, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = blk.match(re);
  if (!m) return '';
  return decodeEntities(m[1]);
}

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#8217;/g, '\u2019')
    .replace(/&amp;/g, '&')
    .trim();
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function textExcerpt(s, n) {
  const clean = stripHtml(s);
  if (clean.length <= n) return clean;
  return clean.slice(0, n).replace(/\s+\S*$/, '') + '\u2026';
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

module.exports = { publish };
