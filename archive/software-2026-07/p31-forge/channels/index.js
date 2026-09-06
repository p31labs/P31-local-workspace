/**
 * P31 FORGE — Publishing Channels
 * ================================
 * Every channel implements the same interface:
 *
 *   async publish({ content, env, ...opts }) -> { success, url, id, platform, ... }
 *
 * `content` shape depends on channel:
 *   - social (twitter/bluesky/mastodon): string
 *   - long-form (devto/hashnode): { title, body_markdown, description?, tags?, canonical_url? }
 *   - academic (zenodo): { title, description, creators, keywords?, files: [path|buffer] }
 *   - scan (grants): { keywords: [], since?: Date }
 *   - rss-scan (substack): { feed?, limit?, hashtags? } — returns newPosts[] for fan-out
 *
 * `env` provides channel-specific secrets. In CLI mode, process.env is passed.
 * In Worker mode, the Worker env object is passed.
 */

const twitter  = require('./twitter');
const bluesky  = require('./bluesky');
const mastodon = require('./mastodon');
const devto    = require('./devto');
const hashnode = require('./hashnode');
const zenodo   = require('./zenodo');
const grants   = require('./grants');
const substack = require('./substack');
const discord  = require('./discord');

const CHANNELS = { twitter, bluesky, mastodon, devto, hashnode, zenodo, grants, substack, discord };

async function publish(channel, content, env = {}, opts = {}) {
  const mod = CHANNELS[channel];
  if (!mod) {
    throw new Error(
      `Unknown channel: "${channel}". Valid: ${Object.keys(CHANNELS).join(', ')}`
    );
  }
  return mod.publish({ content, env, ...opts });
}

/**
 * Publish a social-pack (content/social/posts.json) — fans out each post
 * to its declared `targets` platforms. Returns per-post/per-platform results.
 */
async function publishPack(pack, env = {}, opts = {}) {
  const results = [];
  const postsToFire = opts.postIds
    ? pack.posts.filter(p => opts.postIds.includes(p.id))
    : pack.posts;

  for (const post of postsToFire) {
    const targets = opts.targets || post.targets || pack.defaultTargets || ['bluesky'];
    for (const platform of targets) {
      try {
        const res = await publish(platform, post.content, env, { ...opts });
        results.push({ postId: post.id, platform, ...res });
      } catch (e) {
        results.push({ postId: post.id, platform, success: false, error: e.message });
      }
    }
  }
  return results;
}

module.exports = { publish, publishPack, CHANNELS };
