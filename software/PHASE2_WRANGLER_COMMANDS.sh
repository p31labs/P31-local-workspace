# Phase 2: Cloudflare Infrastructure Setup

This script generates the real KV namespaces, D1 databases, and R2 buckets needed for the workers to deploy.

## Prerequisites

1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. Ensure you have the P31 Cloudflare account

## Execute These Commands

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# KV NAMESPACES
# ═══════════════════════════════════════════════════════════════════════════════

# TELEMETRY_KV (telemetry-worker)
wrangler kv:namespace create "TELEMETRY_KV" --cloudflare-email=your@email.com

# STATE_KV (quantum-edge)
wrangler kv:namespace create "STATE_KV" --cloudflare-email=your@email.com

# ALERTS_KV (quantum-edge)
wrangler kv:namespace create "ALERTS_KV" --cloudflare-email=your@email.com

# PASSPORT_KV (p31-workers)
wrangler kv:namespace create "PASSPORT_KV" --cloudflare-email=your@email.com

# SPOONS_KV (p31-workers)
wrangler kv:namespace create "SPOONS_KV" --cloudflare-email=your@email.com

# THRESHOLDS_KV (p31-workers)
wrangler kv:namespace create "THRESHOLDS_KV" --cloudflare-email=your@email.com

# ═══════════════════════════════════════════════════════════════════════════════
# D1 DATABASES
# ═══════════════════════════════════════════════════════════════════════════════

wrangler d1 create love-db --cloudflare-email=your@email.com
wrangler d1 create spoons-db --cloudflare-email=your@email.com
wrangler d1 create legal-db --cloudflare-email=your@email.com
wrangler d1 create mesh-db --cloudflare-email=your@email.com
wrangler d1 create telemetry-db --cloudflare-email=your@email.com

# ═══════════════════════════════════════════════════════════════════════════════
# R2 BUCKETS
# ═══════════════════════════════════════════════════════════════════════════════

wrangler r2 bucket create passport-r2 --cloudflare-email=your@email.com
wrangler r2 bucket create legal-r2 --cloudflare-email=your@email.com
wrangler r2 bucket create mesh-r2 --cloudflare-email=your@email.com

# ═══════════════════════════════════════════════════════════════════════════════
# GITHUB SECRETS
# ═══════════════════════════════════════════════════════════════════════════════

# Set secrets via GitHub CLI
gh secret set STRIPE_SECRET_KEY --body "sk_live_51..."
gh secret set UPSTASH_TOKEN --body "your-upstash-token"
gh secret set TURBO_TOKEN --body "your-turbo-token"
gh secret set TURBO_TEAM --body "your-team-slug"

# Discord bot token (per-worker)
cd software/discord/p31-bot && wrangler secret put DISCORD_TOKEN
cd software/cloudflare-worker && wrangler secret put DISCORD_BOT_TOKEN
```

## After IDs Are Generated

Update these files with the real IDs:

| File | Replace |
|------|---------|
| `software/telemetry-worker/wrangler.toml` | `telemetry-kv-namespace-id` |
| `software/workers/wrangler.toml` | `your-*-id` placeholders |
| `software/packages/quantum-edge/wrangler.toml` | `TODO` KV IDs |