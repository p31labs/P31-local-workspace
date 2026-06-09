# Social API & Key Setup Guide
## P31 Labs — Quick Reference

**Goal:** Get all social platform API keys configured so the broadcast worker can post to multiple platforms.

---

## 🎯 Priority Order (Do These First)

### 1. Discord Webhook (2 minutes — easiest)

1. Open Discord → Go to your server
2. Click the channel where you want notifications
3. Channel Settings → Integrations → Webhooks → New Webhook
4. Name it "P31 Social Drop"
5. Copy the webhook URL
6. Set the secret:

```bash
cd software/cloudflare-worker
npx wrangler secret put DISCORD_WEBHOOK_URL
# Paste the URL when prompted
```

**Done.** This is all you need for the social drop automation worker.

---

### 2. Twitter/X API (10 minutes)

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Sign in with your Twitter account
3. Apply for a Developer Account (free tier works)
4. Create a new Project + App
5. Go to "Keys and Tokens"
6. Generate:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret
7. Set the secrets:

```bash
cd software/cloudflare-worker
npx wrangler secret put TWITTER_API_KEY
npx wrangler secret put TWITTER_API_SECRET
npx wrangler secret put TWITTER_ACCESS_TOKEN
npx wrangler secret put TWITTER_ACCESS_SECRET
```

---

### 3. Reddit API (5 minutes)

1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose **"script"** type
4. Name: "P31 Labs"
5. Redirect URI: `http://localhost:8080` (not used, but required)
6. Note your:
   - Client ID (under the app name)
   - Client Secret
7. Set the secrets:

```bash
cd software/cloudflare-worker
npx wrangler secret put REDDIT_CLIENT_ID
npx wrangler secret put REDDIT_CLIENT_SECRET
npx wrangler secret put REDDIT_USERNAME
npx wrangler secret put REDDIT_PASSWORD
```

---

### 4. Substack API (if publishing newsletters)

Substack doesn't have a public API key system. You have two options:

**Option A:** Use the Substack web editor manually (no API needed)
**Option B:** Use RSS-to-email automation (Zapier/IFTTT)

Skip this for now — post to Substack manually.

---

### 5. Mastodon (optional — Fediverse)

1. Go to your Mastodon instance (e.g., mastodon.social)
2. Settings → Development → New Application
3. Name: "P31 Labs"
4. Scopes: `write:statuses`
5. Copy the Access Token
6. Set the secrets:

```bash
cd software/cloudflare-worker
npx wrangler secret put MASTODON_INSTANCE
# e.g., https://mastodon.social
npx wrangler secret put MASTODON_ACCESS_TOKEN
```

---

### 6. Bluesky (optional — AT Protocol)

1. Go to [bsky.app](https://bsky.app)
2. Settings → App Passwords → Add App Password
3. Name: "P31 Labs"
4. Copy the generated app password
5. Set the secrets:

```bash
cd software/cloudflare-worker
npx wrangler secret put BLUESKY_HANDLE
# e.g., p31labs.bsky.social
npx wrangler secret put BLUESKY_APP_PASSWORD
```

---

### 7. Nostr (optional — Decentralized)

Generate a private key using any Nostr client (Damus, Amethyst, etc.) or:

```bash
# Quick key generation (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
cd software/cloudflare-worker
npx wrangler secret put NOSTR_PRIVATE_KEY
npx wrangler secret put NOSTR_RELAYS
# Default: wss://relay.damus.io,wss://nos.lol,wss://relay.nostr.band
```

---

## ✅ Verify Your Setup

After setting secrets, check which platforms are configured:

```bash
curl https://mesh.p31ca.org/?action=status
```

Expected response:
```json
{
  "nostr": true/false,
  "twitter": true/false,
  "substack": true/false,
  "reddit": true/false,
  "mastodon": true/false,
  "bluesky": true/false
}
```

---

## 🔑 All Secrets Reference

| Secret | Platform | Required? |
|--------|----------|-----------|
| `DISCORD_WEBHOOK_URL` | Discord | ✅ Yes (social drop) |
| `TWITTER_API_KEY` | Twitter/X | Recommended |
| `TWITTER_API_SECRET` | Twitter/X | Recommended |
| `TWITTER_ACCESS_TOKEN` | Twitter/X | Recommended |
| `TWITTER_ACCESS_SECRET` | Twitter/X | Recommended |
| `REDDIT_CLIENT_ID` | Reddit | Recommended |
| `REDDIT_CLIENT_SECRET` | Reddit | Recommended |
| `REDDIT_USERNAME` | Reddit | Recommended |
| `REDDIT_PASSWORD` | Reddit | Recommended |
| `SUBSTACK_API_KEY` | Substack | Optional |
| `MASTODON_INSTANCE` | Mastodon | Optional |
| `MASTODON_ACCESS_TOKEN` | Mastodon | Optional |
| `BLUESKY_HANDLE` | Bluesky | Optional |
| `BLUESKY_APP_PASSWORD` | Bluesky | Optional |
| `NOSTR_PRIVATE_KEY` | Nostr | Optional |
| `NOSTR_RELAYS` | Nostr | Optional |

---

## 🚀 Quick Start (Minimum Viable)

If you just want the social drop automation to work:

```bash
# 1. Set Discord webhook (only required secret)
cd software/cloudflare-worker/social-drop-automation
npx wrangler secret put DISCORD_WEBHOOK_URL

# 2. Deploy
npx wrangler deploy

# 3. Test pre-flight
curl -X POST https://social-drop.p31ca.org/preflight
```

**That's it.** The wave reminders will fire on schedule via Discord.

For multi-platform broadcasting (Twitter + Reddit + etc.), set the additional secrets in the broadcast worker:

```bash
cd software/cloudflare-worker
npx wrangler secret put TWITTER_API_KEY
# ... etc
```

---

## 🛠️ Troubleshooting

**"Worker name missing" error:**
You're in the wrong directory. `cd` into the worker directory first:
```bash
cd software/cloudflare-worker/social-drop-automation
```

**"Wrangler workspace detection" error:**
You're at the repo root. Navigate to the specific worker:
```bash
cd software/cloudflare-worker
```

**Secret not showing up:**
List all secrets for a worker:
```bash
npx wrangler secret list
```

**Want to delete a secret:**
```bash
npx wrangler secret delete SECRET_NAME
```
