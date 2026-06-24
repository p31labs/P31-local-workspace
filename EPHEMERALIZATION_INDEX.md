# P31 Ephemeralization Index
**Date:** June 23, 2026  
**Operator:** Will Johnson  
**Principle:** Every configuration value lives in exactly one place. Every script reads from config, never hardcodes paths.

---

## Files Added in This Session

| File | Purpose |
|------|---------|
| `.p31/config.yaml` | **Single source of truth** — all paths, URLs, bindings, secrets |
| `scripts/p31-money-streams.sh` | **Unified money stream launcher** — replaces 5 separate cron entries |
| `scripts/p31-substack-status.sh` | **Substack pipeline health check** — diagnose why content isn't flowing |
| `scripts/revenue-report.sh` | **Revenue mesh report** — Ko-fi + Gumroad + OSC unified view |
| `software/cloudflare-worker/p31-gumroad-webhook/src/index.ts` | **Gumroad webhook Worker** — sale events → D1 + Queue + Discord |
| `software/cloudflare-worker/p31-gumroad-webhook/src/schema.sql` | **Revenue D1 schema** — sales, daily_revenue, milestones tables |
| `software/cloudflare-worker/p31-gumroad-webhook/wrangler.toml` | **Gumroad Worker config** — D1 + Queue bindings |
| `software/cloudflare-worker/p31-gumroad-webhook/deploy.sh` | **One-command deploy** — creates D1, Queue, deploys Worker |
| `software/cloudflare-worker/p31-gumroad-webhook/package.json` | **Package manifest** |
| `scripts/p31-yardmaster.sh` (patched) | Added `substack`, `revenue`, `money-streams --dry-run/--daemon` commands |

---

## Config Propagation Rules

### Bash scripts
```bash
REPO_ROOT="${P31_REPO_ROOT:-/home/p31/P31-local-workspace}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Source config if parser available
if command -v python3 >/dev/null 2>&1; then
  CONFIG=$(python3 -c "import yaml; c=yaml.safe_load(open('${REPO_ROOT}/.p31/config.yaml')); print(c['paths']['repo_root'])")
  REPO_ROOT="${CONFIG}"
fi
```

### Node.js scripts
```javascript
// Future: generate .p31/config.cjs from config.yaml via build step
// For now: read yaml directly
import yaml from 'js-yaml';
import fs from 'fs';
const cfg = yaml.load(fs.readFileSync('.p31/config.yaml', 'utf8'));
const repoRoot = process.env.P31_REPO_ROOT || cfg.repo_root;
```

### Python scripts
```python
# Future: import from .p31/config.py (auto-generated)
# For now:
import yaml, os
cfg = yaml.safe_load(open(os.path.expanduser('~/.config/p31/config.yaml')))
repo_root = os.environ.get('P31_REPO_ROOT', cfg['repo_root'])
```

---

## Hardcoded Paths to Eradicate

| Script | Old Hardcoded Path | Replacement |
|--------|--------------------|-------------|
| `auto-converge.js` | `$HOME/andromeda/software/packages/quantum-core` | `config.paths.quantum_core` |
| `auto-publish.js` | `$HOME/pbmb-automation/zenodo_deposit.py` | `config.paths.zenodo_deposit` |
| `phos-run.sh` | `$HOME/andromeda/software/packages/quantum-core` | `config.paths.quantum_core` |
| `jitterbug-cron.sh` | `/home/p31/andromeda` | `${P31_REPO_ROOT}` |
| `p31-forge/worker/index.js` | (none — uses env vars) | ✅ Already config-driven |
| `p31-kofi-webhook` | (none — uses env vars) | ✅ Already config-driven |

**Action:** Replace each hardcoded path with `.p31/config.yaml` lookup. Priority: auto-converge.js and auto-publish.js (they break on any machine that isn't Will's exact home directory).

---

