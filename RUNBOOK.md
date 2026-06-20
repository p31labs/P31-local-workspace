# P31 Sovereign Mesh — Unified Runbook

**System:** P31 Sovereign Mesh + Shipyard Protocol (yardmaster)
**Monorepo:** `/home/p31/P31-local-workspace`
**Operator:** William R. Johnson

---

## 1. System Overview

The P31 ecosystem has two layers:

### Sovereign Mesh (user-facing)
Four web lenses deployed to Cloudflare Pages, each importing a shared Rust/WASM core (`sovereign-core`) for CRDT state, peer discovery via a Cloudflare Worker signaling server, and offline-first sync.

| Lens | URL | Purpose |
|------|-----|---------|
| `spaceship-earth` | https://d1264dfb.spaceship-earth.pages.dev | 3D globe + dome cockpit |
| `p31ca` | https://856f9476.p31ca.pages.dev | Dome controller + onboarding portal |
| `phos` (web) | https://5bce59d0.phos-btn.pages.dev | Astro-based web lens |
| `willow` | https://615b6425.willow-a23.pages.dev | Child-friendly game hub |

### Shipyard Protocol (operational)
A yardmaster daemon that inspects, refurbishes, deploys, and audits all of the above — plus money streams and the onboarding portal — via cron-driven cycles.

### Money Streams (automated monetization)
Five background scripts that package, publish, and promote P31 IP:

| Stream | Interval | What it does |
|--------|----------|--------------|
| `bounty-hunter` | every 2h | Scans P31 endpoints, writes findings to `logs/bounty-findings.json` |
| `package-assets` | hourly | Packages dists, uploads to Gumroad, publishes to npm |
| `audit-crawler` | hourly | Scrapes HN / social for startup leads |
| `publish-action` | hourly | Updates ADA GitHub Action repo |
| `post-sponsorships` | every 2h | Checks GitHub sponsors, marks leads |

### Onboarding Portal
Two-door (Warm + Sparkle) zero-text portal at `https://856f9476.p31ca.pages.dev/onboard/`. State is stored in `localStorage` (`p31:onboard` key) and synced every 30min to `state/onboard-state.json`.

---

## 2. Yardmaster Commands

All commands are run from the repo root:

```bash
cd /home/p31/P31-local-workspace
./scripts/p31-yardmaster.sh <command> [options]
```

### Inspection

| Command | What it does |
|---------|--------------|
| `yardmaster inspect` | Inspects registered services only (legacy) |
| `yardmaster inspect all` | Inspects all domains: services + lenses + money streams + onboarding |
| `yardmaster inspect lenses` | HTTP health check for all four web lenses |
| `yardmaster inspect money-streams` | Checks log file freshness and script existence |
| `yardmaster inspect onboard` | Checks portal health endpoint and synced state file |
| `yardmaster inspect <service>` | Single service inspection (voltage, error rate, OQE, health) |

### Refurbishment

| Command | What it does |
|---------|--------------|
| `yardmaster refurbish <service>` | Full 7-step refurbishment pipeline |
| `yardmaster refurbish <service> dry-run` | Refurb without side effects |
| `yardmaster refurbish <service> oqe-only` | OQE gate check only |

### Cycle

| Command | What it does |
|---------|--------------|
| `yardmaster cycle` | Full inspection across all domains, triggered by cron on Fridays |

### Shelf Management

| Command | What it does |
|---------|--------------|
| `yardmaster shelf-list` | Show all service shelf entries |
| `yardmaster shelf-add <service> <version>` | Add a new version to the shelf |
| `yardmaster shelf-deploy <service> [version]` | Blue-green deploy from shelf |

### Monitoring

| Command | What it does |
|---------|--------------|
| `yardmaster fuel-check` | Check Track B fuel budget status |
| `yardmaster voltage <service>` | Query voltage for a specific service |
| `yardmaster guardrail-check` | Report guardrail level status |
| `yardmaster money-streams` | Launch/restart money stream tmux session |
| `yardmaster sync-state` | Sync onboarding portal state to `state/onboard-state.json` |

### Schedule

| Command | What it does |
|---------|--------------|
| `yardmaster schedule` | Show proposed cron entries |
| `yardmaster schedule --apply` | Apply cron schedule |

---

## 3. Daily Health Check

```bash
cd /home/p31/P31-local-workspace

# Full domain inspection
./scripts/p31-yardmaster.sh inspect all

# Quick lens check
for url in \
  https://d1264dfb.spaceship-earth.pages.dev \
  https://856f9476.p31ca.pages.dev \
  https://5bce59d0.phos-btn.pages.dev \
  https://615b6425.willow-a23.pages.dev; do
  echo -n "$url -> "
  curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url"
  echo
done

# Money stream logs
tail -3 logs/*.log

# Signaling worker peers
curl -s https://p31-signaling.trimtab-signal.workers.dev/peers | python3 -m json.tool

# Yardmaster event log (last 10)
tail -10 ~/.p31/yardmaster.jsonl | python3 -m json.tool
```

---

## 4. Deployment

