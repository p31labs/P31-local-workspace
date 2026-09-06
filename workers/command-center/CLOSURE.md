# Command Center — closure notes (2026-04-26)

## What was fixed in-tree

1. **Missing Worker modules** — `god-dashboard.js`, `sse-stream.js`, and `crdt-session-do.js` are now present so `wrangler deploy` bundles. `god-dashboard.js` aliases `buildEpcpDashboardHtml` as `buildGodDashboardHtml`.
2. **CRDT Durable Object** — `[[durable_objects.bindings]]` + `[[migrations]]` for `CrdtSessionDO` / `CRDT_SESSION_DO` so `/api/crdt/session` can bind. The unused `CrdtQueueProcessor` import/export was removed (no binding in code).
3. **Access logging** — Per-request `console.log` runs only when `ENVIRONMENT === 'development'` or `DEBUG_ACCESS_LOG` is `1` / `true`.
4. **Fleet `rps`** — Comment clarifies values are illustrative for the UI, not production metrics.
5. **`DEFAULT_STATUS`** — JSDoc notes KV/`status.json` as preferred sources; embedded object remains the empty-KV fallback.

## Route → binding (quick map)

| Area | Binding / env | Notes |
|------|----------------|-------|
| Status read/write | `STATUS_KV`, optional `EPCP_DB` | GET/POST `/api/status` |
| Forensics / artifacts | `FORENSICS_*`, `ARTIFACTS`, `AUDIT_EXPORTS` | R2 |
| CF summary cache | `STATUS_KV` key `p31_cf_hub_cache_v3` | `/api/cf/summary` + Bearer `STATUS_TOKEN` for refresh |
| CRDT WebSocket | `CRDT_SESSION_DO` | `/api/crdt/session` |
| Cron fleet ping | — | `pingFleet` → updates KV `status` |
| **Not in this repo** | `p31-orchestrator` Worker | Orchestrated from p31ca `/orchestrator` via `mesh.orchestratorWorkerUrl` — auth per `p31ca/docs/EDGE-SECURITY.md` |
| **Operator shift** | `STATUS_KV` keys `p31:operator:shift:public`, `p31:operator:shift:log` | `GET/POST /api/operator/shift` — **GET** CORS for p31ca (public state); **POST** `withAccess` operator; `OPTIONS` preflight |

## Deploy

After pulling: `npx wrangler deploy` from this directory. If Cloudflare reports a migration conflict, run `npx wrangler migrations list` against this Worker name and align with account history (first-time DO: `crdt-session-v1`).

## Optional env

- `DEBUG_ACCESS_LOG=1` — verbose request logging (avoid in production unless debugging).

## Deferred (out of scope for this pass)

- **p31-orchestrator** implementation / Access / rate limits / audit: must live on that Worker; see `OrchestratorDashboard.astro` for API paths and `EDGE-SECURITY.md`.
- Centralizing legal/financial text out of `DEFAULT_STATUS` into D1 or a single config file (larger data migration).
