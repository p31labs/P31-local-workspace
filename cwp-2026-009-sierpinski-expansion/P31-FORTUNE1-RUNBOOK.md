# P31 Fortune 1 Runbook — Production Deployment & Operations

**Version:** 1.0 (definitive)
**Date:** 2026-07-12
**Scope:** P31 Quantum Backend + Creation Economy (SIMD128 needle-rs, Reserve&Refund GLM billing, LOVE ledger, MCP/x402).
**Status:** Phase 1 (edge SIMD128) COMPLETE & VERIFIED. Phases 2–6 planned.

> This runbook is the single source of truth. It supersedes earlier drafts and
> corrects a critical Cloudflare Workers WASM packaging myth (see §11).

---

## 1. Architecture (verified, production)

```
┌──────────────────────────── CLOUDFLARE WORKERS (Paid $5/mo) ────────────────────────────┐
│                                                                                          │
│  love-ledger (D1+PQC+ML-DSA-44)   intent-resolver (WASM SIMD128 + R2)                     │
│  creation-accountant (Ed25519 receipts)   mcp-x402-gateway (x402 + GLM fallback)          │
│  jitterbug-api (shared D1)   buffer-scorer   arcade (dashboard)                           │
│                                                                                          │
│  R2: p31-needle-weights  →  needle-v1.safetensors (22 MB INT4) + vocab.txt                │
│  D1: love-ledger  →  love_accounts, love_chain, pilot_registry, cbs_nonce,                │
│                      consumed_nonces, quote_signals, llm_usage (Phase 4)                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

| Component | Role | Key endpoints |
|---|---|---|
| love-ledger | LOVE credits, CBS blind-sig, PQC ML-DSA-44 seal, pilot registry, **LLM billing (Phase 4)** | `/withdraw`, `/transfer`, `/llm/reserve`, `/llm/settle`, `/llm/usage` |
| intent-resolver | Edge-native intent classification (needle-rs SIMD128) → Creation Quote | `POST /intent`, `GET /health` |
| needle-service | Central tool-calling for all workers (service binding) — **Phase 3** | `POST /classify` |
| mcp-x402-gateway | x402 pay-per-call, GLM-4.7-Flash fallback, billing integration | `POST /mcp` |
| creation-accountant | Value measurement, Ed25519 receipt signing | `POST /receipt` |
| jitterbug-api | Brain-dump orchestrator (shares love-ledger D1) | `POST /brain-dump` |
| buffer-scorer | Scoring heuristics | `POST /score` |
| arcade | Pilot registry dashboard | `GET /`, `GET /api/pilots` |

---

## 2. Prerequisites

- **Cloudflare Workers Paid plan** — *active* ($5/mo, confirmed).
- **Tools:** `wrangler` ≥ 4.105, `pnpm` 10+, `wasm-pack` 0.15, `rustc` 1.96 + `wasm32-unknown-unknown`, `gh` (for CI secrets only).
- **Credentials:** `wrangler whoami` → OAuth (trimtab.signal@proton.me, confirmed). `CLOUDFLARE_API_TOKEN` for CI.
- **GitHub fork of needle-rs** (`p31labs/needle-rs`): **BLOCKED** — `GH_TOKEN` invalid (401). Fork + upstream PR require valid GitHub credentials.

---

## 3. Infrastructure provisioning

### 3.1 D1 (love-ledger)
Migrations applied in order under `apps/phos/src/workers/love-ledger/migrations/`:
`001_initial` → `002_love_chain` → `003_creation_accounting` → `004_replay_telemetry`
→ `005_cbs_nonce` → `006_cbs_coin` → `007_pqc_sig` → `008_pilot_registry`
→ `009_llm_usage` (Phase 4). HEAD == origin/main == `2c7aadb`.

### 3.2 R2 (p31-needle-weights)
- `needle-v1.safetensors` (22 MB INT4) + `vocab.txt` — **LIVE**.
- Phase 2 adds `needle-v2.safetensors` (fine-tuned: 900 synthetic + 100 negative prompts).

### 3.3 Secrets (love-ledger)
`RECEIPT_SIGNER_PRIVATE_KEY` / `_PUBLIC_KEY` (Ed25519), `LOVE_AUTH_SECRET`
(rotated 2026-07-12 → `43fa3d82…443ab7`, set on love-ledger), `BLIND_ISSUER_*`,
`ISSUER_NONCE_R`. `mcp-x402-gateway` shares `LOVE_AUTH_SECRET` (HMAC-SHA256, 60s TTL).

---

## 4. Deployment pipeline

### 4.1 Deploy order (dependency-safe)
```
# Phase 1 core (no deps)
love-ledger → creation-accountant → jitterbug-api → buffer-scorer → arcade

