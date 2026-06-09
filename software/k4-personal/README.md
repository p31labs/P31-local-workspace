# k4-personal

Cloudflare Worker: **personal K₄** mesh (`GET /api/mesh`, presence, ping, `/viz`) plus **`PersonalAgent`** Durable Object routes under `/agent/:userId/*`.

## Prereqs

- Node 20+ (see repo root `.nvmrc`)
- Wrangler auth: `npx wrangler login` (once per machine)

## Commands (this package)

| Script    | What it does              |
|-----------|---------------------------|
| `npm run verify`  | `wrangler deploy --dry-run` — bundle check, no deploy |
| `npm run deploy`  | Production deploy         |
| `npm run dev`     | Local dev                 |

From **Andromeda** `software` root (pnpm workspace):

```bash
pnpm install
pnpm --filter k4-personal verify
pnpm --filter k4-personal deploy
```

## Home repo CI

- **`npm run verify:mesh`** (repo root) — wrangler dry-run for this package + **live** `GET /api/health` and `GET /api/mesh` vs `p31-constants.json` (`MESH_LIVE_STRICT=1` by default).
- **`npm run release:check` / `p31:ci`** — includes `verify-k4-personal.mjs` then `verify-mesh-live.mjs` (strict only in **CI** or when `MESH_LIVE_STRICT=1`).

## Personal tetra shell (same Worker)

- **`GET /u/:userId/home`** — HTML “personal tetra” home (`tetra-home-html.js`): in-page **four docks** + quick **chat**; SOULSAFE checkbox syncs **`soulsafe_prefs`** via `GET`/`PUT /state` on load and on change (same manifest field as mesh-start). Docks follow **`GET /agent/:userId/tetra`** after `PUT` with `p31.personalTetra/1.0.0`.
- **`GET /agent/:userId/manifest`** — JSON manifest (`p31.personalAgentManifest/0.1.0`): `personalTetra`, profile slice, `energy`, **`spoonEconomy`** (Samson v0 · regen rate + fusion floor), `soulsafeTetra` (fusion defaults), `service` meta.

**SOULSAFE tetra (v0.1):** `POST /agent/:userId/chat` with `{ "message": "…", "soulsafe": true }` runs four parallel specialist lenses + fusion (`p31.soulsafeTetra/0.1.0`). Skipped when spoons &lt; 3 (single-shot path). Optional `[vars] SOULSAFE_CHAT_DEFAULT = "1"` in `wrangler.toml`. **Hub** `p31ca/public/mesh-start.html` syncs `soulsafe_prefs` via `PUT /state` and sends `soulsafe: true` when the opt-in box is on. Production spec: home repo **`docs/SOULSAFE-TETRA-SPEC.md`**.

**Example (prod):** `https://k4-personal.trimtab-signal.workers.dev/u/{userId}/home`

## Data lifecycle (export / retention / delete)

- **Runbook (operator):** `andromeda/software/integration-handoff/CWP-31/operator-data-lifecycle.md` — `GET /agent/:userId/history` export, **`MESSAGES_MAX_ROWS`** soft cap (trim oldest messages after each `/chat`), manifest `retention` slice, no v1 public hard-delete. **CWP** D-PA4 / D-PA5.

**SOULSAFE fusion audit (`soulsafe_runs` table):** capped via **`SOULSAFE_RUNS_MAX_ROWS`** (FIFO delete of oldest rows), optional **`SOULSAFE_RUNS_MAX_AGE_MS`** time floor (delete runs older than age before applying the row cap). Policy module: `src/soulsafe-retention.js`; manifest publishes counts under **`soulsafeTetra.retention`** (`p31.soulsafeRetention/0.1.0`).

## Config

- **`K4_MESH`** KV: `wrangler.toml` — same namespace id as `k4-cage` in this account; keys are isolated by `k4s:personal:*`.
- Personal mesh handlers: `../packages/k4-mesh-core/`.
- **Durable Object migrations:** `wrangler.toml` includes a one-time `deleted_classes` migration for legacy DOs that blocked deploy (`OperatorStateDO`, `ContextEngineDO`, `ShieldEngineDO`, `SignalProcessorDO`) — historical names only; runtime is **`PersonalAgent`**.
- **Mesh routes** (`/api/*`) use **async** handlers end-to-end (must `await` in the Worker `fetch` path).
- **CORS:** `*.workers.dev` and `*.pages.dev` origins are allowed (plus p31ca / bonding / localhost) so the shell and API share one deployment origin.
