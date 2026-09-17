# P31 Operations Runbook

Canonical source of truth for all scheduled jobs, scripts, escalation paths, and recovery procedures.

## Schedule

| Cron | Script | Purpose | Log |
|------|--------|---------|-----|
| `0 */6 * * *` | `scripts/p31-monitor.sh --quiet` | Surface health + grant deadlines | `cli/logs/monitor.jsonl` |
| `0 */6 * * *` | `scripts/p31-yardmaster.sh inspect` | Service voltage + error rate | `~/.p31/yardmaster.jsonl` |
| `0 2 * * 5` | `scripts/p31-yardmaster.sh cycle` | Weekly maintenance window | `~/.p31/yardmaster.jsonl` |
| `0 9 * * *` | `scripts/daily-pipeline.sh` | Grant + outreach automation | `logs/daily-pipeline.log` |
| `0 * * * *` | `scripts/efficiency-watcher.sh` | Hourly efficiency check | (stdout) |
| `0 */6 * * *` | `scripts/jitterbug-cron.sh` | Repo grading + git auto-commit | `/tmp/jitterbug-cron.log` |
| `0 0 * * 0` | `node scripts/d1-storage-monitor.mjs --json` | D1 storage weekly report | `logs/d1-storage.jsonl` |
| `0 0 1 * *` | `scripts/secrets-rotate.sh` | Monthly secret rotation | `logs/secrets-rotation.log` |
| `0 0 * * *` | `scripts/log-rotator.sh` | Daily log compression | (archives) |
| `0 0 * * *` | `node scripts/fleet-integrity-check.mjs` | Fleet drift detection | `logs/fleet-integrity.jsonl` |
| `30 22 * * *` | `loginctl lock-session` | Sleep enforcement | systemd |

## Alerting Tiers

| Severity | Trigger | Channel | Response |
|----------|---------|---------|----------|
| Critical | `p31-monitor.sh` fail > 0 | Discord webhook + ntfy | Immediate |
| High | Grant deadline <= 7 days | Discord + email (willyj1587@gmail.com) | Same day |
| Medium | `p31-audit-scan.sh` new finding | GitHub Issues (auto-created) | Weekly review |
| Low | Renovate dependency PR | GitHub PR | Monthly window |

## Key Scripts

| Script | Purpose | Manual Run |
|--------|---------|------------|
| `scripts/p31-monitor.sh` | 17-surface health + deadlines | `bash scripts/p31-monitor.sh` |
| `scripts/p31-yardmaster.sh` | 11-service inspection + cycle | `bash scripts/p31-yardmaster.sh inspect` |
| `scripts/health-check.sh` | Worker /health probes | `bash scripts/health-check.sh --json` |
| `scripts/d1-storage-monitor.mjs` | D1 database size tracking | `node scripts/d1-storage-monitor.mjs --json` |
| `scripts/secrets-rotate.sh` | Cloudflare + local secret rotation | `bash scripts/secrets-rotate.sh` |
| `scripts/quality-gate.sh` | Pre-deploy checks | `bash scripts/quality-gate.sh` |
| `scripts/oqe-hard-gate.sh` | Pre-commit OQE gate | Runs via git hook |
| `scripts/P31-CANARY.sh` | Post-Red-Board re-entry gate | `bash scripts/P31-CANARY.sh --status` |
| `scripts/deploy-workers.sh` | K4 worker deploy + verify | `bash scripts/deploy-workers.sh` |

## Recovery Procedures

### Surface Down
1. `bash scripts/p31-monitor.sh` — confirm which surface failed
2. `bash scripts/health-check.sh --json` — isolate worker vs upstream
3. Check Cloudflare Dashboard (Workers > Logs) for error patterns
4. If worker: `cd workers/<name> && npx wrangler deploy` (or rollback via command-center)
5. If upstream: escalate to provider status page

### Red Board Active
1. All Track B commits BLOCKED
2. Complete dead-stick test: `bash scripts/P31-CANARY.sh`
3. Touch canary done file: `touch ~/.p31/cognitive-passport/canary.done`
4. Re-run `bash scripts/oqe-hard-gate.sh` before any commit

### D1 Storage Warning
1. `node scripts/d1-storage-monitor.mjs --json` — identify large databases
2. Review `logs/d1-storage.jsonl` for growth trend
3. Prune old rows or upgrade plan if > 80% of free tier

### Secret Compromise
1. `bash scripts/secrets-rotate.sh` — rotate all secrets
2. Update `.p31/.env` and `wrangler.toml` secrets via `wrangler secret put`
3. Notify willyj1587@gmail.com

## Escalation

| Issue | Contact | Channel |
|-------|---------|---------|
| Cloudflare platform | Cloudflare Support | https://dash.cloudflare.com/support |
| Grant deadlines | Self | willyj1587@gmail.com |
| Custody / legal | Self | willyj1587@gmail.com |
| Infrastructure after hours | Self | Discord webhook (see secrets) |

## Secrets Location

- `.p31/.env` — local secrets (0600 perms)
- `wrangler.toml` per worker — non-sensitive config only
- Cloudflare secrets — via `wrangler secret put` (never in git)
- Rotated monthly by `scripts/secrets-rotate.sh`
