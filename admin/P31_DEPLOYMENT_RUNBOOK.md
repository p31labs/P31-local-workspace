# P31 Labs: Master Ignition Sequence & Deployment Runbook

**Classification:** Operational — Executable Only
**Version:** 1.0 — March 27, 2026
**Status:** PRODUCTION
**Supersedes:** `PRODUCTION_DEPLOYMENT_RUNBOOK.md`, `ONE_CLICK_LAUNCH_SYSTEM.md`, `PRODUCTION_DEPLOYMENT_PLAN.md`, `DEPLOYMENT_STATUS.md`, `DEPLOYMENT_SCRIPT.md`, `DEPLOYMENT_PACKAGE.md`, `STAR_DELTA_BOOT_SEQUENCE.md` (command blocks), `03_EPCP_DASHBOARD.md` Chapter 4

*Every section is copy-paste ready. No philosophy — that's in `P31_ARCHITECTURE.md`. Run top-to-bottom on a clean machine or after any gap in operations.*

---

## Part 1: Technical Boot — Star-Delta Sequence

Initializes all components in the correct sequence. See `P31_ARCHITECTURE.md §3` for the Star-Delta rationale.

### Step 1 — Memory Mesh (Star Configuration)
```bash
# Start Redis (establishes caching layer for Spoon Ledger + game state)
redis-server
# Verify:
redis-cli ping   # Expected: PONG
```

### Step 2 — Reference Frame Independence
```bash
# Boot local LLM proxy (Oracle Terminal + Fawn Guard operate without external API)
litellm --model ollama/llama3 --port 4000
```

### Step 3 — Cognitive Shield (Delta Transition)
```bash
# Filter middleware
python src/shield/catchers_mitt.py

# Redis-to-WebSocket bridge
node src/shield/redis_ws_bridge.js
```

### Step 4 — Sovereign Vault
```bash
cd software
docker-compose up -d neo4j

# Verify Neo4j on port 7687:
curl http://localhost:7474
```

### Step 5 — Edge Nodes
```bash
# Deploy BONDING relay
cd software/bonding && npx wrangler deploy

# Start Discord bot (arms egg hunt claim system)
cd software/discord/p31-bot && docker-compose up -d
```

---

## Part 2: Service Deployment

### 2.1 System Map

| Service | Directory | Host | Auto-deploy |
|---------|-----------|------|-------------|
| **Spaceship Earth PWA** | `software/spaceship-earth/` | Cloudflare Pages (`spaceship-earth`) | Push to `main` |
| **Spaceship Relay Worker** | `software/spaceship-earth/worker/` | CF Workers (`spaceship-relay`) | Manual `wrangler deploy` |
| **BONDING PWA** | `software/bonding/` | Cloudflare Pages (`bonding`) | Manual |
| **BONDING Relay Worker** | `software/bonding/worker/` | CF Workers (`bonding-relay`) | Manual `wrangler deploy` |
| **Discord Bot** | `software/discord/p31-bot/` | Local/VPS — Docker Compose | Manual `docker-compose up -d` |
| **Donate API Worker** | `software/donate-api/` | CF Workers | Manual `wrangler deploy` |

### 2.2 Prerequisites — First-Time Setup
```bash
# Verify Node.js 20+
node --version

# Verify wrangler + authenticate
npx wrangler whoami
# If not logged in:
npx wrangler login

# Install root workspace deps
cd software && npm install
```

**Required secrets in Cloudflare dashboard** (set once, persist):
- `CLOUDFLARE_API_TOKEN` — Pages + Workers deploy token
- `CLOUDFLARE_ACCOUNT_ID` — account ID
- `DISCORD_TOKEN` — bot token (in `.env`, not CF)
- `STRIPE_SECRET_KEY` — donate-api worker (already set)

### 2.3 Deploy: Spaceship Earth

**Auto-deploy (preferred):** Push to `main` — GitHub Actions `deploy-spaceship.yml` triggers, deploys `spaceship-earth/dist` to CF Pages project `spaceship-earth`.
```bash
git push origin main
```

**Manual deploy:**
```bash
cd software/spaceship-earth
npm run build
npx wrangler pages deploy dist --project-name=spaceship-earth
npx wrangler deploy   # relay worker — only if worker code changed
```

**Verify:** `https://p31ca.org` loads. `/#collider` shows ghost signal (172.35 Hz). Console clean.

### 2.4 Deploy: BONDING
```bash
cd software/bonding
npm run build
npx wrangler pages deploy dist --project-name=bonding
npx wrangler deploy   # relay worker — only if worker code changed
```

**Verify:** `https://bonding.p31ca.org` loads. Place 4 atoms → K4 tetrahedron detection fires. Two tabs → lobby sync works.

### 2.5 Deploy: Discord Bot

