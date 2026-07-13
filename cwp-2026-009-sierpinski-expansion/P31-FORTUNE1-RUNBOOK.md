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
| mcp-x402-gateway | x402 pay-per-call, GLM-4.7-Flash fallback, billing integration | `POST /mcp`, `POST /agent/run` |
| agent-runtime | Cloudflare Agents SDK tool runtime (v1 built-ins: `send_notification`, `generate_care_report`) | `/health`, `/tool/send_notification`, `/tool/generate_care_report` |
| care-mesh | Privacy-preserving care data mesh (Laplace DP, Ed25519-signed submissions) | `/submit`, `/aggregates`, `/mesh` |
| p31-mcp-server | Native MCP front door for the 9 P31 tools (CWP-2026-017 B) | `/mcp`, `/health` |
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

---

## 14. CWP-2026-016 / CWP-2026-017 — Agent Runtime, Care Mesh & P31 MCP Server

Three new Workers (deployed 2026-07-12, `trimtab-signal` account) close the
CWP-2026-015/016/017 loop. All are documented in per-worker `RUNBOOK.md` files.

### 14.1 agent-runtime — `agent-runtime.trimtab-signal.workers.dev`
- **Built on:** Cloudflare Agents SDK `agents@0.17.3` (`Agent` class retained for
  durable state + D1 `sql` + scheduling; built-in tools served from entry `fetch`
  because `routeAgentRequest` only dispatches agent-protocol requests).
- **Requires:** `compatibility_flags = ["nodejs_compat"]`, `new_sqlite_classes =
  ["AgentRuntime"]`, `[[services]] LOVE_LEDGER → love-ledger`.
- **v1 built-in tools** (orchestrator routes these via `AGENT_RUNTIME` service binding):
- `send_notification` — `telegram` or `discord` (raw HTTP). Telegram needs
  `TELEGRAM_BOT_TOKEN` (`wrangler secret put`); Discord needs `DISCORD_WEBHOOK_URL`
  (incoming-webhook URL). Discord is configured for the pilot (Telegram number
  blocked) — zero-cost alternative. `email`/`push` stubbed (501) for v2.
  - `generate_care_report` — queries love-ledger `/care-score` + `/balance` via LOVE_LEDGER binding.
- **Spike Land MCP (CWP-2026-016 C):** `addMcpServer("spike-land", …)` wired in
  `onStart()`, feature-flagged behind `ENABLE_SPIKE_LAND` (`[vars]` default `"false"`),
  `SPIKE_LAND_MCP_URL` (default `https://mcp.spike.land/mcp`), `SPIKE_LAND_API_KEY`.
  **Endpoint discovered 2026-07-12 (CWP-2026-018 D):** hosted MCP is
  `https://mcp.spike.land/mcp` (Streamable HTTP; `initialize` → 401 without
  `Bearer` token). Token = Spike Land API key `sk_...` (`https://spike.land/settings?tab=api-keys`)
  or OAuth `mcp_...` (`https://mcp.spike.land/oauth/device`). Earlier guesses
  `spike.land/mcp` / `api.spike.land/mcp` are NOT the MCP host. To enable:
  `wrangler variable put ENABLE_SPIKE_LAND true` + `wrangler secret put SPIKE_LAND_API_KEY`.
- **Deploy:** `cd software/workers/agent-runtime && npx wrangler deploy`
- **Health:** `GET /health` → `{"status":"ok","service":"agent-runtime"}`

### 14.2 care-mesh — `care-mesh.trimtab-signal.workers.dev`
- **Purpose:** privacy-preserving aggregation of care data across families.
- **Reuses** the shared `love-ledger` D1 as `CARE_DB` (account is at the 10/10 D1
  Free-Plan cap — no new DB). Migration `001_care_mesh_aggregates.sql` applied via
  `wrangler d1 execute --remote --file=…`.
- **Endpoints:**
  - `POST /submit` — body `{family_did, period_start, period_end, avg_spoons,
    care_event_count, care_score, signature, pubkey}`. `signature` is an Ed25519
    signature (raw 32-byte pubkey in `pubkey`, hex) over the canonical string
    `"<family_did>|<period_start>|<period_end>|<avg_spoons>|<care_event_count>|<care_score>"`.
  - `GET /aggregates?family_did=` — raw stored rows for a family.
  - `GET /mesh?family_did=` — all *other* families' rows with **Laplace DP** noise
    applied to `avg_spoons`: ε = 0.5, sensitivity = 5 → scale = 10, clamped to `[0,5]`.
- **Sign (openssl):** `printf '%s' "<canonical>" | openssl pkeyutl -sign -inkey key.pem -rawin | xxd -p`.
- **Deploy:** `cd software/workers/care-mesh && npx wrangler deploy`
- **Health:** `GET /health` → `{"status":"ok","service":"care-mesh"}`

### 14.3 p31-mcp-server — `p31-mcp-server.trimtab-signal.workers.dev`
- **Purpose (CWP-2026-017 B):** native MCP front door exposing P31's 9 tools to any
  MCP client (Claude, Cursor, …). Also the fallback for the Spike Land integration.
- **Built on:** `agents/mcp` → `createMcpHandler` + MCP SDK `McpServer` (stateless).
- **Tools:** `oasis_execute, phos_adopt, jitterbug_run, phos_learn, phos_deploy,
  phos_watch, healer_remediate, bus_emit, phos_rollback`.
- **Routing:** each `tools/call` forwards an MCP `tools/call` to `mcp-x402-gateway`
  `/mcp` (the L3.4 bridge front door) via the `GATEWAY` service binding — the same
  backend the orchestrator uses for non-builtin tools. No new execution surface.
- **Deploy:** `cd software/workers/p31-mcp-server && npx wrangler deploy`
- **Verify:** `GET /health`; MCP `initialize` + `tools/list` returns the 9 tools.

### 14.4 End-to-end smoke (CWP-2026-017 A)
```
SECRET=43fa3d824b176cc0394d389344f867466c439aaeecc862f3e17266a968443ab7
TS=$(date +%s%3N)
MAC=$(printf 'love:%s' "$TS" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')
curl -X POST https://mcp-x402-gateway.trimtab-signal.workers.dev/agent/run \
  -H "Content-Type: application/json" -H "X-DID: test-family" \
  -H "X-Love-Timestamp: $TS" -H "X-Love-Auth-MAC: $MAC" \
  -d '{"query":"generate a care report for test-family"}'
# → classifier:glm, plan:[generate_care_report], ok:true (200), contract_id set
```

### 14.5 Ops follow-ups (manual, tokens not in session)
- `wrangler secret put TELEGRAM_BOT_TOKEN` on `agent-runtime` (enables notifications).
- `wrangler secret put CF_API_TOKEN` on `secret-rotator` (Secrets Store Write perm).
- Spike Land: discover confirmed endpoint/auth, then `ENABLE_SPIKE_LAND="true"` +
  `wrangler secret put SPIKE_LAND_API_KEY` on `agent-runtime`.

- [ ] warm-isolate p95 benchmark (blocked by per-request cold 22 MB R2 reload under sparse traffic; verified fast in-path)
