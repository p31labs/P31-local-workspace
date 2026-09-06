# p31-telemetry-worker

<!-- pmm-badge -->
![PMM Maturity](../../.p31/badges/telemetry-worker.svg)
<!-- /pmm-badge -->

Telemetry ingestion worker — collects performance and event data.

## Routes
- `POST /api/telemetry/perf` — performance data
- `POST /api/telemetry` — event data
- `GET /health` — liveness

## Commands
| Script | What it does |
|--------|-------------|
| `npm run test` | Run tests with coverage |
| `npm run deploy` | Deploy to production |
| `npm run dev` | Local dev |
