# L5 Creation Economy — Production Deployment

**Status:** REVIEW — staging-ready
**Ref:** `CWP-2026-010`, `L5-CREATION-ECONOMY.md`, `migration 003` + `004`

This is the deploy + operations runbook for the L5 settlement layer. All code
is grounded in the **real** repo (no fictional tables/imports). Web Crypto
only; D1 `batch` atomicity; A2UI v0.9.

---

## 1. Architecture

```
User (trusted first-party renderer)
   │  POST /intent  (prompt, did, spoons, nonce?)
   ▼
IntentResolver ── cache (Cloudflare caches.default, SHA-256 key)
   │  → Creation Quote + A2UI v0.9 surface
   │  → telemetry row (quote_signals)  [non-blocking]
   ▼
Worker executes; renderer measures pre/post data-spoons
   │  POST /receipt  (did, worker_did, pre, post, nonce)
   ▼
CreationAccountant
   │  • measures spoon delta (trustless: renderer-reported)
   │  • signs canonical receipt (Ed25519, RECEIPT_SIGNER_PRIVATE_KEY)
   │  • replay check (consumed_nonces) + D1 batch
   │     [chain insert + penalty + nonce insert]  (atomic)
   ▼
Settlement (dual / user-choice)
   • LOVE  → love-ledger /withdraw  (verifies receipt sig if sent)
   • USDC → mcp-x402 /mcp  (x402 L402, forwards to L3.4 bridge)
```

| Component | File | Role |
| :--- | :--- | :--- |
| IntentResolver | `software/workers/intent-resolver/` | `/intent` → quote + surface + telemetry |
| CreationAccountant | `software/workers/creation-accountant/` | `/receipt` → signed hash-chained receipt |
| mcp-x402 | `software/workers/mcp-x402-gateway/` | `X-Creation-Unit` routing + `/mcp` bridge |
| love-ledger | `apps/phos/src/workers/love-ledger/` | `/withdraw` LOVE mint (verifies receipt sig) |
| Shared D1 | `love-ledger` (`592e3e2e-…`) | `love_chain`, `creation_penalties`, `consumed_nonces`, `quote_signals` |

---

## 2. API Reference

### `POST /intent` (IntentResolver)
```jsonc
// request
{ "prompt": "build an arcade game", "did": "did:key:abc",
  "settlement_preference": "love", "spoons": 3, "nonce": "client-abc123" }
// response
{ "intent": "…", "plan": ["oasis_execute", "…"],
  "quote": { "spoons_saved": 2, "care_value": 0.15,
    "settlement": { "love": 0.15, "usdc": 0.05, "recommended": "love" } },
  "surface": { /* A2UI v0.9 InterfaceDescription */ } }
```
Cache: identical validated requests are served from `caches.default`
(`Cache-Control: max-age=<INTENT_CACHE_TTL>`).

### `POST /receipt` (CreationAccountant)
```jsonc
// request
{ "intent_id": "uuid", "did": "user-did", "worker_did": "w-did",
  "pre_spoons": 2, "post_spoons": 4, "nonce": "client-abc123",
  "quote": { "spoons_saved": 2, "care_value": 0.15,
    "love_amount": 0.15, "usdc_amount": 0.05, "settlement_unit": "love" } }
// response
{ "success": true, "receipt": { "id": "creat-…",
    "spoons_saved": 2, "quote_met": true,
    "settlement": { "unit": "love", "amount": 0.15 } } }
```
Replay: a reused `nonce` → **409**. Failed quote (`|Δspoons| > 0.5`)
→ `quote_met:false` + a `creation_penalties` row, same transaction.

### `POST /withdraw` (love-ledger)
Headers: `Authorization: Bearer <LOVE_AUTH_SECRET>` (service) **or** a
did:key signature. Optional `X-Receipt-Signature` (base64 Ed25519) is
verified against `RECEIPT_SIGNER_PUBLIC_KEY` → **401** on mismatch.
```jsonc
{ "did": "user-did", "amount": 0.15 }
// → { "success": true, "blind_signature": "blindsig-…", "transactionId": "…" }
```
> The `blind_signature` is a **staging placeholder** until GNU Taler
> Clause Blind Schnorr ships (WASM). `BLIND_MODE=mock` + `ENVIRONMENT=production`
> is blocked (500).

