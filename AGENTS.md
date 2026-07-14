# P31 Labs — Agent Instructions

## Project Overview
P31 Labs builds open-source assistive technology for neurodivergent individuals. Monorepo at `/home/p31/P31-local-workspace`.

## Research Findings (July 2026)

Deep-web verification of the ecosystem's architecture, standards, and published
packages against source code and authoritative registries. Below is the grounded
verdict — a few overstated claims from earlier drafts have been corrected.

### Standards (all verified)
- **ERC-5192** — confirmed ([eips.ethereum.org/EIPS/eip-5192](https://eips.ethereum.org/EIPS/eip-5192)) as a standard.
  **Correction (2026-07-13, CWP-2026-023/025 audit):** no P31 contract is actually ERC-5192
  compliant. `LOVESBT.sol` (Base Sepolia `0x521cAD1b54CDDB2B6B53a30EBe050C429F9c6C55`) is
  soulbound **by convention only** — `transfer`/`transferFrom` revert — but it does NOT implement
  the ERC-5192 interface (`locked()`, `Locked` event, `supportsInterface(0xb45a3c0e)` are absent).
  `CognitivePassport.sol` does **not exist** in the repo and is **not deployed**; the address
  `0xa4bfb18fa7c5265e25b9a8915d1196a18d52299e` is unverified. The "Cognitive Passport" is a
  local client-side document in PHOS (`apps/phos/src/surfaces/PassportSurface.tsx`), not an on-chain token.
  `GenesisSpark.sol` is soulbound by convention but does not implement the full ERC-5192 interface.
- **DID Core v1.0** — [W3C Recommendation](https://www.w3.org/TR/did-core/); IANA registers `did.json`.
- **Sovereign DIDs (P31)** — primary `did:key` (Ed25519, Web Crypto) for on-chain care proofs;
  plus a quantum-safe **`did:jwk`** (ML-DSA-65, encoded per IANA JOSE RFC 9964 as `kty:AKP`, **not**
  `crv`). Both bind to an ETH address in `love-ledger`'s self-signed `identity_registry`. PHOS
  **PQC Keys** surface (`/pqc-keys`) generates ML-KEM-768 + ML-DSA-44 + ML-DSA-65. (CWP-2026-025/026)
  - **ML-DSA-65 care-proof co-signature (CWP-2026-027 A):** `ledger-bridge` `/care-proof` accepts an
    optional `mldsa65_sig` (standard base64 of the 3309-byte ML-DSA-65 sig over the same canonical
    `proof|…` message). Verified via `@noble/post-quantum` `ml_dsa65.verify` against
    `identity_registry.mldsa65_pub`. If the DID has no ML-DSA-65 pub on file it falls back to Ed25519;
    if it does, the co-signature is required. PHOS **Care SBT Mint** has a "Post-Quantum Co-Signature"
    toggle that signs from the PQC vault and (re-)registers `mldsa65_pub`.
  - **SD-JWT care credentials (CWP-2026-027 B):** `ledger-bridge` issues/verifies Selective
    Disclosure JWTs (RFC 9901) pinned to **draft-ietf-oauth-sd-jwt-vc-17** (`typ:dc+sd-jwt`,
    `_sd_alg:sha-256`), Ed25519-signed, SHA-256 (`@noble/hashes`) over salted disclosures. Endpoints:
    `POST /credential/issue` and `POST /credential/verify`. Used by the pilot-dashboard "Active SD-JWTs" KPI.
- **WCAG 2.2** — [W3C Recommendation](https://www.w3.org/TR/WCAG22/) (2024-12-12);
  `data-spoons` motion scaling, CrisisMode, skip links, `prefers-reduced-motion` are
  **verified in code**. The automated axe-core audit runner (`scripts/audit-wcag.mjs`)
  **exists** in the repo and is **wired into CI** via `axe-runner.yml` (continue-on-error: false).
- **WebAuthn** — IANA Well-Known URI registry registers `webauthn` (W3C, 2026-01-23).
- **MCP** — real protocol ([modelcontextprotocol.io](https://modelcontextprotocol.io)).
- **GNU Taler** — real GNU project ([taler.net](https://taler.net)); P31 integration is **deployed** — `taler-exchange-bridge` is wired to `exchange.demo.taler.net` (see `docs/TALER_INTEGRATION.md`).
- **A2A AgentCard** — `agent-card.json` is the **IANA-registered** agent-discovery
  well-known (A2A / Linux Foundation, 2025-08-01). `agent-card.json` is served at
  `apps/p31ca/public/.well-known/agent-card.json` with valid A2A schema; legacy
  `agents.json` is retained for backward compatibility.

### Correction: earlier false claim
The earlier claim that "IETF is standardizing `/.well-known/agents.json`" is
**FALSE** — IANA has no such entry. The correct registered standard is
`agent-card.json`.

### MCP servers (inventory)
There are **4 in-repo MCP servers** (not 3 as previously stated), all hand-rolled JSON-RPC:
| Server | File | Tools |
|--------|------|-------|
| Oasis CLI | `cli/mcp-server.js` | 11 |
| Component Registry | `cli/component-registry.js` | 5 |
| LOVE Ledger | `cli/love-registry.js` | 3 |
| PHOS Forge | `tools/phos-forge/mcp-server.mjs` | 29 |
| **Total** | | **~46** |

### Published packages
- **`andromeda-cli`** (1.1.2) — in-repo at `cli/`, published on npm.
- **`@p31/agent-engine`** (0.1.0-alpha.0) — in-repo at `software/packages/agent-engine/`.
- **`@p31/game-engine`** (0.1.0-alpha.0) — in-repo at `software/packages/game-engine/`.
- **`@p31/cli` (2.0.0)** — **PHANTOM**: referenced in docs but has **no in-repo implementation**.
  This is a documentation artifact; treat as unverified.

### Court-admissible care records
The deployed **simple** LOVE ledger worker (`apps/phos/src/workers/love-ledger/index.ts`)
**does** implement a SHA-256 court-admissible hash chain (`love_chain` table,
`prev_hash`/`entry_hash`, `GET /chain`, `GET /export`). Additional hash-chained
court-admissible records also exist in `software/workers/legal-versioning.ts` and
`software/sovereign-justice/src/evidence-vault.ts`. (Earlier drafts falsely claimed
the LOVE ledger had no hash chain — that was only true of the *undeployed monolith*.)

### Smithery
12,148+ MCP servers (the earlier "6,000+" figure was understated).

### Kilo.ai
Real open-source agent (IDE/CLI/Cloud) with MCP support.

See `GLOBAL_IMPACT_REPORT.md` for the full citation-backed report.

## Architecture
- **Stack:** Cloudflare Workers + Pages, Astro, React 19, Tailwind, Vite, pnpm workspaces
- **Frontend apps:** `apps/phos` (phos.p31ca.org), `apps/willow` (willow.p31ca.org), `apps/bonding` (bonding.p31ca.org), `apps/p31ca` (p31ca.org), `apps/phosphorus31` (phosphorus31.org)
- **Backend workers:** `apps/gateway` (gateway.p31ca.org), `apps/status` (status.p31ca.org), `apps/auth` (p31-auth), `software/cloudflare-worker/llm-proxy` (p31-llm-proxy)
- **Core data/orchestration workers:** `love-ledger` (deployed ledger), `jitterbug-api` (Ambient Exocortex brain-dump orchestrator — shares the `love-ledger` D1), `care-api`, `fhir`, `taler-exchange-bridge`, `taler-bridge-billing` (x402 pay-per-call). See `software/packages/jitterbug-api/README.md`.
- **Agent / mesh workers (CWP-2026-015/016/017):** `agent-runtime` (Agents SDK tool runtime — `send_notification` + `generate_care_report`; `agent-runtime.trimtab-signal.workers.dev`), `care-mesh` (privacy-preserving care data mesh, Laplace DP + Ed25519-signed; `care-mesh.trimtab-signal.workers.dev`), `p31-mcp-server` (native MCP front door for the 9 P31 tools; `p31-mcp-server.trimtab-signal.workers.dev`). `mcp-x402-gateway` orchestrates tool routing. `ledger-bridge` (LIVE on-chain attestation relay to Base Sepolia contracts; `ledger-bridge.trimtab-signal.workers.dev`). See each worker's `RUNBOOK.md`.
- **Shared packages:** `packages/design-system`, `packages/auth`
- **Free Plan limits:** 100k req/day, 200k log events/day, 10 D1 databases, 5 cron triggers

## Design System

Visual identity, component guidelines, and neuroinclusive invariants are encoded in [`DESIGN.md`](./DESIGN.md) at the repo root (Google Labs `DESIGN.md` spec). When generating or modifying UI, agents MUST read `DESIGN.md` and must not violate its hard invariants:
- **Spoon-aware motion** — all animation/transition respects the `data-spoons` (0–5) attribute; motion is fully disabled at `spoons` 0–1.
- **Glassmorphism** — elevated surfaces use `.glass-panel` / `.glass-card` (`backdrop-filter: blur(12px)`, 24px radius).
- **Crisis Mode** — at `spoons === 0` no UI chrome may render; only the breathing overlay + exit control (Escape / "I'm ready").
- **Single accent** — `quantum-cyan` is the only primary accent; never pure white/black text or backgrounds.

## Agent Tooling

### CLI Agent Mode
Run `andromeda --agent` (or `-a`) for JSON output of session state, design tokens, and capabilities. Works in any context (TTY or non-TTY).

### CLI MCP Server
Agents can invoke CLI commands via MCP (Model Context Protocol):
```bash
node cli/mcp-server.js
```
Reads JSON-RPC from stdin, writes to stdout. 11 tools: `oasis_status`, `oasis_save`, `oasis_theme`, `oasis_mode`, `oasis_clear`, `oasis_export_log`, `oasis_sandbox_clear`, `oasis_notify`, `oasis_add_todo`, `oasis_toggle_todo`, `oasis_execute`.

### Edge-Aware Commands

The CLI exposes edge-aware commands that work in both TTY and headless environments. All support `--agent` for JSON output:

```bash
andromeda status                  # Health check (gateway, phos, p31ca)
andromeda surfaces                # List PHOS surfaces (23 available)
andromeda love status             # LOVE ledger status (requires LOVE_LEDGER_URL env)
andromeda love balance <userId>   # LOVE balance for a user
andromeda love sync               # Sync local LOVE state
andromeda deploy --app phos       # Build + deploy to Cloudflare Pages/Workers
```

`andromeda deploy` requires `CLOUDFLARE_API_TOKEN` environment variable. Apps: `phos`, `p31ca`, `phosphorus31`, `bonding`, `willow`, `gateway`.

`andromeda love status` requires `LOVE_LEDGER_URL` environment variable (defaults to `https://love-ledger.p31ca.org`).

### CLI Global Installation

Agents can install the `andromeda` CLI globally via npm, making it available in any environment (local shell, CI/CD, GitHub Actions) without cloning the monorepo:

```bash
npm install -g andromeda-cli
andromeda --agent
```

The CLI exposes eight MCP servers (137 tools):
- `node cli/mcp-server.js` — Oasis CLI tools (11 tools)
- `node cli/component-registry.js` — Component Registry tools (5 tools)
- `node cli/love-registry.js` — LOVE Ledger tools (4 tools: love_status, love_balance, love_sync, love_anchor)
- `node tools/phos-forge/mcp-server.mjs` — PHOS Forge tools (29 tools)
- `node cli/cognitive-prosthetic.js` — Cognitive Prosthetic tools (47 tools: temporal grounding, executive function, sensory adaptation, cognitive load, communication, crisis detection, memory scaffolding)
- `node cli/cognitive-comms.js` — Cognitive Comms tools (20 tools: tone, replies, boundaries, accommodations, agendas)
- `node cli/marge-server.js` — MARGE Design Expert tools (10 tools: design compliance audit, glass/spoons/WCAG/accent checks, contrast ratio, auto-fix)
- `node cli/bob-server.js` — BOB Structural Expert tools (10 tools: structural entropy, service graph, schema drift, contract audit, state machines, config topology)

### P31 Automation Engine

The `cli/p31-automation-engine.js` orchestrator codifies the Fortune 1 pipeline + Sierpinski Expansion into one runnable tool (zero deps, CommonJS). It is the unified nervous system for the CWP swarm, build/deploy, testing, validation, MCP audits, and health checks.

```bash
node cli/p31-automation-engine.js mcp      # spawn all 8 servers, count tools (137)
node cli/p31-automation-engine.js triper   # node tests/triper/triper-runner.mjs --cert
node cli/p31-automation-engine.js build    # pnpm -C apps/p31ca run build (non-fatal)
node cli/p31-automation-engine.js test     # pnpm run test:unit (vitest unit suite, non-fatal)
node cli/p31-automation-engine.js deploy   # wrangler deploy --dry-run (x402 worker, non-fatal)
node cli/p31-automation-engine.js validate # TRIPER cert + L3.2 x402 worker validator
node cli/p31-automation-engine.js monitor  # fetch status.p31ca.org/health per service
node cli/p31-automation-engine.js swarm [id]  # [SIMULATED] CWP agent dispatch
node cli/p31-automation-engine.js all      # run everything + print status table
```

`cli/validate-l3.2.js` automates the `cwp-2026-009-sierpinski-expansion/L3.2-VALIDATION-RUNBOOK.md` steps (install hygiene → worker install → `tsc --noEmit` → `wrangler deploy --dry-run`) and prints a copy-paste report block. It requires registry access and runs on the operator machine.

Conceptual architecture: `docs/P31_AUTOMATION_ENGINE.md`.

### x402 MCP Bridge (L3.4)

The L3.2 x402 Worker cannot spawn children on Workers runtime, so a supervised Node
service bridges the 4 stdio MCP servers to the edge. The Worker (L3.2) binds to
it via service binding / `BRIDGE_URL` and is the 402 gate; the bridge is pure
routing (initialize / tools/list fan-out / tools/call by name).

```bash
cd software/workers/mcp-x402-gateway/bridge
node --test src/__tests__/bridge.test.mjs   # 7/7 green, 48 tools routed
npm start                                     # POST /mcp on :8788, GET /health
```

- `src/backends.mjs` — 4 backend configs (oasis/registry/love stream, phosforge batch).
- `src/stdio-client.mjs` — `StdioBackend` supervisor (crash → exp backoff, max 5 → unhealthy).
- `src/router.mjs` / `src/index.mjs` — router + HTTP edge.
- Runbook: `cwp-2026-009-sierpinski-expansion/L3.4-RUNBOOK.md`.

### L5 Creation Economy (intent-driven worker model)

Paradigm shift from **extractive** tollbooth pricing (per-call) to **co-creative**
value-based settlement: the worker settles on *value created for the user*
(spoons saved, care generated), not value extracted. Concept:
`cwp-2026-009-sierpinski-expansion/L5-CREATION-ECONOMY.md`; CWP: `CWP-2026-010-creation-economy.md`.

- `software/workers/intent-resolver/` — `POST /intent` parses intent (via
  `@p31/interface-generator` `generateInterfaceFromIntent`) and returns a
  **Creation Quote** (spoons_saved, care_value, love/usdc amounts). Spoon state
  is client-measured (`data-spoons`); there is **no** edge D1 spoon store.
- `software/workers/creation-accountant/` — `POST /receipt` measures the
  pre/post `data-spoons` delta (renderer-reported, trustless) and writes a
  hash-chained **creation receipt** to the LOVE ledger `love_chain` (D1 batch).
- `software/workers/mcp-x402-gateway/` — `X-Creation-Unit: love|usdc`
  routing layer + `POST /mcp` forwards to the L3.4 bridge. `love` path
  checks `LOVE_LEDGER` balance and issues a blind-sig placeholder.
- `apps/phos/src/workers/love-ledger/` — `/withdraw` issues blind-signed
  LOVE credits (GNU Taler placeholder) atomically (D1 batch). Migration
  `003_creation_accounting.sql` adds `love_chain.metadata` + `creation_penalties`.
- Settlement is **dual / user-choice**: LOVE care-credit (non-extractive,
  two-pool vesting) or x402 USDC. All Workers use **Web Crypto**
  (no Node `crypto`) and **D1 batch** for atomicity.
- **Settlement hardening (optimization pass):** `creation-accountant` signs
  each receipt with **Ed25519** (`RECEIPT_SIGNER_PRIVATE_KEY`) into
  `love_chain.signature`; `love-ledger /withdraw` verifies it
  (`RECEIPT_SIGNER_PUBLIC_KEY`). LOVE-path requests on `mcp-x402`
  require an HMAC-SHA256 (`LOVE_AUTH_SECRET`, 60s TTL) → 401 on
  miss/expiry. Spoon-delta replay is blocked via `consumed_nonces`
  (migration `004`). Intent quotes are edge-cached via `caches.default`.
  GNU Taler blind signatures are **LIVE** in production via the CBS WASM
  build (`BLIND_MODE='taler'`, `taler_cs.wasm`, delivered as Cloudflare
  CompiledWasm). The earlier staging-only mock is fail-closed and no
  longer used. See `AXIS-1_FINAL_DELIVERABLE.md` and
  `plans/P31-WP-PQ-2026-001_PRE_POST_QUANTUM_CRYPTO_SECURITY.md`.

### LOVE Ledger MCP Server

Agents can query the LOVE ledger state via MCP:

```bash
node cli/love-registry.js
```

Tools:

| Tool | Description |
|------|-------------|
| `love_status` | Get ledger status (total LOVE, care_score, pools, vesting) |
| `love_balance` | Get LOVE balance for a user |
| `love_sync` | Sync local LOVE state with the cloud ledger |

### PHOS Capabilities
Agents can discover PHOS endpoints via `/.well-known/agents.json`. Gateway exposes:
- `POST /ai/chat` — conversational AI (Bearer auth required)
- `POST /v1/chat/completions` — OpenAI-compatible completions (Bearer auth required)
- `POST /transcribe` — voice transcription (Bearer auth required)
- `GET /api/phos/surfaces` — list available PHOS surfaces (public)

### Design Injection
PHOS's LLM system prompt includes design tokens from `DESIGN.md` and adapts to the user's current spoon level (0–5).

## Build & Deploy Commands

### phos (Astro + React)
Build: `cd apps/phos && bash node_modules/.bin/astro build` (Node 24 needs shell wrapper)
Deploy: `cd apps/phos && npx wrangler pages deploy dist --project-name phos --commit-dirty=true`

### p31ca (Astro static)
Build: `cd apps/p31ca && bash node_modules/.bin/astro build`
Deploy: `cd apps/p31ca && npx wrangler pages deploy dist --project-name p31ca --commit-dirty=true`

### phosphorus31 (Astro hybrid)
Build: `cd apps/phosphorus31 && npm run build`
Deploy: `cd apps/phosphorus31 && npx wrangler pages deploy dist --project-name phosphorus31-org --commit-dirty=true`

### bonding (Vite React SPA)
Build: `cd apps/bonding && npm run build`
Deploy: `cd apps/bonding && npx wrangler pages deploy dist --project-name bonding --commit-dirty=true`

### willow (Vite React SPA)
Build: `cd apps/willow && npm run build`
Deploy: `cd apps/willow && npx wrangler pages deploy dist --project-name willow --commit-dirty=true`

### gateway
Deploy: `cd apps/gateway && npx wrangler deploy`

### status
Deploy: `cd apps/status && npx wrangler deploy`

### auth
Deploy: `cd apps/auth && npx wrangler deploy`

### llm-proxy
Deploy: `cd software/cloudflare-worker/llm-proxy && npx wrangler deploy`

### counterscale
Build server: `cd apps/counterscale/packages/server && npm run build`
Deploy: `cd apps/counterscale/packages/server && npx wrangler deploy`

## Infrastructure

### Service Bindings
- `gateway.phos_ai_proxy` → `p31-llm-proxy` (LLM routing)
- Gateway routes: `/api/*` (auth-protected), `/ai/chat` (public, rewrites to LLM proxy)

### Cron Triggers (5 max on Free Plan — account currently uses all 5)
- p31-status: `*/15 * * * *`
- command-center: `*/5 * * * *`
- p31-cortex: `0 7,18 * * *`
- counterscale: `0 2 * * *` (daily rollups)
- phos-backup: `0 2 * * *` (daily LOVE ledger cold snapshot to R2)

> Note: the deployed `love-ledger` worker has a `scheduled()` cold-archive handler
> but **no `[triggers]` cron** (the 5-slot Free-Plan cap is full). Its archive is
> covered by `phos-backup`'s daily cron instead. The earlier `love-ledger: 0 */6`
> entry was removed to free a slot.

### Observability
- Built-in: `[observability] enabled = true` in wrangler.toml
- Axiom OTLP: `https://api.axiom.co/v1/logs` (dataset: p31-workers)
- Sentry: phos, bonding, gateway, auth (via @sentry/react or @sentry/cloudflare)

### D1 Databases (10 of 10 used — at Free Plan cap)
- p31-status-db, p31-auth, p31-cortex, love-ledger (`592e3e2e-…`), k4-cage-db, sovereign-justice-db, contracts-db, governance-db, buffer-worker-db, hrv-coherence-db
- The `love-ledger` D1 (`592e3e2e-3203-4e0a-8342-9e85215ec8a6`) is **intentionally shared** by care-api (`CAPITAL_DB`), fhir (`DB`), jitterbug-api (`DB`), sovereign-justice (`LOVE_D1`), and care-mesh (`CARE_DB`) to stay within the 10-DB Free-Plan cap. `hrv-coherence-db` is the only freeable slot.

### Analytics
- Counterscale at analytics.p31ca.org (self-hosted, Analytics Engine)
- Tracking: `<script defer src="https://analytics.p31ca.org/tracker.js" data-domain="SITE">`

### Auth
- DID:key cryptographic signing/verification exists for ledger writes (`apps/phos/src/workers/love-ledger`), but the dedicated DID:key login app/package (`apps/auth`, `packages/auth`) is NOT yet implemented (scaffolds only)
- JWT session in localStorage under `p31-auth`
- Write routes on gateway require `Authorization: Bearer <JWT>`

## Counterscale Setup Notes
- Analytics Engine dataset: `metricsDataset`, binding: `WEB_COUNTER_AE`
- R2 bucket: `counterscale-daily-rollups`
- Tracker package: `apps/counterscale/packages/tracker`
- Build tracker first: `cd apps/counterscale/packages/tracker && npm run build`
- Then copy: `cp ../tracker/dist/loader/tracker.js ../server/public/`
- Then rebuild server: `cd apps/counterscale/packages/server && npm run build`

## GitHub Actions Secrets (Manual — API token lacks secrets scope)
These must be added at https://github.com/p31labs/P31-local-workspace/settings/secrets/actions:
- `CLOUDFLARE_API_TOKEN` — Wrangler OAuth token (`cfoat_...` from `~/.wrangler/config/default.toml`) or Cloudflare API Token with Workers + Pages edit
- `SENTRY_DSN` — Sentry project DSN (same value as `wrangler secret put SENTRY_DSN`)

## Communication Style
- Direct. Skip preamble. Output code and commands.
- Never use submarine, naval, or military metaphors.
- Spoon-aware UI (0–5 scale via `data-spoons` attribute) mandatory for all surfaces.

## WCAG 2.2 AAA Compliance (Roadmap — Phase 2, CWP-2026-006)
- **Touch targets:** ≥48×48px (WCAG 2.5.8 Enhanced) across all apps (bumped from 44px).
- **Contrast ratios:** Current contrast meets AA in places (≥4.5:1), but `text-white/30` usage on dark backgrounds is being removed; ≥7:1 AAA pending.
- **Focus indicators:** Global `:focus-visible` outline (2px `var(--phos-primary)`, offset 2px).
- **Skip navigation:** The skip-link (`<a href="#main-content" class="skip-link">`) is present in p31ca, bonding-soup, PHOS, phosphorus31, and willow shells.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` sets all durations to 0ms (`motion.css`). `data-reduced-motion` attribute fallback. Crisis mode (spoons=0) also disables motion.
- **ARIA labels:** All icon buttons have `aria-label`, all SVGs have `aria-hidden="true"`. Navigation has `role="navigation"` + `aria-label`. Chat messages use `aria-live="polite"`.
- **Voice input:** `VoiceInputButton` detects `isSupported`, shows disabled state with "Voice input unavailable" when unsupported. Dual engine (local WASM + edge fallback).
- **Keyboard navigation:** Tab order logical (left→right, top→bottom). Enter/Space triggers buttons. Escape closes magic drawer (handled in `PHOSMagicDrawer`).

## Testing

### Test suites
- `tests/unit/mcp/mcp-servers.test.ts` — 22 MCP tests (PHOS Forge batch stdin, Oasis/Registry/LOVE streaming). Run: `npx vitest run tests/unit/mcp/`
- `tests/unit/triper/uig-generate.triper.test.ts` — 22 TRIPER tests for `generateInterface` + `generateInterfaceFromIntent`. Run: `npx vitest run --config vitest.triper.config.ts`
- `tests/mvp/<suite>/<suite>.triper.test.mjs` — 12 rebuilt MVP TRIPER suites (bonding, cars, personal, hub, mesh, simplex, email, epcp, geodesic, p31ca-user-sentinel, mesh-integrity, systems-integrity), 7 axis-tests each. Run all: `node tests/triper/triper-runner.mjs --cert`
- `vitest.triper.config.ts` — separate config covering `tests/unit/triper/**` + `tests/mvp/**` (TRIPER tests use direct source imports, not workspace package resolution)

### Key patterns
- **PHOS Forge is a batch-mode server** — reads all stdin until `end` event, not line-by-line. Tests must `spawn`, wait for `close`, then close stdin.
- **Oasis/Registry/LOVE are streaming** — write JSON-RPC per line, read per line.
- **`isValidDescription()`** in TRIPER tests validates structure + non-empty widgets (MVP suites seed `viewData` with generator-recognized keys so the description carries domain widgets).
- **Crisis mode** (`spoons=0`) sets `crisisMode: true` but still produces widgets — the UI layer (CrisisOverlay) handles rendering, not the generator.

### Environment
- `.env.example` in repo root documents all required env vars (no real secrets).
- `tests/triper/` has TRIPER cert runner (monorepo edition) and cert fixtures.
