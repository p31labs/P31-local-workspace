# CWP-2026-010: L5 CREATION ECONOMY — INTENT-DRIVEN WORKER MODEL

**Status:** AUTHORIZED — READY FOR EXECUTION
**Issued:** 2026-07-11
**Operator:** trimtab-signal / p31
**Parent:** CWP-2026-009 (Sierpinski Expansion)
**Geometry:** Five phases — (1) IntentResolver, (2) CreationAccountant, (3) Dual Settlement Router, (4) LOVE Issuer, (5) TRIPER Test Suite
**Deadline:** 2026-07-31 (implementation) → 2026-08-01 (NGI submission)

---

## PREAMBLE

The L5 Creation Economy is a **paradigm shift** from the extractive tollbooth
model (charging per API call / token) to a **co-creative, value-based** settlement
model — the worker settles on *value created for the user* (spoons saved, care
generated, time returned), not value extracted from them. This CWP implements
the architecture in `cwp-2026-009-sierpinski-expansion/L5-CREATION-ECONOMY.md`,
grounded against the **real** repo (not the aspirational AI blueprint, which
assumed APIs that do not exist: a Hono love-ledger, D1 `spoon_state` /
`creation_penalties` tables, a `POST /mcp` handler, and `crypto.randomBytes`
in a Worker — all corrected below).

The external landscape validates the direction: GNU Taler Clause Blind
Schnorr signatures are production-ready; ERC-5192 (Soulbound NFTs) is
finalised; x402 is at 165M+ transactions (Google Cloud / Cloudflare / Stripe);
A2UI v0.9 (Apr 2026) gives a framework-agnostic surface.

---

## PREREQUISITES (Already Shipped — verified)