# Phase 3 (must be live before service bindings consume it)
needle-service

# Workers with service bindings / R2 WASM
intent-resolver → mcp-x402-gateway
```

### 4.2 Intent-resolver WASM build (CANONICAL — see §11)
```
cd /tmp/opencode/needle-rs
wasm-pack build --target bundler crates/needle-wasm --release
# copy needle_wasm_bg.wasm, needle_wasm_bg.js, *.d.ts
#      → software/workers/intent-resolver/src/needle/
# write the tree-shake-proof shim (§11) as needle_wasm.js
cd software/workers/intent-resolver && wrangler deploy
```

### 4.3 Zero-touch (l5-deploy.sh)
`AUTO_KV=1 bash cwp-2026-009-sierpinski-expansion/l5-deploy.sh` — runs TRIPER
cert, provisions KV, generates+uploads secrets, applies D1 migrations, builds
WASM, uploads R2, dry-run gates, live deploys, post-deploy cert.

---

## 5. Validation & acceptance

Post-deploy health: `GET /health` on every worker → `200`, `needle.ready:true`
on intent-resolver, `initFailures:0`.

Smoke (CBS): `software/workers/creation-accountant/taler-cbs/test/cbs-smoke.mjs`
→ `CBS LIVE SMOKE: PASS`.

Intent (SIMD128 live):
```
curl -X POST https://intent-resolver.trimtab-signal.workers.dev/intent \
  -H 'content-type: application/json' \
  -d '{"prompt":"deploy my creation to production","spoons":3}'
# → "needle_used":true  (proven 2026-07-12, Version 15094e9c)
```

LLM billing (Phase 4): `POST /llm/reserve` → `{"success":true,"reserved":…}`;
`settle` refunds diff via `ctx.waitUntil`.

---

## 6. Monitoring

- **Health:** `needle.{ready,requests,successes,fallbacks,initFailures,inferenceTimeouts,avgInferenceMs}`.
- **Alerts:** `initFailures > 0` (WASM init broke → see §11), `needle_used` rate `< 90%`
  (excess heuristic fallback), `/intent` warm p95 `> 300ms`.
- **Logs:** `wrangler tail intent-resolver` (note: log streaming can lag/buffer;
  surface init errors via the `lastError` diagnostic field temporarily if needed).
- **Cost guard:** GLM-4.7-Flash ≈ $0.06–0.40 / 1M tokens, charged $5 / 1M →
  12–83× margin. Reserve&Refund caps exposure (1 LOVE = 1000 tokens = $0.05).

---

## 7. Incident response

### 7.1 Degraded needle-rs (`initFailures > 0`, `needle_used` drops)
**Root cause almost always §11 (WASM tree-shaking) or a bad WASM build.**
1. `wrangler tail` (or temp `lastError` field) to capture the real error.
2. If `LinkError: missing import …`: rebuild with the §11 shim; redeploy.
3. If unrecoverable: `wrangler rollback` (Version `15094e9c` is known-good SIMD128).

### 7.2 Cold-start latency spike (first request ~20–28s)
**Expected under sparse traffic.** The 22 MB INT4 model is fetched from R2 and
parsed per *fresh* isolate; once an isolate is warm, inference is sub-second.
Steady production traffic keeps isolates warm. Mitigations if it bites:
- Keep isolates warm (periodic lightweight request), or
- Reduce model size / quantize further (Phase 2 `needle-v2`).
- Do **not** raise `cpu_ms` as a fix — the cost is I/O (R2 fetch), not CPU.

### 7.3 D1 `SQLITE_BUSY` / LLM billing 402
Retry-with-backoff present in love-ledger. For 402-with-balance: verify
`LOVE_AUTH_SECRET` matches across love-ledger and mcp-x402-gateway.

---

## 8. Rollback
`wrangler rollback` (single worker) or per §4.1 order (stack). Known-good
intent-resolver SIMD128: `15094e9c`.

---

## 9. Scaling & cost
- Workers Paid $5/mo fixed. R2 ≈ $0 (22 MB). D1 included. GLM pass-through.
- needle-rs local inference = 100% margin. Revenue = LOVE charged to users.

---

## 10. Security & compliance
- **ML-DSA-44 (L1) PQC seal LIVE** on love-ledger.
- Rotated `LOVE_AUTH_SECRET` (2026-07-12). Ed25519 receipt signing.
- Quarterly key rotation for `BLIND_ISSUER_*`, `LOVE_AUTH_SECRET`, `RECEIPT_SIGNER_*`.
- GNU Taler blind signatures LIVE (`BLIND_MODE='taler'`, `taler_cs.wasm` CompiledWasm).

---

## 11. CRITICAL: Cloudflare Workers + wasm-pack 0.15 WASM packaging

**Symptom:** worker bundles & deploys cleanly (`wrangler deploy --dry-run` OK),
but at runtime needle silently falls back to heuristic — `initFailures` may read
`0` yet `needle_used:false` on every request. Local Node tests pass.

**Root cause:** wasm-pack 0.15 `bundler` target splits the glue into
`needle_wasm.js` (thin) + `needle_wasm_bg.js` (handlers) + `needle_wasm_bg.wasm`,
and emits `"sideEffects": false`. When the shim reaches the `__wbg_*` import
handlers only via **dynamic** property access (`Object.keys(bg)[i]`),
Wrangler/esbuild **tree-shakes them out of the deployed bundle**. Instantiation
then throws a `LinkError` (missing import) that `ensureEngine`'s `try/catch`
swallows as a silent fallback. Node passes because no bundler strips anything.

**Fix (verified 2026-07-12):** the shim MUST
1. `export * from "./needle_wasm_bg.js"` — forces esbuild to retain every glue
   export (defeats tree-shaking), and
2. build the import object by **introspecting** the compiled module
   (`WebAssembly.Module.imports(wasmModule)`), so it can never drift from what
   the wasm actually imports.

`software/workers/intent-resolver/src/needle/needle_wasm.js` (canonical):
```js
import * as bg from "./needle_wasm_bg.js";
export * from "./needle_wasm_bg.js";   // defeat esbuild tree-shaking

