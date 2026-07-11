# P31 Automation Engine — Conceptual Architecture

**Version:** v1.0.0
**Date:** 2026-07-11
**Status:** Shipped, verified, scaling

---

## 1. Overview

The P31 Automation Engine is a self‑similar, adaptive orchestration system that spans the entire lifecycle of the P31 Digital Commonwealth:

- **Build & Deploy** — static sites, Cloudflare Workers, D1 databases, Pages
- **Runtime Adaptation** — UIG Adaptive Exocortex, Cognitive Passport, spoon‑aware UI
- **Quality & Compliance** — WCAG axe‑runner, TRIPER certification, health monitoring
- **Monetization** — x402 payment middleware, Cloudflare Gateway, MCP tool pricing
- **Ecosystem Expansion** — MCP server tooling, A2UI integration, open‑source core

The engine is designed with the **Fortune 1** principles: **decouple, stage, preserve, verify**.

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER / OPERATOR LAYER                                                      │
│ (CWP directives, grant submissions, user testing, secret rotation)          │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORCHESTRATION LAYER                                                        │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                    │
│ │  CWP Swarm    │ │  TRIPER Cert  │ │  CI/CD Gates  │                    │
│ │  (Parallel    │ │  (12/12, <24h)│ │  (axe blocking│                    │
│ │   Agents)     │ │                │ │   on PRs)     │                    │
│ └───────────────┘ └───────────────┘ └───────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│ BUILD & DEPLOY LAYER                                                       │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                    │
│ │  pnpm Workspace│ │  Astro + Vite │ │  Wrangler     │                    │
│ │  (73 projects) │ │  (static apps)│ │  (Workers)    │                    │
│ └───────────────┘ └───────────────┘ └───────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│ RUNTIME LAYER                                                             │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                    │
│ │  UIG Adaptive │ │  Cognitive    │ │  MCP Servers  │                    │
│ │  Exocortex    │ │  Passport     │ │  (6 servers,  │                    │
│ │               │ │  (v4.1)      │ │  115 tools)    │                    │
│ └───────────────┘ └───────────────┘ └───────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│ MONETIZATION LAYER                                                        │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                    │
│ │  x402 Gateway │ │  Cloudflare   │ │  LOVE Ledger  │                    │
│ │  (Base Sepolia)│ │  Monetization │ │  (D1 hash-   │                    │
│ │               │ │  Gateway       │ │   chain)       │                    │
│ └───────────────┘ └───────────────┘ └───────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│ MONITORING LAYER                                                          │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                    │
│ │  status.p31ca │ │  axe-runner   │ │  TRIPER Logs  │                    │
│ │  (cron health)│ │  (WCAG 2.2)  │ │  (cert json)  │                    │
│ └───────────────┘ └───────────────┘ └───────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Components

### 3.1. Orchestration Layer
- **CWP Swarm** — parallel agent execution (CWP‑2026‑007). The orchestrator decomposes a CWP into axes, dispatches specialist agents, merges outputs, and verifies success criteria. (Simulated in the engine script, real in the CWP process.)
- **TRIPER Cert** — 6‑axis MVP certification (Task · Resilience · Interface · Purity · E2E · Regression). Runs via `node tests/triper/triper-runner.mjs --cert`; gate: 12/12 suites pass, cert <24h.
- **CI/CD Gates** — axe‑runner blocks PRs on critical/serious WCAG violations (`continue-on-error: false` in `.github/workflows/axe-runner.yml`); `fortune-test-full.yml` runs E2E/visual/a11y tests.

### 3.2. Build & Deploy Layer
- **pnpm Workspace** — 73 projects. The Fortune‑1 pipeline lives in `apps/p31ca/package.json`:
  - `prebuild:write` → `scripts/ops/ingest-glass-probes.mjs`, `scripts/build-fleet-entities.mjs`
  - `prebuild:verify` → 8 `verify-*.mjs` scripts
  - `build` → `astro build`
  - `postbuild:verify` → 3 `verify-*.mjs` scripts
- **Astro + Vite** — static sites (PHOS, p31ca, phosphorus31, willow) built with `astro build` and `vite build`.
- **Wrangler** — Cloudflare Workers for auth, status, love‑ledger, jitterbug‑api, and the new `mcp-x402-gateway`.

### 3.3. Runtime Layer
- **UIG Adaptive Exocortex** — `@p31/interface-generator` generates `InterfaceDescription` from Cognitive Passport + view data + spoons. Rendered by `InterfaceRenderer` (React) or `BondingUIGSurface`. Crisis mode (spoons 0) shows breathing overlay only.
- **Cognitive Passport (v4.1)** — machine‑schema with identity, cognition, accessibility, baselineSpoons, did. Audience matrix (18 groups × 12 profiles) controls data exports.
- **MCP Servers** — 6 servers, **115 tools**:

| Server | Location | Tools |
| :--- | :--- | :--- |
| Oasis CLI | `cli/mcp-server.js` | 11 |
| Component Registry | `cli/component-registry.js` | 5 |
| LOVE Ledger | `cli/love-registry.js` | 3 |
| PHOS Forge | `tools/phos-forge/mcp-server.mjs` | 29 |
| Cognitive Prosthetic | `cli/cognitive-prosthetic.js` | 47 |
| Cognitive Comms | `cli/cognitive-comms.js` | 20 |
| **Total** | | **115** |