### Manual lens deploy
```bash
cd /home/p31/P31-local-workspace/software/willow
pnpm build
npx wrangler pages deploy dist --project-name willow --branch main
```

### Money streams (tmux)
```bash
./scripts/launch-money-streams.sh
# Or via yardmaster:
./scripts/p31-yardmaster.sh money-streams
```

### Onboarding state sync
```bash
./scripts/sync-onboard-state.sh
# Or via yardmaster:
./scripts/p31-yardmaster.sh sync-state
```

---

## 5. Cron Schedule

The `yardmaster schedule --apply` command installs these entries:

| Entry | Interval | Command |
|-------|----------|---------|
| Domain inspection | Every 6h | `yardmaster inspect all` |
| Full maintenance cycle | Fridays 02:00 UTC | `yardmaster cycle` |
| State sync | Every 30min | `sync-onboard-state.sh` |
| Money stream health | Every 2h | `yardmaster money-streams` |

All logs go to `~/.p31/yardmaster-cron.log`.

---

## 6. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Lens returns HTTP 000 | Lens not deployed or Pages build failed | Check Cloudflare dashboard, run `pnpm build && wrangler pages deploy` |
| Money stream log stale | Stream process died | `tmux kill-session -t p31-money-streams && ./scripts/launch-money-streams.sh` |
| `state/onboard-state.json` missing | sync-onboard-state.sh hasn't run | `./scripts/sync-onboard-state.sh` |
| Portal health endpoint 404 | `health.html` not deployed or wrong path | Check `software/p31ca/public/onboard/health.html` exists and is deployed |
| CSP blocks Google Fonts in lens | `font-src 'self'` missing `https://fonts.gstatic.com` | Update CSP headers in the lens |
| Yardmaster cron not firing | Crontab not installed or cron daemon not running | `crontab -l`, verify `systemctl status cron` |
| Gumroad upload failed | Direct file upload API deprecated for presign flow | Attach zip manually from `logs/gumroad-*.zip` |
| `npm publish` fails with E403 | Scope doesn't exist or auth token expired | Verify `npm whoami` and `npm access` for the scope |

---

## 7. File Locations

| File | Purpose |
|------|---------|
| `P31_SHELF_MANIFEST.yaml` | Shelf inventory (services + lenses + money streams + onboarding) |
| `P31-FUEL-BUDGET.yaml` | Track A/B/C fuel budget |
| `scripts/p31-yardmaster.sh` | Yardmaster daemon |
| `scripts/launch-money-streams.sh` | Money stream tmux launcher |
| `scripts/sync-onboard-state.sh` | Onboarding state sync |
| `scripts/bounty-hunter.sh` | Money stream: vulnerability scanning |
| `scripts/package-assets.sh` | Money stream: asset packaging |
| `scripts/audit-crawler.sh` | Money stream: lead generation |
| `scripts/publish-action.sh` | Money stream: GitHub Action publish |
| `scripts/post-sponsorships.sh` | Money stream: sponsor outreach |
| `state/onboard-state.json` | Synced onboarding portal state |
| `software/p31ca/public/onboard/health.html` | Portal health endpoint (dumps localStorage) |
| `logs/` | Money stream log output |
| `~/.p31/yardmaster.jsonl` | Yardmaster event telemetry |
| `~/.p31/health.jsonl` | Health check telemetry |
| `docs/P31_SHIPYARD_PROTOCOL.md` | Full Shipyard Protocol documentation |

---

## 8. Integration Points

| Web Layer | Operational Layer | Sync Method |
|-----------|------------------|-------------|
| `localStorage.p31:onboard` | `state/onboard-state.json` | `sync-onboard-state.sh` (cron every 30min) |
| Lens health endpoints | Yardmaster `inspect lenses` | HTTP check (cron every 6h) |
| Money stream scripts | Yardmaster `inspect money-streams` | Log freshness check (cron every 6h) |
| Cloudflare Pages builds | Yardmaster `refurbish` (deploy step) | Manual via `yardmaster shelf-deploy` |
| Signaling worker | Yardmaster inventory | Registered in `P31_SHELF_MANIFEST.yaml` |

---

## 9. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Pure Bash for yardmaster | No Python/PyYAML cold-start dependency |
| Python for money stream scripts | Non-critical, benefit from ecosystem |
| `localStorage` for onboard state | Works offline, no server needed for portal flow |
| One-way state sync (portal → file) | Simple, sufficient for monitoring; bidirectional TBD |
| tmux for stream process management | Lightweight, auto-restart with monitor window |
| Cloudflare Worker for signaling | Reliable, scalable; mDNS abandoned (WASM UDP limits) |
| Shelf manifest YAML as source of truth | Human-readable, version-controllable, awk-parsable |

---

## 10. Security & Hardening

- Control plane files (`P31_FUEL_BUDGET.yaml`, `P31_SHELF_MANIFEST.yaml`) at `chmod 600`
- Yardmaster logs `yardmaster_log()` uses Python `sys.argv` (no string interpolation)
- Money stream scripts run as the `p31` user, no elevated privileges
- `.env.master` contains all secrets, sourced at deploy time (never committed)
- Onboarding portal is read-only (no write endpoints); state is dumped, not modified
