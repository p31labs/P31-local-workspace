# P31 Discord Bot - Deployment Documentation

## Overview

P31 Discord Bot is a cognitive accessibility-focused Discord bot built by P31 Labs. It provides:

- **Spoon tracking** - Monitor cognitive energy expenditure
- **BONDING game integration** - Link to the molecular building game
- **Status commands** - System health and resource information
- **Fawn detection** - Identify patterns that may indicate social pressure response
- **Webhook handlers** - Receive events from Ko-fi, Node One hardware, and BONDING

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))

## Build

```bash
npm ci && npm run build
```

This installs dependencies and compiles TypeScript to JavaScript.

## Required Environment Variables

Create a `.env` file in the `p31-bot` directory with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Your Discord bot token from the Developer Portal |
| `DISCORD_CLIENT_ID` | Yes | Your Discord application client ID |
| `DISCORD_GUILD_ID` | Yes | The Discord server (guild) ID for slash commands |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_PREFIX` | `p31` | Command prefix for text commands |
| `BONDING_API_URL` | - | URL to BONDING API |
| `NODE_ONE_API_URL` | `http://localhost:3001/api` | URL to Node One API |
| `SPOON_API_URL` | - | URL to Spoon API |
| `TELEMETRY_API_URL` | - | URL for telemetry tracking |
| `NODE_ONE_WEBHOOK_PORT` | `3000` | Port for webhook server |
| `BONDING_CHANNEL_ID` | - | Discord channel for BONDING events |
| `NODE_ONE_CHANNEL_ID` | - | Discord channel for Node One events |
| `ANNOUNCEMENTS_CHANNEL_ID` | - | Discord channel for announcements |
| `ENABLE_FAWN_DETECTION` | `true` | Enable fawn response detection |
| `MAX_SPOON_DISPLAY` | `12` | Maximum spoons to display |
| `RESPONSE_TIMEOUT_MS` | `5000` | API request timeout |

## Start

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Start (Development)

```bash
npm run dev
```

## Health Check

The bot exposes a health check endpoint at:

```
GET http://localhost:3000/health
```

Returns: `200 OK` with `{ "status": "ok", "service": "p31-webhook-handler" }`

## Verify

Check Docker logs to confirm the bot started successfully:

```bash
docker logs p31-discord-bot
```

Expected output:
- Bot logged in as `<username>#0000`
- Prefix: `p31`
- Commands registered: spoon, bonding, status, help
- Fawn detection: enabled/disabled
- Webhook handler listening on port 3000

## Webhook Endpoints

When running, the bot exposes these webhook endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /webhook/kofi` | Ko-fi donation events |
| `POST /webhook/node-one` | Node One hardware events |
| `POST /webhook/bonding` | BONDING game events |

## Commands

| Command | Description |
|---------|-------------|
| `p31 spoon` | Show current spoon balance |
| `p31 bonding` | Get BONDING game link |
| `p31 status` | Show system status |
| `p31 help` | Show help information |

## Troubleshooting

### Bot not connecting
- Verify `DISCORD_TOKEN` is correct
- Check bot has correct intents (Guilds, GuildMessages, MessageContent)

### Health check failing
- Verify port 3000 is not in use
- Check `NODE_ONE_WEBHOOK_PORT` matches the configured port

### Commands not working
- Ensure `DISCORD_GUILD_ID` is set for guild-specific commands
- Re-invite bot with proper permissions

## Production Notes

- The bot runs as non-root user inside the container
- Health check runs every 30 seconds with 3 retries
- Container auto-restarts on failure (`unless-stopped`)