# P31 Unified Social Worker — Deployment Guide

## What This Does

Cloudflare Worker that handles all social media automation for P31 Labs:
- **Scheduled posting**: Weekly waves auto-post to Twitter, Mastodon, Bluesky
- **Discord notifications**: All waves + daily Ko-fi digest + monthly Zenodo reminders
- **Manual broadcast**: HTTP API for on-demand multi-platform posting
- **Link health checks**: Preflight verification of all P31 URLs

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Worker: p31-social-worker                   │
│  Routed to: social.p31ca.org                            │
│                                                         │
│  HTTP Endpoints:                                        │
│    GET  /           → Health check + documentation      │
│    GET  /status     → Platform configuration check      │
│    GET  /waves      → List available content waves      │
│    POST /broadcast  → Post to platforms { content }     │
│    POST /trigger    → Fire named wave { wave }          │
│    POST /preflight  → Run link health check             │
│                                                         │
│  Cron Triggers (recurring):                             │
│    Mon 17:00 UTC    → Weekly wave (+ platform posts)    │
│    Wed 17:00 UTC    → Mid-week update (+ posts)         │
│    Fri 17:00 UTC    → Weekend recap (+ posts)           │
│    Daily 17:20 UTC  → Ko-fi digest (Discord only)       │
│    1st 13:00 UTC    → Zenodo reminder (Discord only)    │
│                                                         │
│  Platforms:                                             │
│    Twitter/X  — OAuth 1.0a (crypto.subtle, no npm)      │
│    Reddit     — OAuth2 script app flow                  │
│    Bluesky    — AT Protocol (REST)                      │
│    Mastodon   — Status API (Bearer token)               │
│    Nostr      — Stub (needs nostr-tools)                │
│    Substack   — Newsletter API                          │
│    Discord    — Webhook notifications                   │
└─────────────────────────────────────────────────────────┘
```

## Deploy Steps

### 1. Install dependencies

```bash
cd software/cloudflare-worker/social-drop-automation
npm install
```

### 2. Set secrets

At minimum, set Discord webhook:
```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
```

For platform posting, set the relevant credentials:
```bash
# Twitter/X
npx wrangler secret put TWITTER_API_KEY
npx wrangler secret put TWITTER_API_SECRET
npx wrangler secret put TWITTER_ACCESS_TOKEN
npx wrangler secret put TWITTER_ACCESS_TOKEN_SECRET

# Reddit
npx wrangler secret put REDDIT_CLIENT_ID
npx wrangler secret put REDDIT_CLIENT_SECRET
npx wrangler secret put REDDIT_USERNAME
npx wrangler secret put REDDIT_PASSWORD

# Bluesky
npx wrangler secret put BLUESKY_HANDLE
npx wrangler secret put BLUESKY_APP_PASSWORD

# Mastodon
npx wrangler secret put MASTODON_INSTANCE
npx wrangler secret put MASTODON_ACCESS_TOKEN
```

### 3. Deploy

```bash
npx wrangler deploy
```

### 4. Verify

```bash
# Health check
curl https://social.p31ca.org/

# Check platform status
curl https://social.p31ca.org/status

# List available waves
curl https://social.p31ca.org/waves
```

## Manual Operations

### Test a specific wave
```bash
curl -X POST https://social.p31ca.org/trigger \
  -H "Content-Type: application/json" \
  -d '{"wave": "weekly_update"}'
```

### Post custom content
```bash
curl -X POST https://social.p31ca.org/broadcast \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from P31 Labs!", "platforms": ["twitter", "mastodon"]}'
```

### Run link health check
```bash
curl -X POST https://social.p31ca.org/preflight
```

## Available Wave IDs

| Wave ID | Schedule | Platforms |
|---------|----------|-----------|
| `weekly_update` | Monday 17:00 UTC | twitter, mastodon, bluesky |
| `midweek` | Wednesday 17:00 UTC | twitter, mastodon |
| `weekend_recap` | Friday 17:00 UTC | twitter, mastodon, bluesky |
| `kofi_digest` | Daily 17:20 UTC | discord only |
| `zenodo_reminder` | 1st of month 13:00 UTC | discord only |
| `wave1_kofi` | Manual only | ko-fi |
| `wave2_twitter` | Manual only | twitter |
| `wave3_linkedin` | Manual only | linkedin |

## Superseded Workers

These workers are now consolidated into `p31-social-worker`:
- `social-drop-automation/worker.js` (v1) — one-shot March 26-31 crons
- `p31_social_broadcast_worker.js` — stub multi-platform poster

The Ko-fi webhook worker (`p31_kofi_webhook_worker.js`) remains separate at `kofi.p31ca.org`.

## Route Configuration

Default route: `social.p31ca.org/*`. To change, edit `wrangler.toml`:
```toml
routes = [
  { pattern = "your-route.p31ca.org/*", zone_name = "p31ca.org" }
]
```
