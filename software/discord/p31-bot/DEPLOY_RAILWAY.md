# P31 Discord Bot - Railway Deployment

## Quick Deploy

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project (select your P31 project or create new)
railway init

# 4. Add environment variables
railway variables set DISCORD_TOKEN=your_token
railway variables set DISCORD_CLIENT_ID=your_client_id
railway variables set DISCORD_GUILD_ID=your_guild_id

# Optional: Add additional variables
railway variables set BONDING_API_URL=https://bonding.p31ca.org/api
railway variables set SPOON_API_URL=https://phosphorus31.org/api/spoons
railway variables set SUBSTACK_WEBHOOK_URL=your_discord_webhook

# 5. Deploy
railway up
```

## Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Your Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | Discord application client ID |
| `DISCORD_GUILD_ID` | ✅ | Discord server ID for slash commands |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_PREFIX` | `p31` | Command prefix |
| `BONDING_API_URL` | - | BONDING API URL |
| `SPOON_API_URL` | - | Spoon API URL |
| `NODE_ONE_API_URL` | `http://localhost:3001/api` | Node One API |
| `TELEMETRY_API_URL` | - | Telemetry endpoint |
| `NODE_ONE_WEBHOOK_PORT` | `3000` | Webhook port |
| `BONDING_CHANNEL_ID` | - | BONDING events channel |
| `ANNOUNCEMENTS_CHANNEL_ID` | - | Announcements channel |
| `ENABLE_FAWN_DETECTION` | `true` | Enable fawn detection |
| `MAX_SPOON_DISPLAY` | `12` | Max spoons display |
| `RESPONSE_TIMEOUT_MS` | `5000` | API timeout |
| `SUBSTACK_WEBHOOK_URL` | - | Discord webhook for Substack RSS |

## Verify Deployment

```bash
# Check logs
railway logs

# Check status
railway status
```

## Troubleshooting

```bash
# Restart the service
railway restart

# Open a shell in the container
railway run bash

# View environment variables
railway variables
```

## Using railway.json (Automated)

The `railway.json` in this repo specifies:
- Build: `npm install && npm run build`
- Start: `node dist/index.js`

Railway will auto-detect and use these on `railway up`.