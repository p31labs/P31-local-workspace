# k4-hubs

<!-- pmm-badge -->
![PMM Maturity](../../.p31/badges/k4-hubs.svg)
<!-- /pmm-badge -->

Cloudflare Worker: life-context K₄ hub router + HubFusion Durable Objects (4-vertex roster, symmetric fusion reads).

## Commands
| Script | What it does |
|--------|-------------|
| `npm run test` | Run tests with coverage |
| `npm run deploy` | Deploy to production |

## Routes
- `GET /health` — liveness check (includes version and DO binding status)
- `POST /route` — route messages to mesh or personal agents
- `GET /mesh-state/:scope` — room stats from k4-cage
- `GET /hub/:id/*` — HubFusion DO proxy (`/health`, `/roster`, `/fusion`)
