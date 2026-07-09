# LOVE Ledger — Architecture & Current State

> Honest map of what exists in code vs. what is deployed vs. what is planned.
> Companion to `LOVE_LITEPAPER.md`. Last updated 2026-07-08.

---

## 1. Three Representations

There are **three** distinct LOVE ledger code artifacts. They are not the same worker.

| Artifact | Path | Routes | Model | Deployed? |
|----------|------|--------|-------|-----------|
| **Simple worker (canonical)** | `apps/phos/src/workers/love-ledger/index.ts` | `/health`, `/balance`, `/transfer`, `/stake`, `/care-score`, `/status`, `/chain`, `/export` | two‑pool (sovereignty/performance) + care_score + SHA‑256 hash chain | ✅ Yes — `love-ledger.trimtab-signal.workers.dev` |
| **Monolith** | `software/workers/love-ledger.ts` (v1.3.0) | `/api/love/balance/:id`, `/earn`, `/spend`, `/care-score`, `/leaderboard`, `/register` | two‑pool + care_score | ❌ No (code only) |
| **MCP surface** | `cli/love-registry.js` | `love_status`, `love_balance`, `love_sync` | reads simple worker | ✅ Yes (CLI tool) |

The **frontend** (`apps/phos/src/lib/api/ledger.ts`, `apps/phos/src/config/endpoints.ts`)
talks to the **simple worker** (`/balance`, `/transfer`, `/stake`). The rich two‑pool
design described in the litepaper lives only in the **monolith**, which is not deployed.

> **Canonical implementation:** the deployed **simple worker** is the source of truth
> (two‑pool + care_score + hash chain are live). Work Package Task 1 unified the
> monolith's two‑pool/care_score design into the simple worker; the monolith
> (`software/workers/love-ledger.ts`) is now reference-only and not deployed.

---

## 2. Live D1 Schema (the truth on the ground)

The `love-ledger` D1 database (`592e3e2e-3203-4e0a-8342-9e85215ec8a6`) is **shared**
across multiple workers (love-ledger, contract-engine, genesis-spark). Live tables:

| Table | Owner | Columns | Notes |
|-------|-------|---------|-------|
| `love_accounts` | simple worker | `…, care_score(REAL, def 0.5), care_score_at(INTEGER, def 0)` | ✅ Task 1 added `care_score` + `care_score_at`. `/balance` + `/status` return `careScore` (with 7‑day grace / 0.005‑per‑day decay, floor 0.1) and two‑pool (`sovereigntyPool` = ⌊earned/2⌋, `performancePool` = earned − that), derived from `earned` so no write‑path change. |
| `love_stakes` | simple worker | `contract_id, staker_did, amount, vested, unlocked_at, status, created_at, updated_at` | Used by `/stake`. `vested` column exists but the worker never writes it. |
| `love_transactions` | **monolith** | `id, from_did, to_did, amount, type, contract_id, signature, timestamp(TEXT), block_hash` | ⚠️ Monolith schema. **No `prev_hash`/`entry_hash`/`created_at` columns.** The simple worker does NOT write here. Pre-existing rows are monolith test data (`reward`/`transfer`, `sig:…` placeholders, negative amounts). |
| `love_chain` | simple worker | `id, from_did, to_did, amount, type, signature, prev_hash, entry_hash, created_at(INTEGER)` | ✅ Court‑admissible SHA‑256 hash chain. Created for Work Package Task 2. Per‑did linked list; `prev_hash` links to the sender's prior `entry_hash` (genesis = 64 zeros). |
| `balances` | monolith | `user_id, total_earned, sovereignty_pool, performance_pool, care_score, updated_at` | Two‑pool schema. FK to `users` which **does not exist** → monolith `registerUser` would fail. |
| `love_ledger` | game/bonding | `id, player_id, source, amount, timestamp` | Not a LOVE transaction table. |
| `genesis_chain`, `genesis_telemetry` | genesis worker | — | Belong to a different worker; present because the DB is shared. |
| `_cf_KV` | Cloudflare | — | Internal KV‑backed table. |
| `love-ledger-archive` (R2) | simple worker | `love-export/{did}/{iso}.json` + `.txt`, `love-archive/{YYYY-MM-DD}/{did}.json` + `.txt` + `manifest.json` | ✅ Task 3/4 cold WORM store. `/export?store=1` writes a per‑did artifact; the `scheduled` cron (`0 */6 * * *`) snapshots **every** did's chain daily with a dated manifest. |

### Critical gap (RESOLVED — Work Package Task 2)
The simple worker's `/transfer` originally INSERTed into `love_transactions`, which
exists but only in the **monolith schema** (no `prev_hash`/`entry_hash` columns).
Three bugs blocked it (all now fixed in `apps/phos/src/workers/love-ledger/index.ts`):

1. **Schema mismatch** — `love_transactions` lacks hash‑chain columns, so the INSERT
   failed. Fix: a dedicated `love_chain` table now carries the chain.
2. **`undefined` bind** — `body.signature` is `undefined` on the wire (the frontend
   signs `JSON.stringify({from,to,amount})` with no `signature` field, per
   `signer.ts`). D1 `.bind()` rejects `undefined` → `D1_TYPE_ERROR`. Fix:
   `body.signature ?? null`.
