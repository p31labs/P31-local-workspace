# Railway Deployment - Manual Steps

The CLI is having issues linking to the project. Try this manual approach:

## Option 1: Via Railway Dashboard

1. Go to: https://railway.com/project/27559fd1-22f2-4b66-959f-2563f5c0b227

2. Click on the existing service (there should be one from the failed deploy)

3. Go to **Settings** → **Variables**

4. Add all these variables:

```
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=1485634254380601485
DISCORD_GUILD_ID=1449826533089742962
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

5. Click **Deploy**

## Option 2: Try CLI with environment name

Once you see the environment name in the dashboard, run:
```bash
railway up --project=27559fd1-22f2-4b66-959f-2563f5c0b227 --environment=production
```