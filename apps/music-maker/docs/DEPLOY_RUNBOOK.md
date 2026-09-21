# Deploy runbook — the spatial music maker

> **STATUS: DEPLOYED + HARDENED — 2026-09-21.** `music-presence` is live at
> `https://music-presence.trimtab-signal.workers.dev` (D1 `music-maker`,
> `database_id 4c26bc1a-…`, account `ee05f70c…`). Phases 0–3.2 below were
> executed in full-auto and PASSED — including the SQLite DO namespace
> provision ("Durable Object exports reconciliation: Created: MusicRoom") and
> the production WebSocket smoke (commit-ack, committed broadcast, ephemeral
> fan-out with self-echo exclusion, and post-hibernation wake). A hardening
> pass added: transport state machine (one-way degradation), Hibernation-safe
> keepalive (edge ping→pong), 64KB frame cap, ephemeral schema validation,
> `reason:infra` on D1 failure, structured JSON logs, Cloudflare Access auth
> (opt-in via `MUSIC_ACCESS_AUD`), and 4 canon ADRs + an incident card —
> re-verified in production (oversize rejection + edge ping→pong green).
> What remains is human-verifiable: Phase 3.3 (browser smoke on a real
> device), auth wire-up (set the Access AUD + `wrangler secret put`), the
> backup drill, and Phase 4 coast. Re-run this runbook from the top for any
> FUTURE deploy.

Enterprise production pre-flight → deploy → post-flight → coast guide for
`apps/music-maker`. Fully interactive: each checkbox names WHO does it
(**Pilot** = a human with Cloudflare credentials; **Co-Pilot** = the agent;
**Observer** = a family member on a real device) and the exact command.

Research-grounded against Cloudflare's docs as of 2026-07/08/09:
- **SQLite storage mandate** — new DO namespaces must use SQLite; `legacy-kv`
  fails on a fresh account. Our `storage = "sqlite"` is correct and mandatory.
- **Hibernation** — `ctx.getWebSockets()` survives hibernation; the constructor
  must stay minimal. Our `super(ctx, env)` is correct.
- **D1 migrations** — `wrangler d1 migrations apply --remote` for production.
- **Rollback** — up to 100 versions retained; `wrangler rollback`.
- **Observability** — Workers Logs on by default; OTLP export to Grafana/Axiom/Sentry.

> The critical gap: `wrangler deploy --dry-run` and `wrangler dev --local` both
> create local namespaces regardless of account state. ONLY a real
> `wrangler deploy` validates the SQLite mandate against the actual account.
> Do not claim "end-to-end verified" until Phase 3.2 passes.

---

## Phase 0 — Account readiness (Pilot)

- [x] **Pilot** — Cloudflare account exists, **Workers Paid** plan (Durable Objects require it).
- [x] **Pilot** — `wrangler whoami` shows the right account:
  ```bash
  cd apps/music-maker/worker
  npx wrangler whoami --json | jq '{loggedIn, accounts: [.accounts[] | {name, id}]}'
  ```
- [x] **Pilot** — API token configured for CI (Workers Scripts:Edit, D1:Edit, Account Settings:Read) if not doing interactive login.

**Gate:** do not proceed until `wrangler whoami` shows a logged-in account with Workers Paid.

---

## Phase 1 — Pre-flight (Co-Pilot, local)

- [x] **Co-Pilot** — `storage` is `"sqlite"`:
  ```bash
  cd apps/music-maker/worker
  grep -A3 '\[exports.MusicRoom\]' wrangler.toml
  # [exports.MusicRoom] / type = "durable-object" / storage = "sqlite"
  ```
- [x] **Co-Pilot** — no legacy `[[migrations]]`:
  ```bash
  grep -c '\[\[migrations\]\]' wrangler.toml   # expected 0
  ```
- [x] **Co-Pilot** — D1 binding present, `database_id` is a real UUID (not the placeholder):
  ```bash
  grep -A5 '\[\[d1_databases\]\]' wrangler.toml
  ```
- [x] **Co-Pilot** — worker typechecks:
  ```bash
  npx wrangler types && npx tsc -p tsconfig.json
  ```
- [x] **Co-Pilot** — `wrangler deploy --dry-run` passes:
  ```bash
  npx wrangler deploy --dry-run --outdir /tmp/mm-deploy-check
  ```
- [x] **Co-Pilot** — music-maker gates:
  ```bash
  cd apps/music-maker && pnpm run typecheck && pnpm test && pnpm run build
  ```
- [x] **Co-Pilot** — loom + canon regression gates:
  ```bash
  cd apps/loom && pnpm run docs-audit && pnpm run port-audit
  cd packages/canon && node --experimental-strip-types scripts/test-loom-determinism.mjs && node --experimental-strip-types scripts/test-loom-gate.mjs
  ```
- [x] **Co-Pilot** — local WS smoke against `wrangler dev --local` passes (commit-ack, committed broadcast, ephemeral fan-out, self-echo exclusion). See `prototypes/` + the two-client script pattern used in prior passes.

**Gate:** local smoke must pass before touching production.

---

## Phase 2 — Deploy (Pilot approves, Co-Pilot executes)

- [x] **Pilot** — create the production D1 database:
  ```bash
  cd apps/music-maker/worker
  npx wrangler d1 create music-maker
  ```
  Copy the printed `database_id` into `wrangler.toml`, replacing `REPLACE_WITH_D1_ID`.
- [x] **Pilot** — confirm the ID is real:
  ```bash
  grep 'database_id' wrangler.toml   # a UUID, not the placeholder
  ```
- [x] **Co-Pilot** — apply the schema to production:
  ```bash
  npx wrangler d1 execute music-maker --remote --file=schema.sql
  ```