3. **D1‑in‑Worker `ORDER BY` on content projections throws 1101** — any
   `… ORDER BY <col> …` query that also projects non‑rowid columns 1101s in the
   worker binding (confirmed against `love_transactions`; `wrangler d1` direct
   queries are unaffected). Fix: never `ORDER BY` in the worker; sort in JS by
   `created_at`.

Result: **`/transfer` → 200, `/chain?did=` → linked list with `valid` continuity
flag, real Ed25519 `did:key` signature verified.** See end‑to‑end test notes below.

---

## 3. What the Litepaper Claims vs. Code

| Claim | Status |
|-------|--------|
| Two‑Pool Model (sovereignty/performance) | ✅ Deployed (derived 50/50 from `earned` in `/balance` + `/status`); the monolith's earn‑time 50/50 *split* requires an earn endpoint (future) |
| Care score decay + floor (0.1) | ✅ Deployed — `computeEffectiveCareScore` (grace 7d, decay 0.005/d, floor 0.1) in `/balance`, `/care-score`, `/status`; `POST /care-score` updates it (signed) |
| `used_nonces` replay protection | ✅ In monolith (earn + spend); requires `LOVE_REQUIRE_AUTH=true` |
| Off‑chain D1 + Durable Objects | ✅ Both; DO used for atomic spend in monolith |
| ERC‑5192 soulbound badges | ✅ Contract exists (`LOVESBT.sol`, Base Sepolia per AGENTS.md); nothing auto‑mints from ledger yet |
| MCP server + agents.json | ✅ `cli/love-registry.js` + `.well-known/agents.json` |
| **Age‑vested Sovereignty Pool (13→25)** | ❌ Not in any code — design proposal only |
| **GNU Taler bridge** | ✅ Deployed — `taler-exchange-bridge` orchestrates the Taler reserve/deposit API (`did:key` auth, Crockford `reserve_pub`, `GET /config`); blind-signature cryptography is performed by the wallet/exchange per Taler design |
| **Court‑admissible hash chain inside LOVE** | ✅ Implemented & deployed — `love_chain` table in the simple worker; `entry_hash = SHA‑256(from‖to‖amount‖ts‖prev_hash‖signature)`, `prev_hash` links to prior `entry_hash` per did; `/chain` verifies continuity |

---

## 4. Work Package → File Map

| Task | Primary file(s) | Depends on |
|------|----------------|------------|
| 1. Unify worker | `apps/phos/src/workers/love-ledger/index.ts` — `care_score` + two‑pool (derived) in `/balance`/`/status`/`/care-score`; monolith logic ported, **not** replacing live routes | ✅ DONE & deployed (live `careScore`+pools test) |
| 2. Hash chain | `apps/phos/src/workers/love-ledger/index.ts` → `love_chain` table; `GET /chain` continuity check | ✅ DONE & deployed (live `valid:true` test) |
| 3. Pruning/archiving | `scheduled` cron `0 */6 * * *` + R2 `love-ledger-archive`; daily WORM snapshot per did + manifest | ✅ DONE & deployed (R2 objects confirmed) |
| 4. Court export | `GET /export?did=` → self‑verifying artifact (root hash + affidavit `.txt`) + R2 storage | ✅ DONE & deployed (R2 object confirmed) |
| 5. Taler | new worker + exchange deploy | greenfield |
| 6. HRV coherence | new service | research |
| 7. Docs | `docs/LOVE_LITEPAPER.md`, this file | — |

---

## 5. Immediate Fix — DONE

Task 2 is live on the deployed worker (`love-ledger.trimtab-signal.workers.dev`):

1. `love_chain` table created with `prev_hash`/`entry_hash`/`created_at` columns.
2. `/transfer` computes `entry_hash = SHA-256(from‖to‖amount‖ts‖prev_hash‖signature)`
   where `prev_hash` = latest `entry_hash` for that `did` (genesis = 64 zeros), picked
   in JS (no `ORDER BY`).
3. `GET /chain?did=` returns the linked list sorted by `created_at` in JS, with a
   `valid` continuity flag that recomputes every `entry_hash`.

Verified end‑to‑end (2026‑07‑08): two signed transfers from one `did:key` produced
`count:2, valid:true`, with `entry[1].prevHash === entry[0].entryHash`. The recipient
`did` need not pre‑exist (the `to` balance update is optimistic).

**Remaining caveat:** `love_transactions` (monolith schema) is still written by other
code paths and is *not* part of this chain. Task 4 (court export) reads from
`love_chain`.

---

## 6. Live Endpoints (deployed worker)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/health` | GET | — | liveness |
| `/balance?did=` | GET | — | balance, staked, earned, reputation, `careScore`, two‑pool |
| `/transfer` | POST | `X-Signature` (Ed25519, `from`) | signed LOVE transfer; appends to `love_chain` |
| `/stake` | POST | `X-Signature` (Ed25519, `did`) | lock LOVE against a contract |
| `/chain?did=` | GET | — | hash chain + `valid` continuity flag + `rootHash` |
| `/care-score?did=` | GET | — | effective `careScore` (decayed) |
| `/care-score` | POST | `X-Signature` (Ed25519, `did`) | set `careScore` (clamped 0.1–1.0) |
| `/status?did=` | GET | — | unified snapshot: balance + care_score + pool + chain validity |
| `/export?did=&store=` | GET | — | court‑admissible artifact; `store=1` writes JSON + `.txt` affidavit to R2 |
| (cron) | `0 */6 * * *` | — | WORM snapshot of every did's chain to R2 + dated manifest |
