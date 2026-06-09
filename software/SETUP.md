# P31 Andromeda — Master Setup Guide

**Version:** 1.0.0  
**Date:** 2026-03-26  
**Purpose:** Single source of truth for setting up the entire P31 ecosystem

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  P31 ANDROMEDA ECOSYSTEM                                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Frontend    │  │  Backend    │  │  Cloudflare Workers  │  │
│  │  (React/     │  │  (FastAPI)  │  │  (Edge Computing)    │  │
│  │   Three.js)  │  │  :8000      │  │  :8787 (local)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Discord Bot │  │  Neo4j      │  │  Social Automation   │  │
│  │  (Node.js)   │  │  (Graph DB) │  │  (Cron Workers)      │  │
│  │  :3000       │  │  :7687      │  │  Cloudflare Edge     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  BONDING     │  │  Spaceship  │  │  Firmware (ESP32)    │  │
│  │  (Game PWA)  │  │  Earth      │  │  Node One            │  │
│  │  bonding.    │  │  (Dashboard)│  │  (Hardware)          │  │
│  │  p31ca.org   │  │  p31ca.org  │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Services Inventory

| Service | Directory | Language | Port | Dependencies |
|---------|-----------|----------|------|--------------|
| **Frontend** | `frontend/` | React/TypeScript | 5173 (dev) | Node.js 18+ |
| **Backend** | `backend/` | Python/FastAPI | 8000 | Python 3.11+, Redis |
| **Cloudflare Workers** | `workers/` | TypeScript | 8787 (local) | Wrangler CLI |
| **Cloudflare Workers** | `cloudflare-worker/` | JavaScript | 8787 (local) | Wrangler CLI |
| **Social Drop Automation** | `cloudflare-worker/social-drop-automation/` | JavaScript | Edge | Wrangler CLI |
| **Discord Bot** | `discord/p31-bot/` | TypeScript | 3000 | Node.js 18+ |
| **BONDING Game** | `bonding/` | React/TypeScript | 5173 (dev) | Node.js 18+ |
| **Spaceship Earth** | `spaceship-earth/` | React/TypeScript | 5173 (dev) | Node.js 18+ |
| **Neo4j** | Docker | Cypher | 7474/7687 | Docker |
| **Spoon Calculator** | `spoon-calculator/` | React | 5173 (dev) | Node.js 18+ |
| **Donate API** | `donate-api/` | TypeScript | Edge | Wrangler CLI |
| **Telemetry Worker** | `telemetry-worker/` | TypeScript | Edge | Wrangler CLI |
| **Firmware** | `firmware/node-one/` | C/C++ | N/A | ESP-IDF |

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ (`node --version`)
- Python 3.11+ (`python3 --version`)
- Docker & Docker Compose (`docker --version`)
- Git (`git --version`)

### Step 1: Clone & Install
```bash
git clone https://github.com/p31labs/andromeda.git
cd andromeda/software
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys (see below)
```

### Step 3: Start Core Services
```bash
# Start Neo4j database
docker-compose up -d neo4j

# Start backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal, start frontend
cd frontend
npm run dev
```

### Step 4: Verify
```bash
# Check backend
curl http://localhost:8000/health

# Check frontend
open http://localhost:5173
```

---

## 🔑 Environment Variables

### Required (Core Functionality)

