# P31 Game Builder Worker

Agent-friendly router for the Roblox game ecosystem. Fan-out gateway in front of
`roblox-bridge` (worlds CRUD) and `shadow-bridge` (LOVE minting / pending LOVE).

## Topology

```
game-builder ── POST /route ──> roblox-bridge  (/worlds, /game/* passthrough)
            └─────────────────> shadow-bridge  (/game/mint-love, /game/queue-love,
                                                /game/pending-love, /game/mint-status)
```

- `roblox-bridge` — worlds persistence on the shared `love-ledger` D1.
- `shadow-bridge` — Roblox → Genesis Gate telemetry + LOVE minting (DO-backed queues).

## Deploy

```bash
cd workers/game-builder
npm install
npx wrangler secret put ROBLOX_BRIDGE_URL   # https://roblox-bridge.trimtab-signal.workers.dev
npx wrangler secret put SHADOW_BRIDGE_URL   # https://shadow-bridge.trimtab-signal.workers.dev
npm run deploy
```

If the secrets are unset, the router falls back to the default
`*.trimtab-signal.workers.dev` URLs.

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + binding/secret status |
| GET | `/tools` | Full route catalog (JSON) |
| POST | `/route` | Dispatch `{ route, payload }` to the right worker |

### `/route` catalog

| route | target | upstream call |
|-------|--------|---------------|
| `worlds.create` | roblox-bridge | `POST /worlds` |
| `worlds.list` | roblox-bridge | `GET /worlds` |
| `worlds.get` | roblox-bridge | `GET /worlds/:id` |
| `love.balance` | shadow-bridge | `POST /game/pending-love` (consuming) |
| `love.mint_status` | shadow-bridge | `GET /game/mint-status` (non-consuming) |
| `love.mint` | shadow-bridge | `POST /game/mint-love` |
| `love.queue` | shadow-bridge | `POST /game/action` |
| `tools.list` | game-builder | catalog echo |

Example:

```bash
curl -X POST https://game-builder.trimtab-signal.workers.dev/route \
  -H 'Content-Type: application/json' \
  -d '{"route":"worlds.list","payload":{}}'
```

## Storage

Reuses the shared `love-ledger` D1 (`592e3e2e-…`) under the `GAME_DB` binding.
No new database — the account is at the Free Plan 10-D1 cap (see AGENTS.md).

## Tests

```bash
npm test   # 8 vitest router tests (mocked upstreams)
```

## Frontend consumption (P31 Sovereign Shell)

The production shell (`/home/p31/production/shell`) renders a **Game** surface
that calls `POST /route` directly from the browser (CORS is `origin: '*'`):

- `src/lib/gameBuilder.ts` — typed client for the `/route` envelope.
- `src/features/game/GameSurface.tsx` — worlds CRUD + LOVE mint/status/queue UI.

The envelope is `{ ok, route, target, status, result }`, where `result` is the
unmodified upstream body. Errors surface as HTTP status + `{ error }`.
