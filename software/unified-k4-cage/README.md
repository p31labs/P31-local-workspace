# Unified k4-cage (CWP-30)

Canonical source for the merged Worker lives in this folder. The deployable Worker under `../k4-cage/` is kept in sync (same `src/index.js` + matching `wrangler.toml`).

## What it does

- **K4Topology** Durable Object: family K₄ graph (`will`, `sj`, `wj`, `christyn`), same REST shape as the legacy KV worker (`/api/mesh`, `/api/vertex/:id`, `/api/presence/:id`, `/api/ping/:from/:to`, `/api/edge/:a/:b`).
- **FamilyMeshRoom** Durable Object: WebSocket hibernation (`/ws/:roomId?node=…`), optional batched inserts into D1 when `DB` is bound.
- **Worker**: forwards REST to topology DO; WebSocket upgrades to room DO; optional **internal** `POST …/broadcast` on the room stub (Bearer `INTERNAL_FANOUT_TOKEN`) so HTTP pings can notify WS clients.
- **Telemetry**: If `DB` (D1) is configured, `GET/POST /api/telemetry` uses the `telemetry` table with `hash` / `prev_hash`. If not, falls back to the existing **KV** chain (`telemetry:*`) like the pre-unified worker.

## Deploy (Andromeda)

1. Create D1 (if needed): `npx wrangler d1 create p31-telemetry`
2. Set `database_id` in `wrangler.toml` (this folder and/or `k4-cage/wrangler.toml`).
3. Apply schema:  
   `npx wrangler d1 execute p31-telemetry --remote --file=software/unified-k4-cage/schema.sql`
4. Secrets:  
   `npx wrangler secret put ADMIN_TOKEN`  
   Optional: `npx wrangler secret put INTERNAL_FANOUT_TOKEN` (required for WS broadcast on HTTP ping).
5. From `software/k4-cage`: `npx wrangler deploy`

## SUPER-CENTAUR bridge

Copy `software/integration-handoff/CWP-30/mesh-bridge.ts` into **phosphorus31.org** at `SUPER-CENTAUR/src/mesh-bridge.ts` and call `meshProxy(app)` before other routes in production (see comments in that file).

**Controlled work package (full plan):** `andromeda/software/integration-handoff/CONTROLLED-WORK-PACKAGE-SUPER-CENTAUR.md` — **`CWP-P31-SC-2026-01`**.