| Component | Commit | Status | Grounding note |
| :--- | :--- | :--- | :--- |
| UIG Adaptive Exocortex | `9bb2a90` | ✅ Shipped | `generateInterface` + `generateInterfaceFromIntent` |
| A2UI v0.9 adapter + renderer | `cf7b494` | ✅ Shipped | `toA2UI` / `A2UIRenderer` |
| LOVE ledger (D1 hash-chain) | `bf8c991` | ✅ Shipped | hand-rolled `fetch`/`if-else`, D1 `LOVE_DB`, Web Crypto `sha256` |
| mcp-x402 Worker | `bf8c991` | ✅ Validated | Hono; **no `POST /mcp` handler** (404'd) — fixed here |
| Cognitive Passport v4.1 | `e9821ec` | ✅ Shipped | `baselineSpoons: 3`; `passport` unused by generator core |
| data-spoons / UIG renderer | `408180f` | ✅ Shipped | spoon state is **client-local** (no edge D1 store) |
| TRIPER cert (12/12 suites) | `777051a` | ✅ Rebuilt | `tests/triper/triper-runner.mjs --cert` |
| L5-CREATION-ECONOMY.md | — | ✅ Drafted | concept + ratified Q's |

**Grounding corrections applied (vs the blueprint):**
- love-ledger is **not** Hono; its D1 binding is `LOVE_DB`; hash via
  `sha256` (Web Crypto); `care_score` columns are out-of-band.
- **No** `creation_penalties` / `spoon_state` D1 tables exist → added by migration `003`.
- spoon state is **client-measured** (`data-spoons` pre/post) → passed in request bodies, not queried from D1.
- mcp-x402 had **no** `POST /mcp` handler → added (forwards to L3.4 bridge).
- `crypto.randomBytes` (Node) is unavailable in Workers → use `crypto.randomUUID()` / Web Crypto.
- Env-name bug: code reads `REVENUE_INGEST_URL` but toml set `BILLING_INGEST_URL` → toml fixed.

---

## PHASE 1: INTENTRESOLVER WORKER

**Location:** `software/workers/intent-resolver/`

Purpose: parse natural-language intent, return a capability plan + **Creation Quote**
(no execution).

**Files (created):**

| File | Description |
| :--- | :--- |
| `src/index.ts` | Hono `app.post('/intent', …)` + `zValidator` |
| `src/intent-parser.ts` | `generateInterfaceFromIntent({prompt, spoons})` |
| `src/capability-planner.ts` | intent keyword → MCP tool list + A2UI surface |
| `src/quote-generator.ts` | `spoons_saved`, `care_value`, `love_amount`, `usdc_amount` |
| `wrangler.toml` | `PASSPORT_KV` (passport lookup) |

**Key notes (grounded):**
- Use `generateInterfaceFromIntent` (takes a **prompt**), NOT `generateInterface`
  (takes pre-built `viewData`). The `passport` field is ignored by the generator core.
- **Spoon state is client-local** — accept `spoons` from the request body
  (default `passport?.baselineSpoons ?? 3`). Do **not** query a D1 spoon store.
- No Node `crypto`; pure TS + Hono.

**Quote math (from `quote-generator.ts`):**
```
spoons_saved = min(5, max(0, ceil(tools.length * 0.5)))
care_value    = spoons_saved * 0.075
love_amount   = care_value                      // 1:1
usdc_amount  = tools.reduce((a,t)=> a + (t.includes('llm')||t.includes('jitterbug') ? 0.25 : 0.05), 0)
recommended_unit = auto ? (passport?.baselineSpoons < 3 ? 'love' : 'usdc') : preference
```

**Verify:**
```bash
cd software/workers/intent-resolver
npx tsc --noEmit
npx wrangler deploy --dry-run
curl -X POST https://intent-resolver.workers.dev/intent \
  -H 'content-type: application/json' \
  -d '{"prompt":"build an arcade game","spoons":2}' | jq .
# → { intent, plan:[...], quote:{ spoons_saved, care_value, settlement:{love,usdc,recommended} }, surface }
```

---

## PHASE 2: CREATIONACCOUNTANT WORKER

**Location:** `software/workers/creation-accountant/`

Purpose: post-execution, measure actual value, verify the quote, write a
**creation receipt** to the LOVE ledger.

**Files (created):**

| File | Description |
| :--- | :--- |
| `src/index.ts` | `POST /receipt`, `POST /penalty`, `GET /receipt/:id` |
| `src/spoon-measure.ts` | `measureSpoonDelta(pre, post)` — trustless oracle |
| `src/receipt-writer.ts` | Web Crypto `sha256` + D1 `batch` atomic write |
| `wrangler.toml` | `LOVE_LEDGER` (shares love-ledger D1) + `CREATION_KV` |

**Key notes (grounded):**
- **Trustless oracle:** `spoons_saved = max(0, post - pre)` where `pre`/`post`
  are the **renderer's** `data-spoons` values (caller-supplied). The worker
  cannot fabricate its own value.
- **Atomicity:** `db.batch([insertChain, insertPenalty])` — if `!quote_met`,
  the penalty is written in the **same** transaction as the receipt.
- **Schema:** reuses the real `love_chain` columns
  `(id, prev_hash, entry_hash, from_did, to_did, amount[TEXT], type, signature, created_at, metadata)`.
  `metadata` (new) carries the receipt payload — added by migration `003`.
- **`creation_penalties`** table is **new** (migration `003`) — must be applied
  via `wrangler d1 migrations apply` before deploy.

**Verify:**
```bash
cd software/workers/creation-accountant
npx tsc --noEmit
npx wrangler deploy --dry-run
curl -X POST https://creation-accountant.workers.dev/receipt \
  -H 'content-type: application/json' -d '{
    "intent_id":"int-1","did":"did:key:user","worker_did":"did:key:w1",
    "pre_spoons":2,"post_spoons":4,
    "quote":{"spoons_saved":2,"care_value":0.15,"love_amount":0.15,"usdc_amount":0.25,"settlement_unit":"love"}}' | jq .
```

---

## PHASE 3: DUAL SETTLEMENT ROUTER (EXTEND MCP-X402)

**Location:** `software/workers/mcp-x402-gateway/src/index.ts` (+ `wrangler.toml`)

Purpose: route settlement by `X-Creation-Unit: love|usdc`; make paid
calls actually reach the L3.4 bridge.

**Changes (grounded):**
1. **Env:** add `LOVE_LEDGER: D1Database` + `BRIDGE_URL: string`.
2. **wrangler:** add `[[d1_databases]] LOVE_LEDGER` (shares love-ledger D1
   `592e3e2e-…`) + `BRIDGE_URL` var; **rename** `BILLING_INGEST_URL`
   → `REVENUE_INGEST_URL` (matches code).
3. **New `app.use` BEFORE the `/mcp` gate:** for `X-Creation-Unit: love`,
   verify LOVE balance (`love_accounts`) → 402 if insufficient, else issue
   blind-sig placeholder + **short-circuit straight to the bridge** (bypass x402).
4. **New `app.post('/mcp')`:** proxy the request to `BRIDGE_URL`
   (closes the prior 404 — paid AND free calls now reach the bridge).
5. Gate body-read fixed to `c.req.raw.clone().json()` so the body is not
   consumed before the `/mcp` route reads it.

**Verify:**
```bash
cd software/workers/mcp-x402-gateway
npx tsc --noEmit
npx wrangler deploy --dry-run
curl -H "X-Creation-Unit: love" -H "X-DID: did:key:test" \
  https://mcp-x402.workers.dev/mcp -d '{"method":"tools/call","params":{"name":"oasis_execute"}}'
curl -H "X-Creation-Unit: usdc" https://mcp-x402.workers.dev/mcp -d '{"method":"tools/call","params":{"name":"oasis_execute"}}'
```

---

## PHASE 4: LOVE ISSUER (EXTEND LOVE LEDGER)

**Location:** `apps/phos/src/workers/love-ledger/index.ts` (+ migration `003`)

Purpose: issue blind-signed LOVE credits via GNU Taler withdrawal flow.

**Changes (grounded — this worker is hand-rolled `fetch`/`if-else`, NOT Hono):**
1. Add `'/withdraw'` to `WRITE_PATHS` (fail-closed auth gate).
2. Add `POST /withdraw` handler: check balance → **D1 `batch`**
   `[debit, chain-insert]` (reuses the real `sha256` + prev_hash pattern).
3. `love_chain` type `'love_withdraw'`; `amount` as TEXT.
4. Migration `003_creation_accounting.sql`: `ALTER TABLE love_chain ADD COLUMN
   metadata TEXT` + `CREATE TABLE creation_penalties (…)`.

**Verify:**
```bash
cd apps/phos && npx tsc --noEmit
wrangler d1 migrations apply --remote love-ledger   # applies 003
curl -X POST https://love-ledger.p31ca.org/withdraw \
  -d '{"did":"did:key:test","amount":0.15,"blind_secret":"s"}' | jq .
```

---

## PHASE 5: TRIPER TEST SUITE FOR L5

**Location:** `tests/mvp/creation-economy/creation-economy.triper.test.mjs`

Purpose: certify the **intent → generation** core (the IntentResolver's
engine) against the 6 TRIPER axes. Live e2e (intent → bridge →
receipt) needs the deployed Workers (secrets) — so e2e here certifies the
**offline generation core**, which is what the Worker actually calls.

**Axes (all 6 asserted):**
| Test | Axis |
| :--- | :--- |
| intent → valid interface | Task |
| spoons=0 → crisisMode | Resilience |
| structurally valid description | Interface |
| identical intent → identical output | Purity |
| intent path yields valid interface | E2E (generation core) |
| stable widget shape | Regression |

**Verify:**
```bash
node tests/triper/triper-runner.mjs --cert   # all 12 suites, incl. creation-economy
```

---

## DOCUMENTATION & HYGIENE

| Task | File |
| :--- | :--- |
| L5 concept | `cwp-2026-009-sierpinski-expansion/L5-CREATION-ECONOMY.md` ✅ |
| CWP index L5 row | `cwp-2026-009-sierpinski-expansion/CWP-2026-009_INDEX.md` |
| AGENTS.md L5 section | `AGENTS.md` |
| Impact report | `GLOBAL_IMPACT_REPORT.md` |
| Grant narrative | weave §6 insert into NLnet + Exante packs (forge) |

---

## ACCEPTANCE CRITERIA (CWP COMPLETE)

### Shipped (scaffolding + optimization pass)
- [x] IntentResolver `tsc --noEmit` clean; `/intent` returns a Creation Quote.
- [x] CreationAccountant `tsc --noEmit` clean; `/receipt` writes a hash-chained entry to `love_chain` (D1 `batch`).
- [x] **Axis-2:** receipts signed with **Ed25519** (`RECEIPT_SIGNER_PRIVATE_KEY`) into `love_chain.signature`; `love-ledger /withdraw` verifies (`RECEIPT_SIGNER_PUBLIC_KEY`).
- [x] **Axis-5:** D1 `batch`/`run` wrapped in `withRetry` (exp backoff) — atomic, no half-written ledger.
- [x] **Axis-7:** identical intents served from `caches.default` (SHA-256 key, `c.executionCtx.waitUntil`).
- [x] Migration `003` applied: `love_chain.metadata` + `creation_penalties`.
- [x] Migration `004` applied: `consumed_nonces` + `quote_signals`.
- [x] **Axis-3:** spoon-delta replay blocked via `consumed_nonces` (unique nonce, 409 on reuse).
- [x] **Axis-4:** `quote_signals` telemetry captured non-blocking from `/intent` (`/creation-economy` TRIPER test added).
- [x] **Axis-6:** LOVE-path requests on `mcp-x402` require HMAC-SHA256 (`LOVE_AUTH_SECRET`, 60s TTL) → 401 on miss/expiry.
- [x] mcp-x402: `X-Creation-Unit` routing works; `POST /mcp` forwards to the L3.4 bridge (no 404).
- [x] love-ledger `/withdraw` issues a blind-sig placeholder + debits atomically.
- [x] TRIPER suite `creation-economy.triper.test.mjs` passes (**8 axes/tests**, was 6).
- [x] Full TRIPER cert: **12/12** green.
- [x] All Workers use **Web Crypto** (no Node `crypto`); multi-statement D1 uses **`batch`**.
- [x] `tests/unit/mcp/love-auth.test.ts` covers Axis-6 HMAC (valid / wrong-secret / expired / missing).

### Deferred (next sprint — tracked, not blocking)
- [ ] **Axis-1:** real GNU Taler Clause Blind Schnorr via WASM. Current Ed25519 is a **staging-only** mock behind `BLIND_MODE === 'mock' && ENVIRONMENT === 'production'` guard (500).
- [ ] **Axis-4 math:** calibrate `quote-generator.ts` coefficients from `quote_signals` once ~500–1000 rows accrue.
- [ ] **Axis-8:** live L3.4 bridge contract test (`tests/unit/mcp/mcp-bridge.contract.test.ts`) — skipped unless `MCP_BRIDGE_URL` set.
- [ ] **Axis-9:** broader retry/HMAC coverage as traffic arrives.

### Hygiene
- [x] Docs updated: CWP index, AGENTS.md (L5 section), `L5-DEPLOYMENT.md`, GLOBAL_IMPACT_REPORT.md.
- [x] `node cli/p31-automation-engine.js validate` (TRIPER cert) green.

---

## COMMIT MESSAGE

```
feat(L5): Creation Economy — intent-driven worker model (scaffolding)

- IntentResolver Worker: /intent → Creation Quote (UIG generateInterfaceFromIntent)
- CreationAccountant Worker: /receipt → LOVE receipt (D1 batch, Web Crypto)
- Dual Settlement Router: X-Creation-Unit header (love|usdc) + POST /mcp bridge forward
- LOVE Issuer: /withdraw (blind-sig placeholder, atomic D1)
- Migration 003: love_chain.metadata + creation_penalties
- TRIPER suite: creation-economy.triper.test.mjs (6 axes)
- Grounded vs real repo (corrected blueprint's fictional APIs)

Ref: CWP-2026-010 — L5 Creation Economy
```

---

*P31 Labs | 501(c)(3) Nonprofit | EIN 42-1888158*
