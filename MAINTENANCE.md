# P31 Maintenance Guide

How to keep the P31 monorepo clean, fresh, and running like a well-oiled machine.

## Daily (5 minutes)
- Check `cli/logs/monitor.jsonl` for any `fail > 0` entries
- Review Discord/webhook alerts if enabled
- Verify grant deadlines in `due_soon` field

## Weekly (~30 minutes)
- `bash scripts/p31-yardmaster.sh inspect` — service health sweep
- `node scripts/fleet-integrity-check.mjs` — declared vs live fleet drift
- Review Renovate PRs; merge patch/minor updates, hold major for review

## Monthly (~2 hours)
- `bash scripts/p31-core-audit.py` — core systems audit
- `bash scripts/p31-audit-scan.sh` — security/control plane scan
- `node scripts/d1-storage-monitor.mjs --json` — storage growth check
- `bash scripts/secrets-rotate.sh` — secret rotation
- `pnpm audit` — dependency vulnerability review
- Update `P31_SHELF_MANIFEST.yaml` with current versions

## Quarterly (~4 hours)
- `pnpm update` review window (with Renovate PRs merged)
- Full `pnpm test:full` run
- `pnpm run quality` (ground-truth + monetary surface + audit)
- Review and update `docs/ops/OPERATIONS-RUNBOOK.md`

## After Every Deploy
- Verify `/health` returns 200 on deployed worker
- Update `P31_SHELF_MANIFEST.yaml` with new version + health score
- Commit shelf manifest update to main

## After Every Red Board Event
1. Do NOT commit until `bash scripts/P31-CANARY.sh` passes
2. Complete canary task (fold 3 physical items)
3. `touch ~/.p31/cognitive-passport/canary.done`
4. Re-run `bash scripts/oqe-hard-gate.sh` before first post-canary commit

## Emergency Contacts
- Operator email: willyj1587@gmail.com
- Cloudflare Dashboard: https://dash.cloudflare.com
- Runbook: `docs/ops/OPERATIONS-RUNBOOK.md`
