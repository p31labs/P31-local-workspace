# Changelog — Jitterbug Sierpinski Orchestrator

## [0.1.0-alpha.0] — 2026-06-22

### Added

- **Core Package:** `@p31/brain-dump-orchestrator` with 5-layer orchestration
- **Recursive Mode:** `RecursiveBrainDumpOrchestrator`, `classifyAxis`, `axisToBrainDump`
- **K₄ Isostatic Gate:** 4-agent consensus (fast heuristic, full LLM option)
- **Cloudflare Native API:** `jitterbug-api` Worker with D1, R2, KV, DO
- **PWA:** `jitterbug-pwa` React app with capture form and status dashboard
- **Deployment Automation:** Idempotent bash script `deploy-jitterbug.sh`
- **Migrations:** 001 (base), 002 (recursive), 003 (ephemeralization)
- **Testing:** Unit, integration, DO, fault, load (written, pending pool upgrade)

### Fixed

- `fs` dependency in Workers → replaced with R2 tracker
- `itty-router` v5 `.handle()` → `.fetch()` bug
- KV `expirationTtl` minimum 10 → 60 seconds
- Dynamic import of recursive orchestrator → try-catch fallback
- K₄ LLM timeout → 30s `Promise.race`
- D1 `purge_at` epoch math → `datetime('now', '+90 days')`
- PWA custom domain 404 → set production branch via API

### Known Issues

- Test suite blocked by `@cloudflare/vitest-pool-workers` version mismatch
- R2 lifecycle rule not automated (manual dashboard setup)
- Cron triggers removed due to free plan limit

### Next Steps

- Upgrade pool to run full test suite
- Add R2 lifecycle rule (30-day auto-delete)
- Implement real 4-agent LLM consensus
- Add WebSocket push for real-time updates