**First-time setup:**
```bash
cd software/discord/p31-bot
cp .env.example .env
```

Edit `.env` — **REQUIRED:**
```bash
DISCORD_TOKEN=<token from Discord Developer Portal>
DISCORD_CLIENT_ID=<application client ID>
DISCORD_GUILD_ID=<your server ID>
```

**Optional:**
```bash
BONDING_CHANNEL_ID=<channel ID>
ANNOUNCEMENTS_CHANNEL_ID=<channel ID>
OPERATOR_DISCORD_USER_ID=<Will's Discord user ID>
ENABLE_FAWN_DETECTION=true
NODE_ONE_WEBHOOK_PORT=3000
```

**Build + start:**
```bash
npm ci && npm run build
docker-compose up -d
docker logs p31-discord-bot
```

Expected output:
```
Bot logged in as P31Bot#XXXX
Prefix: p31
Commands registered: spoon, bonding, status, help
Webhook handler listening on port 3000
```

**Health check:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"p31-webhook-handler"}
```

**Without Docker (pm2 fallback):**
```bash
cd software/p31-discord-bot
cp .env.example .env   # fill DISCORD_TOKEN, CLIENT_ID, GUILD_ID
npm ci && npm run build
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 logs p31-discord-bot
```

### 2.6 Deploy: Donate API Worker
```bash
cd software/donate-api
npx wrangler deploy
```
Stripe secrets already set in CF dashboard. Verify: `https://donate-api.phosphorus31.org/health`

---

## Part 3: Clean Boot Startup Order

Run in this order after any system restart:

```bash
# 1. Discord bot FIRST — egg claims need it live immediately
cd software/discord/p31-bot && docker-compose up -d

# 2. BONDING
cd software/bonding && npm run build && npx wrangler pages deploy dist --project-name=bonding

# 3. Spaceship Earth
cd software/spaceship-earth && npm run build && npx wrangler pages deploy dist --project-name=spaceship-earth

# 4. Donate API (only if Stripe webhook changes)
cd software/donate-api && npx wrangler deploy
```

---

## Part 4: Apr 1 Quantum Egg Hunt — Critical Path

**Deadline: April 1, 2026.**

### Gate 1: Discord Bot RUNNING (blocks all egg claims)
- [ ] `.env` set with `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`
- [ ] `docker-compose up -d` in `software/discord/p31-bot/`
- [ ] `curl http://localhost:3000/health` returns 200
- [ ] Test: send `p31 help` in Discord — bot responds

### Gate 2: Spaceship Earth LIVE at p31ca.org/#collider
- [ ] Push to `main` OR `wrangler pages deploy dist --project-name=spaceship-earth`
- [ ] `/#collider` route loads ghost signal (172.35 Hz)
- [ ] K4 tetrahedron detection functional

### Gate 3: BONDING LIVE at bonding.p31ca.org
- [ ] `npm run build && wrangler pages deploy dist --project-name=bonding`
- [ ] K4 tetrahedron detection live
- [ ] Relay worker responding

### Gate 4: Ko-fi PNG uploaded
- [ ] Convert SVG to PNG (`docs/KOFI_UPLOAD_READY.md`)
- [ ] Upload to Ko-fi profile — do any time before Apr 1

### Gate 5: SuperStonk post — Mar 28
- [ ] Content: `docs/social/superstonk_post.md` — manual paste

### Gate 6: Pin Discord announcement — Apr 1
- [ ] Content: `docs/social/discord-quantum-egg-hunt-apr1.md` — post + pin in announcements

---

## Part 5: Environment Variables

### BONDING frontend (`software/bonding/.env`)
```bash
VITE_RELAY_URL=https://bonding-relay.trimtab-signal.workers.dev
VITE_ANALYTICS_ID=           # optional
```

### Spaceship Earth frontend (`software/spaceship-earth/.env`)
```bash
VITE_API_URL=https://api.p31ca.org
VITE_WEBSOCKET_URL=wss://api.p31ca.org/ws
VITE_BLE_ENABLED=true
VITE_WEBGPU_ENABLED=true
VITE_RELAY_URL=https://bonding-relay.trimtab-signal.workers.dev
```

### Discord Bot (`software/discord/p31-bot/.env`)
```bash
DISCORD_TOKEN=               # REQUIRED
DISCORD_CLIENT_ID=           # REQUIRED
DISCORD_GUILD_ID=            # REQUIRED
BOT_PREFIX=p31
BONDING_API_URL=https://bonding.p31ca.org/api
SPOON_API_URL=https://phosphorus31.org/api/spoons
ENABLE_FAWN_DETECTION=true
MAX_SPOON_DISPLAY=12
NODE_ONE_WEBHOOK_PORT=3000
BONDING_CHANNEL_ID=
ANNOUNCEMENTS_CHANNEL_ID=
OPERATOR_DISCORD_USER_ID=
```

