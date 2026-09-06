# Game Builder — Integration Checklist

Orchestrator: **`game-builder`** → `roblox-bridge` (worlds) + `shadow-bridge` (LOVE).

## Status

| Step | Worker | Files | Status |
|------|--------|-------|--------|
| Worlds D1 schema | roblox-bridge | `migrations/001_worlds.sql`, `src/index.ts` (`ensureWorldsTable`) | Done |
| Router | game-builder | `src/index.ts`, `test/route.test.ts` (8/8 green) | Done |
| LOVE mint status | shadow-bridge | `src/index.ts`, `src/game-session-do.ts` (`/game/mint-status`) | Done |
| LOVE mint entrypoint | shadow-bridge | `src/index.ts` (`/game/mint-love`, `/game/queue-love`) | Done |
| roblox-bridge LOVE passthrough | roblox-bridge | `src/index.ts` (`/game/mint-love`, `/game/pending-love`, `/game/queue-love`) + `SHADOW_BRIDGE_URL` binding | Done |
| Typecheck | — | all three workers `tsc --noEmit` | Done |
| Dry-run deploy | — | `wrangler deploy --dry-run` all three | Done |
| Live verify | — | worlds CRUD + love.mint/balance/mint_status via game-builder all 200 | Done |

## Deploy / apply (operator)

```bash
# 1. Apply worlds migration to the shared love-ledger D1 (idempotent; also guarded at runtime)
cd workers/roblox-bridge && npx wrangler d1 migrations apply LOVE_DB --remote

# 2. Secrets (only where overrides are wanted; defaults used otherwise)
cd workers/game-builder
npx wrangler secret put ROBLOX_BRIDGE_URL    # https://roblox-bridge.trimtab-signal.workers.dev
npx wrangler secret put SHADOW_BRIDGE_URL    # https://shadow-bridge.trimtab-signal.workers.dev

# 3. Deploy order: shadow-bridge, roblox-bridge, game-builder
cd workers/shadow-bridge && npx wrangler deploy
cd workers/roblox-bridge  && npx wrangler deploy
cd workers/game-builder   && npx wrangler deploy
```

> Note: `shadow-bridge` uses DO embedded SQLite (KV storage) — no D1 migration.
> The new `GameSessionDO` methods require no migration tag bump (no class/schema change).

### Required compatibility flag (prod bug 2026-08-10)

All three workers do **same-zone worker→worker `fetch()`** calls (game-builder →
roblox-bridge/shadow-bridge, roblox-bridge → shadow-bridge, shadow-bridge →
device-registry/genesis-gate/love-bridge). Without the
`global_fetch_strictly_public` compatibility flag these return
`404 error code: 1042` ("Worker tried to fetch from another Worker on the same
zone"). Each worker's `wrangler.toml` must include it:

```toml
compatibility_flags = ["global_fetch_strictly_public"]   # + "nodejs_compat" where used
```

This flag routes same-zone fetches through the public edge (as if from the
Internet), bypassing the workers.dev same-account restriction.

## Verify after deploy

```bash
curl https://game-builder.trimtab-signal.workers.dev/health
curl -X POST https://game-builder.trimtab-signal.workers.dev/route \
  -H 'Content-Type: application/json' -d '{"route":"worlds.create","payload":{"name":"MyWorld"}}'
curl -X POST https://game-builder.trimtab-signal.workers.dev/route \
  -H 'Content-Type: application/json' -d '{"route":"love.mint","payload":{"userId":"u1","amount":10}}'
curl -X POST https://game-builder.trimtab-signal.workers.dev/route \
  -H 'Content-Type: application/json' -d '{"route":"love.mint_status","payload":{"userId":"u1"}}'
```

## D1 cap note

The account is at the **10-of-10 D1 Free-Plan cap** (AGENTS.md). No new database
was created for this work — `game-builder` (`GAME_DB`) and `roblox-bridge`
(`LOVE_DB`) both share the existing `love-ledger` D1 (`592e3e2e-…`). If a
dedicated database is ever desired, `hrv-coherence-db` is the only freeable slot,
and all three workers would need new `database_id`s.

## World persistence design

- Declarative schema: `workers/roblox-bridge/migrations/001_worlds.sql`
  (`CREATE TABLE IF NOT EXISTS worlds …`, plus `idx_worlds_created`).
- Runtime guard: `ensureWorldsTable()` runs at the top of every `/worlds` handler
  (same self-healing pattern as `federation-bridge`'s `ensureCredentialsTable`),
  so reads never 500 if the table is missing.

## Frontend integration (P31 Sovereign Shell)

A **Game** surface lives in the production shell (`/home/p31/production/shell`):

- Tab wiring: `src/lib/navItems.ts`, `src/components/BottomNav.tsx`,
  `src/store/useAppStore.ts` (`Tab` union), `src/App.tsx` (`case 'game'`).
- API client: `src/lib/gameBuilder.ts` — types the `POST /route` envelope
  (`{ ok, route, target, status, result }`) and exposes typed helpers for all
  8 tools (`worlds.*`, `love.*`, `tools.list`).
- Surface: `src/features/game/GameSurface.tsx` — worlds list, create-world form,
  LOVE mint, session status (queued/pending/totals), action queueing, and a
  "Sync Roblox LOVE" button that drains shadow-bridge `/game/pending-love` into
  the local `loveEngine` ledger (via `syncRobloxLove()` in `src/lib/robloxBridge.ts`).
- CORS: `game-builder` allows `origin: '*'`, so the browser fetches it directly
  (no shell-worker proxy, no same-zone fetch — avoids error 1042 entirely).

### Verify hook

When `window.__P31_VERIFY__` is set, `GameSurface` exposes `window.__p31_game`
with `{ render, worlds, did, minted, pending, session }` for the shell verify suite.

### Browser curl

```bash
curl -X POST https://game-builder.trimtab-signal.workers.dev/route \
  -H 'Content-Type: application/json' -d '{"route":"worlds.list"}'
```