## Money Stream Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    P31 REVENUE MESH                              │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │   Ko-fi  │    │ Gumroad  │    │    OSC   │    │  Every   │  │
│  │ $0 fees  │    │ 10% fee  │    │ 10% fee  │    │ .org     │  │
│  │ donations│    │ products │    │ donations│    │ DAFs     │  │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CLOUDFLARE WORKERS (webhook layer)           │  │
│  │                                                           │  │
│  │  p31-kofi-webhook    → KV node count + Discord           │  │
│  │  p31-gumroad-webhook → D1 + Queue + Discord             │  │
│  │  p31-forge/webhook   → Activity log + Discord           │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              D1 DATABASE: p31-revenue-db                  │  │
│  │  sales (source, product, amount, timestamp)              │  │
│  │  daily_revenue (date, gross, refunds, net)               │  │
│  │  milestones (source, milestone_type, value)              │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              QUEUE: p31-revenue                           │  │
│  │  Batch processing, analytics, reporting                  │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│                          ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              DISCORD (real-time notifications)            │  │
│  │  #payments: every sale (Ko-fi + Gumroad)                 │  │
│  │  #revenue: daily summary                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              YARDMASTER (daily cycle)                     │  │
│  │  inspect revenue  → D1 queries + log freshness           │  │
│  │  money-streams    → run bounty-hunter, package-assets,   │  │
│  │                      audit-crawler, publish-action,      │  │
│  │                      post-sponsorships                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Gumroad Deployment Sequence

```bash
cd software/cloudflare-worker/p31-gumroad-webhook

# 1. Create D1 database
npx wrangler d1 create p31-revenue-db

# 2. Apply schema
npx wrangler d1 execute p31-revenue-db --remote --file=src/schema.sql

# 3. Create Queue
npx wrangler queues create p31-revenue

# 4. Paste IDs into wrangler.toml
#    database_id → D1 ID from step 1
#    queue_id    → Queue ID from step 3

# 5. Deploy
npx wrangler deploy

# 6. Set secrets
wrangler secret put GUMROAD_WEBHOOK_SECRET
wrangler secret put DISCORD_WEBHOOK_URL
wrangler secret put GUMROAD_TOKEN
```

Then configure Gumroad webhook URL:
```
https://p31-gumroad-webhook.trimtab-signal.workers.dev
```

---

## Substack Pipeline Status

| Component | Status | File |
|-----------|--------|------|
| RSS scanner (Forge) | ✅ Code ready, ⏸ cron disabled | `software/p31-forge/channels/substack.js` |
| Discord bot poller | ✅ Code ready, ? Railway status | `software/discord/p31-bot/src/services/substackPoller.ts` |
| Social drop auto | ✅ Code ready, ⏸ needs SUBSTACK_API_KEY | `software/cloudflare-worker/social-drop-automation/worker.js` |
| Content generation | ✅ Prompt + Cortex DO ready | `prompts/GEMINI_SUBSTACK_GENERATION.md` |
| RSS parser | ✅ Standalone script | `p31labs/social-content-engine/src/rss-substack.js` |
| Status checker | ✅ Just built | `scripts/p31-substack-status.sh` |

**Blocker:** p31-forge crons disabled (free tier budget). Fix: deploy Queue bridge or upgrade Workers plan.

---

## Quick Deploy Reference

```bash
# Yardmaster full cycle (services + lenses + money + substack + revenue)
./scripts/p31-yardmaster.sh cycle

# Individual checks
./scripts/p31-yardmaster.sh inspect substack
./scripts/p31-yardmaster.sh inspect revenue
./scripts/p31-yardmaster.sh money-streams --dry-run

# Deploy Gumroad infrastructure
cd software/cloudflare-worker/p31-gumroad-webhook && ./deploy.sh --all

# Source config in new scripts
source ~/.bashrc  # P31_REPO_ROOT exported
```

---

*Every path in one file. Every worker in its own directory. Every report in one command.*
