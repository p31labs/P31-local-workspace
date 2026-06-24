# p31-cortex

<!-- pmm-badge -->
![PMM Maturity](../../.p31/badges/p31-cortex.svg)
<!-- /pmm-badge -->

Cortical orchestration layer — Hono-based Cloudflare Worker with Durable Objects.

## Commands
| Script | What it does |
|--------|-------------|
| `npm run test` | Run tests |
| `npm run deploy` | Deploy to production |
| `npm run dev` | Local dev |

## Routes
- `GET /health` — liveness
- Durable Object agents under `/do/*`
