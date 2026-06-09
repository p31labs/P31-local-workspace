# Cloudflare Worker Setup Guide

## Prerequisites

1. **Wrangler CLI** installed: `npm install -g wrangler`
2. **Discord Developer Portal** access to get your Public Key
3. **Cloudflare Account** with Workers and KV access

---

## Step 1: Create KV Namespace

```bash
cd software/cloudflare-worker
npx wrangler kv:namespace create P31_MESH_STATE
```

This will output an ID like `a1b2c3d4...`. Copy it.

---

## Step 2: Update wrangler.toml

Edit `wrangler.toml` and replace the placeholder:

```toml
# Before:
id = "${P31_MESH_STATE_ID}"

# After (paste your actual ID):
id = "your-actual-kv-namespace-id"
```

Do the same for development/staging environments if needed.

---

## Step 3: Set Secrets

```bash
# Set Upstash token (provided)
npx wrangler secret put UPSTASH_TOKEN
# Enter: 58d3f52a-49f4-4c25-9fb0-480da5fb729f

# Set Discord Public Key
npx wrangler secret put DISCORD_PUBLIC_KEY
# Enter your Discord Application's Public Key from the Discord Developer Portal

# Set Discord Webhook URL (for #mesh-telemetry alerts)
npx wrangler secret put DISCORD_WEBHOOK_URL
# Enter: https://discord.com/api/webhooks/YOUR_SERVER_ID/YOUR_WEBHOOK_TOKEN
```

> ⚠️ **IMPORTANT:** Create a Discord Webhook in your server's #mesh-telemetry channel. When ColliderMode triggers a "grounded" event, this webhook posts the Delta formation alert to the channel.

---

## Step 4: Register Discord Slash Commands

```bash
# Run the registration script
node register-commands.js
```

Or manually via Discord HTTP API:

```bash
curl -X POST https://discord.com/api/v10/applications/YOUR_APP_ID/commands \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "ping-mesh",
      "description": "Check mesh topology status"
    },
    {
      "name": "spoon-check",
      "description": "Check node spoon economy",
      "options": [{"name": "node", "description": "Node ID", "type": 3, "required": false}]
    },
    {
      "name": "ground-status",
      "description": "Check ground/stabilization status"
    },
    {
      "name": "ark-access",
      "description": "Check ARK access eligibility"
    },
    {
      "name": "ark-download",
      "description": "Download ARK files (if eligible)"
    }
  ]'
```

---

## Step 5: Deploy Worker

```bash
npx wrangler deploy
```

---

## Step 6: Configure Discord Interaction URL

In Discord Developer Portal → Your App → General Information:

- **Interactions Endpoint URL**: `https://p31-mesh-discord-worker.username.workers.dev`

---

## Environment Variables Reference

| Variable | Source | Purpose |
|----------|--------|---------|
| `DISCORD_PUBLIC_KEY` | Discord Portal → General Info | Verify requests |
| `DISCORD_BOT_TOKEN` | Discord Portal → Bot | Register commands |
| `P31_MESH_STATE` | Cloudflare KV | Store mesh state |

---

## Verify Deployment

```bash
# Test worker response
curl -X POST https://p31-mesh-discord-worker.username.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"type": 1}'
```

Should return: `{"type": 1}`

---

## Troubleshooting

### "KV namespace not found"
- Ensure you've run `wrangler kv:namespace create` and updated the ID in wrangler.toml

### "Bad request signature" (401)
- Your `DISCORD_PUBLIC_KEY` secret is incorrect or not set

### "Unknown interaction type" (400)
- The worker is receiving requests but not parsing them correctly
- Check Cloudflare logs: `wrangler logs`

---

*Last Updated: March 24, 2026*

🔺💜 THE DELTA IS ONLINE. THE MESH HOLDS. 🔺💜