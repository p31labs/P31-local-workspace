# P31 Discord Integration Documentation

## Quick Start

### 1. Create Discord Server

Create a new Discord server at https://discord.com. Name it "P31 Labs Community" or similar.

### 2. Create Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Navigate to "Bot" section
4. Click "Reset Token" to get your bot token
5. Enable required intents: `GUILD_MESSAGES`, `MESSAGE_CONTENT`, `GUILD_VOICE_STATES`
6. Copy the token to `.env` file (see `.env.example`)

### 3. Invite Bot to Server

Generate an invite link in the Developer Portal under "OAuth2" > "URL Generator":
- Scopes: `bot`
- Permissions: `Send Messages`, `Embed Links`, `Use External Emojis`, `Manage Roles`, `Connect`, `Speak`

### 4. Install Dependencies

```bash
cd software/discord/p31-bot
npm install
```

### 5. Configure Environment

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
# Edit .env with your Discord token and channel IDs
```

### 6. Run the Bot

```bash
npm run build
npm start
```

---

## Channel Setup

After creating the Discord server, create the following channels:

### P31 Labs (Organizational)
- `#announcements` - ID: save to ANNOUNCEMENTS_CHANNEL_ID
- `#roadmap`
- `#introductions`
- `#faq`

### BONDING (Gaming)
- `#game-discussion`
- `#quest-help`
- `#multiplayer-matchmaking` - ID: save to BONDING_CHANNEL_ID
- `#bugs-feedback`
- Voice: `🎮 BONDING Room 1`, `🎮 BONDING Room 2`

### Support
- `#technical-support` - ID: save to SUPPORT_CHANNEL_ID
- `#accessibility-questions`
- `#general-help`

### Node One (Hardware)
- `#build-guides`
- `#firmware-discussion`
- `#hardware-mods`
- Voice: `🔧 Lab Bench`

### General
- `#off-topic`
- `#showcase`
- `#resources`
- Voice: `☕ Lounge`, `🎤 Stage`

---

## Role Setup

Create the following roles in Discord server settings:

| Role | Color | Permissions |
|------|-------|-------------|
| `@everyone` | Default | Read channels |
| `@member` | Phosphor Green (#00FF88) | Post, react |
| `@contributor` | Quantum Cyan (#00D4FF) | Manage messages, pins |
| `@moderator` | Calcium Amber (#F59E0B) | Kick, ban, manage roles |
| `@admin` | Quantum Violet (#7A27FF) | Full server control |

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `p31 status [device]` | Check Node One/P31 system status |
| `p31 bonding [action]` | BONDING game stats, quests, multiplayer help |
| `p31 spoon [action]` | Track spoons and LOVE (spoon economy) |
| `p31 help [command]` | Show help |

### Bonding Subcommands
- `p31 bonding stats` - Overall game statistics
- `p31 bonding stats <player>` - Specific player stats
- `p31 bonding quest` - Show all quest chains
- `p31 bonding quest <name>` - Show specific quest details
- `p31 bonding multiplayer` - How to play with others

### Spoon Subcommands
- `p31 spoon` - Show current spoon/LOVE status
- `p31 spoon check` - Same as above
- `p31 spoon add <amount>` - Add spoons
- `p31 spoon use <amount>` - Use/spend spoons
- `p31 spoon earn <amount>` - Add LOVE

---

## Webhook Configuration

### BONDING Multiplayer Webhook

Configure your BONDING server to send webhooks when matches start/end:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "bonding-match",
    "data": {
      "type": "start",
      "roomCode": "ABC123",
      "players": ["player1", "player2"]
    },
    "timestamp": 1700000000000
  }'
```

### Node One Telemetry Webhook

Configure your Node One devices to send status updates:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "node-one-status",
    "data": {
      "deviceId": "NODE-001",
      "status": "online",
      "battery": 85,
      "signal": -42
    },
    "timestamp": 1700000000000
  }'
```

### Ko-fi Webhook

In Ko-fi dashboard, configure webhook URL to point to the webhook server. Ko-fi will send POST on each purchase.

---

## Cognitive Accessibility Features

### Fawn Response Detection

The bot monitors messages for patterns indicating fawn response (suppressing authentic self to match external expectations). When detected with high confidence (>70%), it offers a de-escalation message.

Enable/disable via `ENABLE_FAWN_DETECTION` in `.env`.

### Clear Communication

All bot responses follow P31 communication guidelines:
- Direct, no corporate pleasantries
- Clear language, no unexplained jargon
- Geometric metaphors OK (tetrahedra, delta topology)
- NO military/submarine metaphors

### Spoon Economy

Spoons represent cognitive/physical energy (spent). LOVE represents regulation credits (earned). Both are displayed with visual bars.

---

## Troubleshooting

### Bot not responding
- Check bot token is correct in `.env`
- Verify bot has necessary permissions
- Check bot is added to the server

### Webhooks not working
- Ensure webhook server is running (`npm start`)
- Check firewall allows the webhook port
- Verify payload format matches spec in `webhook-config.md`

### TypeScript errors
- Run `npm install` to install all dependencies
- Check Node.js version (requires v18+)

---

## File Structure

```
software/discord/
├── server-structure.md      # Server channels and roles
├── webhook-config.md        # Webhook payloads and events
├── p31-bot/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts         # Main bot entry
│       ├── commands/
│       │   ├── base.ts     # Command interface
│       │   ├── status.ts   # Status command
│       │   ├── bonding.ts  # BONDING command
│       │   ├── spoon.ts    # Spoon economy command
│       │   └── help.ts     # Help command
│       └── services/
│           ├── fawnDetector.ts     # Fawn response detection
│           ├── webhookHandler.ts  # Webhook server
│           └── telemetry.ts        # Event tracking
```

---

## Integration with P31 Ecosystem

The bot integrates with:
- **BONDING** (bonding.p31ca.org) - Game stats, multiplayer matches
- **Node One** (hardware) - Device status, telemetry
- **Ko-fi** (ko-fi.com/trimtab69420) - Supporter/Node Count updates
- **P31 Labs** (phosphorus31.org) - Organization info

---

*It's okay to be a little wonky.* 🔺