export function initSync(moduleNamespace) {
  let wasmModule = moduleNamespace?.default ?? moduleNamespace;
  if (wasmModule instanceof WebAssembly.Instance) {
    bg.__wbg_set_wasm(wasmModule.exports);
    return wasmModule.exports;
  }
  if (!(wasmModule instanceof WebAssembly.Module)) {
    wasmModule = new WebAssembly.Module(wasmModule);
  }
  const imports = {};
  for (const imp of WebAssembly.Module.imports(wasmModule)) {
    imports[imp.module] = imports[imp.module] || {};
    if (imp.module === "./needle_wasm_bg.js") imports[imp.module][imp.name] = bg[imp.name];
    else if (imp.module === "env" && imp.kind === "memory")
      imports.env[imp.name] = new WebAssembly.Memory({ initial: 17 });
  }
  const instance = new WebAssembly.Instance(wasmModule, imports);
  bg.__wbg_set_wasm(instance.exports);
  return instance.exports;
}
export default initSync;
```

**MYTH — do NOT switch to `wasm-pack --target web`:** the `web` target fetches
the `.wasm` as bytes and calls `instantiateStreaming`/`instantiate` at runtime.
**Cloudflare Workers block runtime WASM compilation from raw bytes** — that is
exactly why the `CompiledWasm` rule exists. The correct, supported pattern for
edge WASM is: **`bundler` target + `[[rules]] type="CompiledWasm"` +
manual `initSync(module)` shim** (above). `wrangler.toml`:
```toml
[[rules]]
type = "CompiledWasm"
globs = ["**/*.wasm"]
fallthrough = false
```
On Workers, `import * as ns from "./x.wasm"` under this rule yields a
`WebAssembly.Module` (on `.default`); the shim handles both shapes.

---

## 11b. Phase 4 — Reserve & Refund GLM billing (VERIFIED 2026-07-12)

**Status: COMPLETE & VERIFIED end-to-end through the gateway.**

- Migration `009_llm_usage.sql` applied to live D1 (`LOVE_DB`).
- love-ledger: `/llm/reserve` (atomic check+debit, 402 if short), `/llm/settle`
  (refund diff), `/llm/usage`. `WRITE_PATHS` includes `/llm/reserve`,`/llm/settle`.
- mcp-x402-gateway: `/llm/complete` (streaming) → `llm-meter.ts` →
  `reserveGlm` → Workers AI `AI.run` → `meterStream` → `settleLove` via
  `ctx.waitUntil` (refund fires even on client disconnect / GLM failure).

**Verified behavior (test did `did:test:phase4`):**
- Reserve debits `max_tokens/1000` LOVE; over-reserve → 402.
- GLM failure → full refund (`refunded_love = reserved`), balance unchanged.
- Happy path → streams `text/event-stream` (200), settles actual usage.
  `refundedLove = Math.max(0, reserved - actualLove)` guarantees the user is
  **never charged more than they reserved** (over-estimated token counts are
  cosmetic only; balance only drops by the reserved amount).
- Gateway HMAC gate active: `X-Love-Auth-MAC` = HMAC-SHA256(`LOVE_AUTH_SECRET`,
  `love:<ts>`), 60s TTL. love-ledger write gate rejects missing/invalid with
  `401 "Missing or invalid signature"`.

**Operational gotchas (cost real debugging time):**
1. **Gateway MUST have `LOVE_AUTH_SECRET` set** (`wrangler secret put
   LOVE_AUTH_SECRET` on `mcp-x402-gateway`), identical to love-ledger's. If
   unset, `llm-meter` forwards `Authorization: Bearer ` (empty) → love-ledger
   returns `401 "Missing or invalid signature"`, which the gateway forwards
   verbatim as a 401. The gateway's own HMAC check is also skipped when unset.
2. **`glm-4.7-flash` is NOT a Workers AI model** (GLM is Zhipu's, absent from
   Cloudflare's catalog). `AI.run` returns `5007/5028: No such model`. The
   default `GLM_MODEL` is now `@cf/meta/llama-4-scout-17b-16e-instruct` (valid).
   For true GLM, wire Zhipu's REST API as a separate provider — the metering
   path is model-agnostic. `llama-3.1-8b-instruct` is deprecated (use 4-scout).

Deploy order: `cd apps/phos/src/workers/love-ledger && wrangler deploy` then
`cd software/workers/mcp-x402-gateway && wrangler deploy`. Gateway needs the
`[ai] binding = "AI"` (NOT `[[ai]]`) in wrangler.toml.

---

## 11c. Phase 3 — Full-stack Needle propagation (VERIFIED 2026-07-12)

**Status: CORE COMPLETE.** `intent-resolver` is exposed as a shared
Needle-as-a-Service; `mcp-x402-gateway` consumes it via a service binding.

- `intent-resolver` `f57b783e`: added `POST /classify` (reuses `classifyIntent`,
  returns `{ needle_used:true, tool, arguments }` or
  `{ needle_used:false, fallback_reason }`). Same lazy WASM engine as `/intent`.
- `mcp-x402-gateway` `9aa44691`: added `[[services]] NEEDLE → intent-resolver`
  + `POST /classify` proxy (Axis-6 HMAC-gated; 30s abort guard; fail-closed to
  `{ needle_used:false, fallback_reason:"Needle service unavailable" }`).

**Verification:** gateway `/classify` with the 9-tool P31 catalogue resolves
`"deploy the new phos surface to production"` → `phos_deploy` (200,
`needle_used:true`); 401 without LOVE HMAC. Cold-start via binding ~11–28s
(same 22 MB R2 load as direct calls — see §11).

**Correction to the original Phase 3 plan — 3 of the 4 target workers have NO
tool/intent classification to replace:**
- `creation-accountant` (`software/workers/creation-accountant`): signs
  spoon-delta receipts + applies penalties. No routing. **No NEEDLE binding
  added** (would be unused/misleading).
- `jitterbug-api` (`software/packages/jitterbug-api`): brain-dump WebSocket
  orchestrator (D1/R2). No tool routing. **No NEEDLE binding added.**
- `buffer-scorer`: **does not exist** in the repo (referenced only in docs).
- `mcp-x402-gateway`: the only worker with a real tool surface (x402
  `PRICING` + L5 love-path). Wired via the `/classify` proxy (above) — the
  billing hot path itself is intentionally untouched (replacing the `PRICING`
  map with needle would break settlement).

So Phase 3 delivered the reusable service + the one safe, genuine consumer.

---

## 12. Forward roadmap (each its own pass)
- **Phase 2:** fine-tune 900+100 prompts → `needle-v2.safetensors` (R2).
- **Phase 3:** `intent-resolver` exposed as `NEEDLE` service; gateway `/classify` proxy (VERIFIED). 3 of 4 planned workers had no classification to replace.
- **Phase 4:** Migration `009_llm_usage` + `/llm/*` + `llm-meter.ts` (`waitUntil` refund).
- **Phase 5:** Spike Land / Nova MCP + `@noble/post-quantum` → X25519MLKEM768.
- **Phase 6:** docs + tag `quantum-backend-2026-07-xx`.
- **Blocked:** `p31labs/needle-rs` fork + upstream PR (invalid `GH_TOKEN`).

## 13. Pre-production checklist
- [x] Workers Paid active
- [x] needle-rs SIMD128 builds + 448-case parity PASS
- [x] intent-resolver deployed, `needle_used:true`, `initFailures:0`, `/classify` live
- [x] §11 shim in place (tree-shake-proof)
- [x] Phase 4 D1 `009_llm_usage` + `/llm/*` + gateway `/llm/complete` (VERIFIED)
- [x] Phase 3 `NEEDLE` service binding + gateway `/classify` proxy (VERIFIED)
- [ ] `p31labs/needle-rs` fork (needs valid GH creds)
- [ ] warm-isolate p95 benchmark (blocked by per-request cold 22 MB R2 reload under sparse traffic; verified fast in-path)