- [x] **Co-Pilot** — verify the tables exist remotely:
  ```bash
  npx wrangler d1 execute music-maker --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
  # events, d1_migrations
  ```
- [x] **Pilot** — approve; **Co-Pilot** deploys:
  ```bash
  npx wrangler deploy
  ```
  Capture the deployed URL (`https://music-presence.<subdomain>.workers.dev`).

> If deploy fails with a storage/new_classes error: storage must be `"sqlite"` in
> `[exports.MusicRoom]` with no stale `[[migrations]]` `new_classes`. The
> exports declarative form provisions the namespace on first deploy. Do not
> retry blindly.

---

## Phase 3 — Post-flight (Co-Pilot then Observer)

- [x] **Co-Pilot** — `GET /events` returns 200:
  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://<DEPLOYED_URL>/events
  curl -s https://<DEPLOYED_URL>/events | jq .   # [] on first deploy
  ```
- [x] **Co-Pilot** — a committed write passes the gate:
  ```bash
  curl -s -X POST https://<DEPLOYED_URL>/event \
    -H 'Content-Type: application/json' \
    -d '{"input":{"writer":"human","kind":"instrument.zone.place","node":"zone:postflight","position":[0,1,0],"timbre":"hydrogen"}}' | jq .
  ```
- [x] **Co-Pilot** — two-client WS smoke against the DEPLOYED URL: commit-ack to sender, committed broadcast to the other client, ephemeral fan-out with self-echo exclusion, committed-resume on connect.
- [x] **Co-Pilot** — hibernation wake on production: connect a WS client, wait 12+ seconds, send a message, confirm the frame arrives and `getWebSockets()` still enumerates the socket.
- [ ] **Observer** — browser smoke on a real device: sound off on first load; toggle enables audio; place a zone; trigger a zone (sound + glow); a second device sees the placement live; keyboard listbox works; reduced-motion honored.

**Gate:** if any post-flight step fails, fix and redeploy. Do not hand the URL to the family test.

- [x] **Co-Pilot** — clean up test data:
  ```bash
  npx wrangler d1 execute music-maker --remote --command="DELETE FROM events WHERE data LIKE '%zone:postflight%'"
  ```

---

## Phase 4 — Coast (steady-state)

- [x] **Co-Pilot** — Workers Logs live:
  ```bash
  npx wrangler tail --format=json | head -20
  ```
- [x] **Co-Pilot** — D1 row count within budget (family scale = a few rows/session):
  ```bash
  npx wrangler d1 execute music-maker --remote --command="SELECT COUNT(*) FROM events"
  ```
- [ ] **Co-Pilot** — DO duration near zero when idle (Hibernation); check the dashboard metric. Watch for socket leaks (reconnect storms).
- [ ] **Pilot** — rollback drill BEFORE the family test: deploy a trivial change, roll it back, confirm the prior version is active:
  ```bash
  npx wrangler rollback   # or: wrangler rollback --version <VERSION_ID>
  ```
  Up to 100 versions retained; a rollback creates a new deployment, it does not delete history. It does NOT restore D1/DO data.
- [ ] **Pilot** — tag the release:
  ```bash
  git tag -a music-maker-v1.0.0 -m "Production deploy: SQLite DO, WS transport, keyboard a11y"
  ```

---

## Incident quick-reference (Pilot + Co-Pilot)

| Symptom | Likely cause | Action |
|---|---|---|
| WS clients drop repeatedly | Hibernation wake failing / transport oscillation | `wrangler tail` for DO errors; confirm `acceptWebSocket` in fetch |
| Committed events missing | D1 write failing (schema/quota) | `wrangler d1 execute --remote` check table + row count |
| Sound never plays | AudioContext gesture boundary broken | Hard reload; DevTools autoplay warnings |
| Deploy fails with storage error | `legacy-kv` still in config, or stale migration | Confirm `storage = "sqlite"`, no `new_classes` |
| Regression in a new version | Code bug | `wrangler rollback` — immediate, no downtime |

---

## Quick checklist (all phases)

```
PRE-FLIGHT
  [ ] Pilot: wrangler whoami + Workers Paid
  [ ] Co-Pilot: storage = "sqlite", no [[migrations]]
  [ ] Co-Pilot: wrangler types + tsc pass
  [ ] Co-Pilot: wrangler deploy --dry-run passes
  [ ] Co-Pilot: pnpm typecheck + test + build pass
  [ ] Co-Pilot: local WS smoke passes
  [ ] Co-Pilot: loom docs/port-audit + canon determinism pass

DEPLOY
  [ ] Pilot: wrangler d1 create music-maker → database_id into wrangler.toml
  [ ] Co-Pilot: d1 execute --remote --file=schema.sql
  [ ] Co-Pilot: verify events + d1_migrations remotely
  [ ] Pilot approve → Co-Pilot: wrangler deploy → capture URL

POST-FLIGHT
  [ ] Co-Pilot: GET /events 200
  [ ] Co-Pilot: committed write through the gate
  [ ] Co-Pilot: two-client WS smoke vs deployed URL
  [ ] Co-Pilot: hibernation wake on production
  [ ] Observer: browser smoke on real device
  [ ] Co-Pilot: clean test data

COAST
  [ ] Co-Pilot: wrangler tail live
  [ ] Co-Pilot: D1 row count in budget
  [ ] Pilot: rollback drill complete
  [ ] Co-Pilot: observability baseline after first family session
```

## Related documents

- `../docs/MAP.md` (in apps/loom) — the doc index
- `apps/loom/docs/MUSIC_MAKER_BUILD_PROMPT.md` — the build spec this runbook deploys
- `apps/loom/docs/HUMAN_TEST_PLAN.md` — the evidence-before-production discipline