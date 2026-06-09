# P31 Discord Bot

Multi-purpose Discord bot for P31 Labs ecosystem with spoon economy, quantum egg hunt, housing crisis support, and webhook integrations.

## Features

- **Spoon Economy** — Virtual currency system with leaderboard
- **Quantum Egg Hunt** — Discovery system with founding nodes and +39 spoons per egg
- **Webhook Handler** — Receives events from Ko-fi, Stripe, Node-One, BONDING, GitHub
- **Housing Crisis** — Emergency resource database for Camden County, Georgia
- **ESG Campaign** — Grant tracking and rehoused counter
- **Fawn Guard** — Filters neurotypical platitudes from messages
- **Telemetry** — Tracks bot usage and errors

## Commands (17 Total)

| Command | Description |
|---------|-------------|
| `p31 spoon` | Manage spoon economy (award, balance, transfer, link) |
| `p31 bonding` | BONDING game relay commands |
| `p31 status` | Bot status and uptime |
| `p31 help` | Display help information |
| `p31 deploy` | Deployment management |
| `p31 eggs` | Quantum Egg Hunt status and progress |
| `p31 claim <egg>` | Claim discovered eggs (bashium, willium, missing_node, tetrahedron) |
| `p31 nodes` | Node information display |
| `p31 cortex` | Cortex webhook status |
| `p31 health` | Health endpoint status |
| `p31 social` | Social broadcast controls |
| `p31 leaderboard` | Spoon economy leaderboard |
| `p31 easter` | Easter event commands |
| `p31 housing` | Emergency housing resources |
| `p31 telemetry` | Usage telemetry display |
| `p31 esg` | ESG grant information |
| `p31 rehoused` | Rehoused campaign counter |

## Services (9 Total)

| Service | Description |
|---------|-------------|
| TelemetryService | Tracks webhooks, commands, errors |
| QuantumEggHunt | Processes egg discovery and claims |
| eggTracker | File-backed egg progress tracking |
| WebhookHandler | Express server for Ko-fi/Stripe/Node-One/BONDING webhooks |
| retryUtility | Circuit breaker and retry logic |
| FawnDetector | Neurotypical platitude filter |
| spoonLedger | File-backed spoon economy |
| handleScaffoldCommand | #showcase channel scaffolding |
| CortexWebhook | Cortex webhook route integration |

## Configuration

```bash
# Environment Variables
DISCORD_TOKEN=your_bot_token
KOFI_VERIFICATION_TOKEN=your_kofi_token
NODE_ONE_WEBHOOK_PORT=3000
TELEMETRY_API_URL=https://your-telemetry/api
BONDING_CHANNEL_ID=your_channel_id
NODE_ONE_CHANNEL_ID=your_channel_id
ANNOUNCEMENTS_CHANNEL_ID=your_channel_id
SHOWCASE_CHANNEL_ID=your_channel_id
ENABLE_FAWN_DETECTION=true
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Start bot
npm start
```

## Deployment

```bash
# Using PM2
npx pm2 start dist/index.js --name p31-bot

# With custom port
PORT=4000 npx pm2 start dist/index.js --name p31-bot
```

## Webhook Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /webhook/kofi` | Ko-fi donation webhooks |
| `POST /webhook/node-one` | Node One device events |
| `POST /webhook/bonding` | BONDING game events |
| `POST /webhook/stripe` | Stripe payment webhooks |
| `POST /webhook/github` | GitHub push/PR events |
| `GET /health` | Health check endpoint |

## Egg Hunt

**Discoverable Eggs:**
- `bashium` — Bashium Element
- `willium` — Willium Element  
- `missing_node` — The Missing Node (172.35Hz)
- `tetrahedron` — Posner Molecule (K₄)

**Rewards:**
- +39 spoons per egg claimed
- Founding node slots (4 total) when all 4 eggs complete

## Funding

- **Ko-fi:** [ko-fi.com/trimtab69420](https://ko-fi.com/trimtab69420)
- **Donate:** [p31ca.org/donate](https://p31ca.org/donate)
- **GitHub Sponsors:** [github.com/p31labs](https://github.com/p31labs)

## License

Dual-licensed under AGPL-3.0 (open source) and Commercial License. See [LICENSE](../cognitive-prosthetic/LICENSE) and [COMMERCIAL_LICENSE](../cognitive-prosthetic/COMMERCIAL_LICENSE.md).

## Architecture

```
Discord User
    │
    ▼
Discord.js Client (Gateway)
    │
    ├── Command Registry (17 commands)
    │
    ▼
Webhook Handler (Express)
    │── /webhook/kofi → Ko-fi donations + spoons
    │── /webhook/stripe → Stripe donations + spoons
    │── /webhook/node-one → Node One events
    │── /webhook/bonding → BONDING game events
    │── /webhook/github → GitHub events
    │
    ▼
Services (9 total)
    ├── TelemetryService
    ├── QuantumEggHunt
    ├── eggTracker
    ├── spoonLedger
    ├── FawnDetector
    └── ...
```

---

*Copyright (C) 2026 P31 Labs*
*Delta Mesh Operational*