| Variable | Service | Description | Where to Get |
|----------|---------|-------------|--------------|
| `NEO4J_PASSWORD` | Neo4j | Database password | Set your own |
| `ANTHROPIC_API_KEY` | Backend | Claude API key | [console.anthropic.com](https://console.anthropic.com) |
| `DEEPSEEK_API_KEY` | Backend | DeepSeek API key | [platform.deepseek.com](https://platform.deepseek.com) |
| `GOOGLE_API_KEY` | Backend | Gemini API key | [aistudio.google.com](https://aistudio.google.com) |

### Recommended (Social & Notifications)

| Variable | Service | Description | Where to Get |
|----------|---------|-------------|--------------|
| `DISCORD_WEBHOOK_URL` | Workers | Discord notifications | Discord → Channel → Webhooks |
| `DISCORD_TOKEN` | Discord Bot | Bot authentication | [discord.com/developers](https://discord.com/developers) |
| `TWITTER_API_KEY` | Workers | Twitter posting | [developer.twitter.com](https://developer.twitter.com) |
| `TWITTER_API_SECRET` | Workers | Twitter posting | [developer.twitter.com](https://developer.twitter.com) |
| `TWITTER_ACCESS_TOKEN` | Workers | Twitter posting | [developer.twitter.com](https://developer.twitter.com) |
| `TWITTER_ACCESS_SECRET` | Workers | Twitter posting | [developer.twitter.com](https://developer.twitter.com) |
| `REDDIT_CLIENT_ID` | Workers | Reddit posting | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) |
| `REDDIT_CLIENT_SECRET` | Workers | Reddit posting | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) |
| `REDDIT_USERNAME` | Workers | Reddit posting | Your Reddit account |
| `REDDIT_PASSWORD` | Workers | Reddit posting | Your Reddit account |

### Optional (Enhanced Features)

| Variable | Service | Description | Where to Get |
|----------|---------|-------------|--------------|
| `IMAP_HOST` | Backend | Email processing | Your email provider |
| `IMAP_USER` | Backend | Email processing | Your email account |
| `IMAP_PASS` | Backend | Email processing | App-specific password |
| `GITHUB_TOKEN` | Workers | GitHub integration | [github.com/settings/tokens](https://github.com/settings/tokens) |
| `SLACK_WEBHOOK_URL` | Workers | Slack notifications | Slack → Apps → Webhooks |
| `MASTODON_INSTANCE` | Workers | Fediverse posting | Your Mastodon instance |
| `MASTODON_ACCESS_TOKEN` | Workers | Fediverse posting | Mastodon → Settings → Development |
| `BLUESKY_HANDLE` | Workers | AT Protocol posting | [bsky.app](https://bsky.app) |
| `BLUESKY_APP_PASSWORD` | Workers | AT Protocol posting | Bluesky → Settings → App Passwords |
| `NOSTR_PRIVATE_KEY` | Workers | Nostr posting | Generate with Nostr client |

---

## 🛠️ Per-Service Setup

### Backend (FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### Cloudflare Workers
```bash
cd workers
npm install
npx wrangler dev  # Local development
npx wrangler deploy  # Production
```

### Social Drop Automation
```bash
cd cloudflare-worker/social-drop-automation
npm install
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler deploy
```

### Discord Bot
```bash
cd discord/p31-bot
npm install
# Set DISCORD_TOKEN in .env
npm run dev
```

### BONDING Game
```bash
cd bonding
npm install
npm run dev
```

### Spaceship Earth
```bash
cd spaceship-earth
npm install
npm run dev
```

### Neo4j (Docker)
```bash
docker-compose up -d neo4j
# Access at http://localhost:7474
# Default credentials: neo4j / (your NEO4J_PASSWORD)
```

---

## 🔍 Health Checks

After setup, verify all services:

```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173

# Neo4j
curl http://localhost:7474

# Cloudflare Workers (local)
curl http://localhost:8787
```

---

## 🚨 Troubleshooting

### "Port already in use"
```bash
# Find process using port
lsof -i :8000  # or :5173, :7687, etc.
kill -9 <PID>
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Neo4j connection failed"
```bash
# Check Docker is running
docker ps
# Restart Neo4j
docker-compose restart neo4j
```

### "Wrangler workspace detection error"
```bash
# You're in the wrong directory
cd cloudflare-worker/social-drop-automation
npx wrangler deploy
```

---

## 📖 Additional Documentation

- [Cognitive Passport](../P31_COGNITIVE_PASSPORT.md) — Operator context
- [CONSTITUTION.md](../CONSTITUTION.md) — Project governance
- [BONDING Docs](bonding/README.md) — Game documentation
- [Workers Docs](workers/README.md) — Edge computing documentation
- [Social API Setup](cloudflare-worker/SOCIAL_API_SETUP.md) — Social platform keys

---

*It's okay to be a little wonky.* 🔺