### `POST /mcp` (mcp-x402)
- `X-Creation-Unit: usdc` → x402 402 + verify, forward to bridge.
- `X-Creation-Unit: love` → requires `X-Love-Auth-MAC` (HMAC-SHA256
  over `love:<timestamp>`, key `LOVE_AUTH_SECRET`, 60s TTL) → **403** on
  invalid/expired; then balance-checked + forwarded to bridge.

---

## 3. Secrets & Migrations

### Wrangler secrets (never in code)
| Worker | Secret | Format |
| :--- | :--- | :--- |
| creation-accountant | `RECEIPT_SIGNER_PRIVATE_KEY` | base64 PKCS#8 Ed25519 |
| love-ledger | `RECEIPT_SIGNER_PUBLIC_KEY` | base64 SPKI Ed25519 |
| love-ledger | `LOVE_AUTH_SECRET` | shared HMAC secret |
| mcp-x402 | `LOVE_AUTH_SECRET` | same value as above |
| love-ledger | `BLIND_MODE` | `mock` (staging) — prod blocks mock |

```bash
# generate an Ed25519 keypair (Node, one-time)
node -e "const {webcrypto}=require('crypto');(async()=>{ \
  const k=await webcrypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']); \
  const pk=Buffer.from(await webcrypto.subtle.exportKey('pkcs8',k.privateKey)).toString('base64'); \
  const pub=Buffer.from(await webcrypto.subtle.exportKey('spki',k.publicKey)).toString('base64'); \
  console.log('PRIV',pk);console.log('PUB',pub);})()"

wrangler secret put RECEIPT_SIGNER_PRIVATE_KEY --env staging   # creation-accountant
wrangler secret put RECEIPT_SIGNER_PUBLIC_KEY  --env staging   # love-ledger
wrangler secret put LOVE_AUTH_SECRET --env staging                # love-ledger + mcp-x402
```

### Migrations (shared `love-ledger` D1)
```bash
wrangler d1 migrations apply --remote love-ledger   # applies 001…004
```
- `003` — `love_chain.metadata` + `creation_penalties`
- `004` — `consumed_nonces` (replay) + `quote_signals` (telemetry)

---

## 4. Deploy

```bash
cd software/workers/intent-resolver   && npx tsc --noEmit && npx wrangler deploy --env staging
cd software/workers/creation-accountant && npx tsc --noEmit && npx wrangler deploy --env staging
cd software/workers/mcp-x402-gateway  && npx tsc --noEmit && npx wrangler deploy --env staging
cd apps/phos && npx tsc --noEmit && npx wrangler deploy --env staging   # love-ledger
```

---

## 5. Testing & Monitoring

```bash
node tests/triper/triper-runner.mjs --cert   # 12/12 (incl. creation-economy, 8 tests)
npx vitest run tests/unit/mcp/love-auth.test.ts   # Axis-6 HMAC
```
- **Monitor:** Cloudflare Workers logs (all 4 have `[observability]`).
- **Telemetry:** `quote_signals` grows per `/intent`; `consumed_nonces`
  accrues replay attempts (should stay ~0).
- **Tuning (Axis-4):** once `quote_signals` has ~500–1000 rows,
  recalibrate `quote-generator.ts` coefficients against
  `actual_spoons_saved` feedback.

---

## 6. Deferred (next sprint, tracked)
- **Axis-1** — real GNU Taler Clause Blind Schnorr (WASM). Current
  Ed25519 attests the worker DID; mock blind-sig stays staging-only.
- **Axis-4 math** — calibrate quote heuristics from `quote_signals`.
- **Axis-8** — live bridge contract test (skipped unless `MCP_BRIDGE_URL` set).
- **Axis-9** — broader retry/HMAC coverage as traffic data arrives.