### Donate API (CF Worker secrets)
```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# STRIPE_PUBLISHABLE_KEY is public — set in wrangler.toml vars
```

### Env Generator Tool
Standalone HTML tool for generating `.env` files across all P31 services:
```
software/tools/env-generator/index.html
```
Open directly in browser. Presets: BONDING, Spaceship Earth, Donate API, Node.js, Python, Go, Java, Ruby. Output modes: `.env`, GitHub CLI secrets, Docker env.

---

## Part 6: Troubleshooting

| Symptom | Check | Fix |
|---------|-------|-----|
| Bot not responding | `docker logs p31-discord-bot` | Verify `DISCORD_TOKEN` in `.env` |
| Bot commands not registered | Check `DISCORD_GUILD_ID` | Re-run `npm run build && docker-compose up -d` |
| BONDING relay 404 | Relay KV namespace binding | `wrangler deploy` in `bonding/` |
| CF Pages deploy fails | `CLOUDFLARE_API_TOKEN` scope | Token needs Pages:Edit permission |
| wrangler: not logged in | `npx wrangler whoami` | `npx wrangler login` |
| Webhook port 3000 conflict | `lsof -i :3000` | Change `NODE_ONE_WEBHOOK_PORT` |
| Spaceship `/#collider` 404 | Hash router config | Check `vite.config.ts` base path |
| Ghost signal missing | Build not deployed | Verify `wrangler pages deploy` completed |
| Neo4j not connecting | `docker ps` | `docker-compose up -d neo4j` in `software/` |
| Redis PONG failure | `redis-cli ping` | `redis-server` not running — start it first |

---

## Part 7: OPSEC & Security Hardening

Archive privacy lockdown (GitHub repo visibility):
- Move all private working documents to private repositories before any public announcement
- Run `github_opsec_audit.py` and review `opsec_audit_results.json`
- Branch protection: require PRs on `main`, require status checks, dismiss stale reviews

Cloudflare security headers (apply in CF Pages settings or `_headers` file):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

Post-deploy verification:
```bash
# Check all CF Workers deployed
npx wrangler list

# Verify Pages projects
npx wrangler pages project list

# Test relay endpoints
curl https://bonding-relay.trimtab-signal.workers.dev/ping
```

---

## Part 8: Archive Script (Legacy File Cleanup)

Run once after this Runbook is in use to archive the superseded fragments:

```bash
cd "C:/Users/sandra/Documents/P31_Andromeda"

# Create archive directories
mkdir -p admin/_ARCHIVE/backend

# Archive root-level legacy files
git mv STAR_DELTA_BOOT_SEQUENCE.md ONE_CLICK_LAUNCH_SYSTEM.md \
       PRODUCTION_DEPLOYMENT_RUNBOOK.md PRODUCTION_DEPLOYMENT_PLAN.md \
       LAUNCH_READINESS_ASSESSMENT.md PRODUCTION_RELEASE_CHECKLIST.md \
       DEPLOYMENT_STATUS.md DEPLOYMENT_SCRIPT.md DEPLOYMENT_PACKAGE.md \
       FINAL_DEPLOYMENT_COMPLETION_REPORT.md FINAL_DEPLOYMENT_REPORT.md \
       CRYPTOGRAPHIC_FINALITY_SUMMARY.md \
       admin/_ARCHIVE/

# Archive admin fragments
git mv admin/P31_ARCHITECTURE_ANALYSIS.md \
       admin/02_SOULSAFE_PROTOCOL.md \
       admin/02_SPOON_ECONOMICS.md \
       admin/P31_FINAL_IGNITION_CONVERGENCE_AUDIT_ALPHA.md \
       admin/P31_FINAL_IGNITION_CONVERGENCE_AUDIT_BETA.md \
       admin/P31_CONVERGENCE_AUDIT_ALPHA.md \
       admin/P31_CONVERGENCE_AUDIT_BETA.md \
       admin/P31_FINAL_SYSTEM_ARCHITECT_AUTHORIZATION_STAMP.md \
       admin/_ARCHIVE/

# Archive backend implementation docs
git mv software/backend/PRODUCTION_DEPLOYMENT_PLAN.md \
       software/backend/COMPLETE_IMPLEMENTATION_SUMMARY.md \
       software/backend/OPSEC_PHASE1_COMPLETION.md \
       admin/_ARCHIVE/backend/

git add admin/_ARCHIVE/
git commit -m "docs: archive legacy deployment fragments — superseded by P31_ARCHITECTURE.md + P31_DEPLOYMENT_RUNBOOK.md + P31_COMPLIANCE_AND_REPORTS.md"
```
