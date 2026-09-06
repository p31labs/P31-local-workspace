/**
 * DEPRECATED — Consolidated into p31-social-worker
 * -------------------------------------------------
 * This worker has been merged into social-drop-automation/worker.js (v2.0.0).
 * All functionality (Twitter, Reddit, Bluesky, Mastodon, Nostr, Substack)
 * is now implemented with real API integrations in the unified worker.
 *
 * Route: social.p31ca.org (was: mesh.p31ca.org for broadcast)
 *
 * This file is kept for reference only. Do not deploy.
 *
 * P31 Labs: Decentralized Social Broadcast Worker
 * ---------------------------------------------------------
 * Orchestrates multi-platform broadcasts across Nostr, Mastodon,
 * Bluesky, Twitter, Reddit, and Substack.
 *
 * Deploy: wrangler deploy p31_social_broadcast_worker.js
 */

// Helper to get secrets from env object
const getEnv = (env, key, fallback = "") => {
  if (env && env[key]) return env[key];
  return fallback;
};

export default {
  async fetch(request, env, ctx) {
    // Build config from secrets at runtime
    const config = {
      NOSTR_PRIVATE_KEY: getEnv(env, "NOSTR_PRIVATE_KEY", ""),
      NOSTR_RELAYS: getEnv(
        env,
        "NOSTR_RELAYS",
        "wss://relay.damus.io,wss://nos.lol,wss://relay.nostr.band",
      ).split(","),
      TWITTER_BEARER_TOKEN: getEnv(env, "TWITTER_BEARER_TOKEN", ""),
      TWITTER_API_KEY: getEnv(env, "TWITTER_API_KEY", ""),
      TWITTER_API_SECRET: getEnv(env, "TWITTER_API_SECRET", ""),
      TWITTER_ACCESS_TOKEN: getEnv(env, "TWITTER_ACCESS_TOKEN", ""),
      TWITTER_ACCESS_TOKEN_SECRET: getEnv(
        env,
        "TWITTER_ACCESS_TOKEN_SECRET",
        "",
      ),
      SUBSTACK_API_KEY: getEnv(env, "SUBSTACK_API_KEY", ""),
      REDDIT_CLIENT_ID: getEnv(env, "REDDIT_CLIENT_ID", ""),
      REDDIT_CLIENT_SECRET: getEnv(env, "REDDIT_CLIENT_SECRET", ""),
      REDDIT_USERNAME: getEnv(env, "REDDIT_USERNAME", ""),
      REDDIT_PASSWORD: getEnv(env, "REDDIT_PASSWORD", ""),
      MASTODON_INSTANCE: getEnv(env, "MASTODON_INSTANCE", ""),
      MASTODON_ACCESS_TOKEN: getEnv(env, "MASTODON_ACCESS_TOKEN", ""),
      BLUESKY_HANDLE: getEnv(env, "BLUESKY_HANDLE", ""),
      BLUESKY_APP_PASSWORD: getEnv(env, "BLUESKY_APP_PASSWORD", ""),
    };

    // Handle CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // GET - Health check and status
    if (request.method === "GET") {
      const url = new URL(request.url);
      const action = url.searchParams.get("action");

      if (action === "status") {
        return jsonResponse({
          nostr: !!config.NOSTR_PRIVATE_KEY,
          twitter: !!(config.TWITTER_API_KEY && config.TWITTER_ACCESS_TOKEN),
          substack: !!config.SUBSTACK_API_KEY,
          reddit: !!(config.REDDIT_CLIENT_ID && config.REDDIT_USERNAME),
          mastodon: !!(
            config.MASTODON_INSTANCE && config.MASTODON_ACCESS_TOKEN
          ),
          bluesky: !!(config.BLUESKY_HANDLE && config.BLUESKY_APP_PASSWORD),
        });
      }

      if (action === "nostr") {
        const relays = await testNostrRelays(config);
        return jsonResponse({ relays });
      }

      return jsonResponse({
        service: "p31-social-broadcast",
        endpoints: {
          "POST /": "Broadcast message to all configured platforms",
          "GET /?action=status": "Check platform configurations",
          "GET /?action=nostr": "Test Nostr relay connectivity",
        },
      });
    }

    // POST - Broadcast to all platforms
    if (request.method === "POST") {
      try {
        const payload = await request.json();
        const results = await broadcastMessage(payload, config);
        return jsonResponse(results);
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  },
};

/**
 * Broadcast a message to all configured platforms
 */
async function broadcastMessage(payload, config) {
  const results = {};
  const platforms = payload.platforms || ["nostr"];
  const message = payload.content || payload.message || "";

  const promises = [];

  if (platforms.includes("nostr") && config.NOSTR_PRIVATE_KEY) {
    promises.push(
      broadcastToNostr(message, payload.tags, config).then(
        (r) => (results.nostr = r),
      ),
    );
  }

  if (platforms.includes("twitter") && config.TWITTER_API_KEY) {
    promises.push(
      broadcastToTwitter(message, payload.title, config).then(
        (r) => (results.twitter = r),
      ),
    );
  }

  if (platforms.includes("substack") && config.SUBSTACK_API_KEY) {
    promises.push(
      broadcastToSubstack(payload, config).then((r) => (results.substack = r)),
    );
  }

  if (platforms.includes("reddit") && config.REDDIT_CLIENT_ID) {
    promises.push(
      broadcastToReddit(payload, config).then((r) => (results.reddit = r)),
    );
  }

  if (platforms.includes("mastodon") && config.MASTODON_ACCESS_TOKEN) {
    promises.push(
      broadcastToMastodon(message, config).then((r) => (results.mastodon = r)),
    );
  }

  if (platforms.includes("bluesky") && config.BLUESKY_APP_PASSWORD) {
    promises.push(
      broadcastToBluesky(message, config).then((r) => (results.bluesky = r)),
    );
  }

  await Promise.allSettled(promises);

  return {
    status: "broadcast_complete",
    platforms: results,
    timestamp: new Date().toISOString(),
  };
}

// ============== NOSTR ==============
async function broadcastToNostr(content, tags = [], config) {
  if (!config.NOSTR_PRIVATE_KEY) {
    return { error: "Nostr not configured" };
  }
  // Simplified - full Nostr signing requires nostr-tools library
  return {
    status: "stub",
    note: "Nostr requires additional library for signing",
  };
}

async function testNostrRelays(config) {
  const results = {};
  for (const relay of config.NOSTR_RELAYS) {
    try {
      const res = await fetch(relay, { method: "GET" });
      results[relay] = res.ok ? "connected" : "error";
    } catch {
      results[relay] = "unreachable";
    }
  }
  return results;
}

// ============== TWITTER/X ==============
async function broadcastToTwitter(content, title, config) {
  if (!config.TWITTER_API_KEY) {
    return { error: "Twitter not configured" };
  }
  // Twitter OAuth 1.0a would go here - requires twitter-api-v2 library
  return {
    status: "configured",
    platform: "twitter",
    note: "OAuth 1.0a posting requires additional library",
  };
}

// ============== SUBSTACK ==============
async function broadcastToSubstack(payload, config) {
  if (!config.SUBSTACK_API_KEY) {
    return { error: "Substack not configured" };
  }
  try {
    const response = await fetch("https://api.substack.com/api/v1/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.SUBSTACK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: payload.title || "P31 Labs Update",
        content: payload.content,
        type: "newsletter",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return { status: "published", post_id: data.id };
    }
    return { error: await response.text() };
  } catch (error) {
    return { error: error.message };
  }
}

// ============== REDDIT ==============
async function broadcastToReddit(payload, config) {
  if (!config.REDDIT_CLIENT_ID) {
    return { error: "Reddit not configured" };
  }
  return { error: "Reddit needs OAuth2 setup" };
}

// ============== MASTODON ==============
async function broadcastToMastodon(content, config) {
  if (!config.MASTODON_ACCESS_TOKEN) {
    return { error: "Mastodon not configured" };
  }
  try {
    const response = await fetch(
      `${config.MASTODON_INSTANCE}/api/v1/statuses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.MASTODON_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: content, visibility: "public" }),
      },
    );
    if (response.ok) {
      const data = await response.json();
      return { status: "published", url: data.url };
    }
    return { error: await response.text() };
  } catch (error) {
    return { error: error.message };
  }
}

// ============== BLUESKY ==============
async function broadcastToBluesky(content, config) {
  if (!config.BLUESKY_APP_PASSWORD) {
    return { error: "Bluesky not configured" };
  }
  return { error: "Bluesky needs AT Protocol library" };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