All are JSON‑RPC over stdio; zero new deps; tested offline.

### 3.4. Monetization Layer
- **x402 Gateway** — custom Worker (`mcp-x402-gateway`) implementing `x402-hono` + `@coinbase/x402` on Base Sepolia testnet. Provides `paymentMiddleware`, `facilitator()` verify, and per‑tool pricing. Serves as fallback while Cloudflare Monetization Gateway waitlist clears.
- **LOVE Ledger** — D1 hash‑chain with court‑admissible audit logs, append‑only, timestamped, verifiable.

### 3.5. Monitoring Layer
- **status.p31ca.org** — D1 cron Worker checks health of all services (phos, gateway, p31ca, willow, bonding, love‑ledger, status) every 15 minutes; reports degraded/up status.
- **axe‑runner** — Playwright + axe‑core audits `https://phos.p31ca.org` (and other faces) for WCAG 2.2 AAA. Blocking on critical/serious violations.
- **TRIPER Logs** — JSON certs stored in `tests/triper/logs/`; fresh cert <24h.

---

## 4. Data Flow

```
User → Cognitive Passport (v4.1) → UIG Generator → InterfaceDescription → Renderer → Adaptive UI
      │
      ├─ Spoon slider → data‑spoons → motion scaling / crisis mode
      ├─ Audience filter → export profiles → MCP tool responses
      └─ LOVE ledger → on‑chain attestations → trust/reputation

MCP Call → cognitive-prosthetic.js → tool handler → response (text/json)
          │
          └─ If paid tool → x402 middleware → Payment‑Signature header → facilitator verify → return response

Deploy → git push → CI (axe, TRIPER) → wrangler deploy → status.p31ca.org → health check
```

---

## 5. Deployment Pipeline (Fortune 1)

```
prebuild:write
├─ scripts/ops/ingest-glass-probes.mjs
├─ scripts/build-fleet-entities.mjs
└─ scripts/generate-about-pages.mjs        (npm run hub:about:generate)

prebuild:verify
├─ verify‑p31‑style
├─ verify‑style‑alignment
├─ verify‑lattice‑oracle
├─ verify‑oqe‑icosa
├─ verify‑registry‑app‑urls
├─ verify‑public‑app‑shell
├─ verify‑delta‑hiring
└─ verify‑education

astro build

postbuild:verify
├─ verify‑p31ca‑dist
├─ verify‑internal‑hub‑links --strict
└─ verify‑synergetic

axe‑runner (CI, blocking on critical/serious)
```

All writers and verifiers are local‑only (no network). The pipeline is **decoupled** from org‑level checks (garden, creator‑economy, fleet) which run as optional `verify:org`.

---

## 6. Automation Patterns (Sierpinski Scaling)

| Layer | Pattern | Scaling Mechanism |
| :--- | :--- | :--- |
| Build | Stage separation | Writers run once, verifiers run after build; org checks decoupled |
| Deployment | Environment parity | `--commit-dirty=true` for Pages; `--env` for Workers |
| Testing | TRIPER cert | Fresh cert every 24h; CI automation |
| Accessibility | axe‑runner | Blocking on critical; failing CI on new violations |
| MCP tools | Domain‑specific servers | Cognitive Prosthetic (47), Comms (20), PHOS Forge (29) |
| Monetization | x402 fallback | Worker ready; Gateway waitlist progress |

---

## 7. Future Directions (L4)

- **L4.1** — Expand MCP tools to 100+ (already 115, target 200)
- **L4.2** — A2UI v0.9 integration (schema mapping drafted, renderer pending SDK)
- **L4.3** — A2UI renderers for Flutter/Lit (external ecosystems)
- **L4.4** — Open‑source `@p31/interface-generator` (publish to npm/GitHub)
- **L4.5** — UIG API documentation for external developers
- **L4.6** — Cognitive‑domain expansion (memory, emotion, context‑switching)

---

## 8. Verification Checklist (Current)

- [x] All 4 apps deployed & healthy (auth, status, design‑hub, bonding)
- [x] TRIPER cert 12/12 green (cert <24h)
- [x] axe‑runner blocking on critical/serious (0 blocking violations)
- [x] pnpm install works (73 projects)
- [x] 115 MCP tools across 6 servers
- [x] Cognitive Passport v4.1 schema, audience matrix, crypto
- [x] UIG Adaptive Exocortex integrated into PHOS, p31ca, bonding, willow, phosphorus31
- [x] x402 Worker scaffolded, version pins fixed, runbook ready
- [x] L1.2/L1.3 NGI proposals drafted (€15k + €25k)
- [ ] L1.1 secrets rotated (user)
- [ ] L1.4 NGI submitted (user, Aug 1)
- [ ] L2.x user testing (user)

---

## 9. Conceptual Summary

The P31 Automation Engine is **not a single monolithic system** — it is a **fractal of self‑similar patterns**:

- **Decouple** the scary infrastructure from the adaptive experience.
- **Stage** operations into write/build/verify phases.
- **Preserve** the live deploys while refactoring.
- **Verify** every change with automated gates (axe, TRIPER, health checks).

The engine is built to **scale** via the Sierpinski Expansion: each axis (funding, users, monetization, ecosystem) replicates the same core pattern at a larger scale. The code is written, the tests are green, and the foundation is stable.

---

*P31 Labs | 501(c)(3) Nonprofit | EIN 42‑1888158*
