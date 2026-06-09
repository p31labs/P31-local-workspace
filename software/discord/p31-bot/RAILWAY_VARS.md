# Railway Environment Variables Setup

This script sets all required environment variables for the P31 Discord Bot on Railway.

## Required Variables (Missing from .env)

You need to get these from Discord Developer Portal:
- `DISCORD_CLIENT_ID` - Your Application ID
- `DISCORD_GUILD_ID` - Your Discord Server ID

## Set Variables via Railway CLI

```bash
cd software/discord/p31-bot

# Required
railway variables set DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
railway variables set DISCORD_CLIENT_ID=your_client_id_here
railway variables set DISCORD_GUILD_ID=your_guild_id_here

# Bot config
railway variables set BOT_PREFIX=p31
railway variables set NODE_ENV=production
railway variables set ENABLE_FAWN_DETECTION=true
railway variables set MAX_SPOON_DISPLAY=12
railway variables set RESPONSE_TIMEOUT_MS=5000
railway variables set NODE_ONE_WEBHOOK_PORT=3000

# API URLs
railway variables set BONDING_API_URL=https://bonding.p31ca.org/api
railway variables set NODE_ONE_API_URL=http://localhost:3001/api
railway variables set SPOON_API_URL=https://phosphorus31.org/api/spoons
railway variables set CORTEX_API_URL=https://p31-cortex.workers.dev
railway variables set SCE_API_URL=https://p31labs.github.io/social-content-engine

# Channel IDs
railway variables set ANNOUNCEMENTS_CHANNEL_ID=1486966043128893492
railway variables set SHOWCASE_CHANNEL_ID=1486958712655581184

# GitHub
railway variables set GITHUB_REPO=p31labs/andromeda
```

## Or paste this entire block into Railway Dashboard → Settings → Variables

```
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
BOT_PREFIX=p31
NODE_ENV=production
ENABLE_FAWN_DETECTION=true
MAX_SPOON_DISPLAY=12
RESPONSE_TIMEOUT_MS=5000
NODE_ONE_WEBHOOK_PORT=3000
BONDING_API_URL=https://bonding.p31ca.org/api
NODE_ONE_API_URL=http://localhost:3001/api
SPOON_API_URL=https://phosphorus31.org/api/spoons
CORTEX_API_URL=https://p31-cortex.workers.dev
SCE_API_URL=https://p31labs.github.io/social-content-engine
ANNOUNCEMENTS_CHANNEL_ID=1486966043128893492
SHOWCASE_CHANNEL_ID=1486958712655581184
GITHUB_REPO=p31labs/andromeda
```