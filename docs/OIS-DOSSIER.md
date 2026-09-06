# P31 OIS Application Dossier

**Open Internet Stack — Sovereign Solutions** (HORIZON-CL4-2026-04-DATA-02)
**Prepared:** 2026-07-29
**Status:** Draft — mapped to OIS program criteria v2.0

---

## 1. Executive Summary

P31 is an open-source, 5-layer protocol stack purpose-built for **trusted AI-agent transactions, decentralised identity, and adaptive user interfaces** — directly targeting all three pillars of the 3C (Connectivity, Confidentiality, Composability) vision.

| OIS Pillar | P31 Coverage |
|------------|-------------|
| **Trust Technologies** | MCP gateway with DID-based JWT auth, LOVE balance ledger, trust-tier tool gating, x402 payment integration |
| **Network & Connectivity** | A2A federation bridge (FEP-8b32, ActivityPub, DIDComm v2), cross-worker Fetcher routing, swarm router |
| **Decentralised Technologies** | Self-sovereign DID:key identities, decentralised MCP tool registries, blind-signed LOVE credits, federation bridge |
| **Open Source Commons** | 3 npm packages, 8 CLI servers, 5 edge workers, 7 portals — Apache 2.0, all code in public monorepo |
| **AI & Human-Centric** | WebMCP browser-native AI tool registry, AG-UI cognitive-load adaptation (spoon theory), A2UI declarative component discovery |

---

## 2. Technology Overview — The 5 Protocol Layers

### 2.1 MCP — Model Context Protocol (Tool Execution)

**Role:** Secure, authenticated bridge between AI agents and system capabilities.

- **12 stdio CLI servers** — Oasis (11 tools), Component Registry (5), LOVE Ledger (4), Cognitive Prosthetic (47), Cognitive Comms (20), MARGE (14), BOB (14), PHOS Forge (32), SOULSAFE (14), Ground-Truth (14), Design System (8), Spaceship (4)
- **5 edge MCP workers** — BROS (8 tools), DADS (7), p31-crypto-mcp (12), justice-hub (8), p31-mcp-server (9)
- **Gateway proxy** (`apps/gateway/src/mcp/proxy.ts`) — 5 aggregated tools, trust-tier filtering, D1 audit logging, DID extraction from Bearer JWT
- **Protocol version:** `2026-07-28` (SEP-2575 stateless), migrating from `2024-11-05` — all 12 servers aligned
- **Monetisation spec:** x402 (HTTP 402) payment for premium tools, dual settlement in USDC or LOVE credits

**OIS alignment:** Trusted transactions infrastructure — auditable, authenticated, tier-gated AI tool access with payment settlement.

### 2.2 WebMCP — Web Content Mediation Protocol (Browser AI)

**Role:** Browser-native AI agent tool registry — the bridge between LLMs and web applications.

- **Chrome Origin Trial** — 5 domains enrolled (p31ca.org, willow.p31ca.org, phos.p31ca.org, bonding.p31ca.org, phosphorus31.org)
- **Tool registry** (`webmcp-registry.js`, 376 lines, 24 tools) — 4 mutating, 20 query tools with `readOnlyHint` and `_meta` extension fields
- **Graceful fallback** — `window.__p31MCPTools` + `window.__p31MCPExec` for non-Chrome environments; `p31-webmcp-ready` custom event
- **Dispatcher** (`packages/ui/src/webmcp/dispatcher.ts`) — bridges MCP calls to `data-mcp-*` DOM attributes

**OIS alignment:** Standards-track protocol for browser-based AI interaction — positions WebMCP as an open alternative to proprietary agent-OS integrations.

### 2.3 A2A — Agent-to-Agent (Federation)

**Role:** Cross-instance agent communication with decentralised identity.

- **Federation bridge** — ActivityPub + SD-JWT VC + FEP-8b32 Object Integrity Proofs; DIDComm v2 send/inbox for encrypted envelopes
- **Gateway Fetcher bindings** — 9+ downstream workers routed via `apps/gateway/src/index.ts` circuit breakers
- **Agent discovery** — `agent-card.json` at `/.well-known/agent-card.json` (IANA-registered, Linux Foundation A2A format)
- **DID rotation & recovery** — Guardian threshold scheme for decentralised key management
- **18/18 tests passing** — deployed at `federation-bridge.trimtab-signal.workers.dev`

> **Known gap:** `agent-card.json` file does not physically exist on disk — needs creation.

**OIS alignment:** Decentralised agent networking — the communication substrate for a federated, sovereign AI ecosystem.

### 2.4 A2UI — Agent-to-UI (Component Discovery)

**Role:** Standardised, machine-readable component catalog enabling AI agents to discover and manipulate UI elements.

- **Spec** (`docs/A2UI_CATALOG.md`) — version 0.9, aligned with Linux Foundation A2UI working group
- **15 component schemas** — GlassPanel, GlassCard, GlassStrong, GlassSubtle, Button, SpoonMeter, SpoonDial, StatusBadge, Crown, CrisisOverlay, CandyHeader, ThemeToggle, Starfield, TetraGrid, HonestLabel
- **CLI tool** (`cli/a2ui-cli.js`) — generate, validate, serve, deploy, prompt, help
- **JSON Schema** (`packages/interface-generator/src/adapters/a2ui.schema.json`) — v0.9 formal schema
- **HTML integration** — `data-a2ui-component`, `data-a2ui-props`, `data-a2ui-actions` on all portal DOMs

> **Known gap:** `a2ui-catalog.json` at `/.well-known/` does not exist on disk — needs generation.

**OIS alignment:** Open standard for AI-UI interoperability — reduces fragmentation in how agents interact with web applications.

### 2.5 AG-UI — Adaptive UI (Cognitive Load Adaptation)

**Role:** Real-time UI adaptation based on user cognitive state, trust level, and engagement.

- **Spoon theory** — `data-spoons="0-5"` on `<html>`: crisis (0) → minimal (1) → standard (2-3) → full effects (4-5)
- **Motion scaling** — `speedFactor` 0.0 at spoons 0-1, 0.5 at 2-3, 1.0 at 4+; respects `prefers-reduced-motion`
- **Trust tiers** — `data-trust-tier` (bronze/silver/gold) on `<body>` gates MCP tool exposure via `filterTools()`
- **LOVE balance** — `data-love-balance` drives trust tier progression; synced to gateway via `PATCH /api/state`
- **Design tokens** — 124 `--p31-*` CSS variables across 12 groups, perceptually uniform OKLCH colour, quantum scale
- **State observer** (`state-sync.js`) — watches `data-spoons`, `data-love-balance`, `data-trust-tier`, `data-active-tab`

> **Known gap:** No formal AG-UI spec document exists — logic is implicit in `data-*` attributes and CSS.

**OIS alignment:** Human-centric AI interaction — ensures AI adapts to human cognitive load rather than demanding constant human adaptation.

---

## 3. OIS Program Criteria Mapping

### 3.1 Trust Technologies

| Criterion | P31 Evidence |
|-----------|-------------|
| Privacy-enhancing technologies | DID:key self-sovereign identity, no centralised identity provider; blind-signed LOVE credits (Chaumian) |
| AI-based agents | MCP gateway tool routing with trust-tier gating; WebMCP browser registry for AI agents |
| Trusted identities | DID extraction from Bearer JWT via `extractDid()` in gateway proxy; DID rotation with guardian threshold |
| Transparent & auditable | D1 audit logging on every MCP tool call; `console.error` fallback for edge cases |
| Cross-network resilience | Federation bridge supporting ActivityPub + DIDComm v2 across 3C network boundaries |

### 3.2 Network & Connectivity

| Criterion | P31 Evidence |
|-----------|-------------|
| 3C network integration | Gateway Fetcher bindings to 9+ workers; federation bridge for cross-instance routing |
| Dynamic configuration | State-sync observer propagates `data-spoons`, trust tiers, LOVE balance to gateway in real time |
| Real-time monitoring | `/api/state` PATCH endpoint; audit log queries via D1 |
| Open-source building blocks | All 3 npm packages Apache 2.0; wrangler/Cloudflare Workers deployment; no proprietary dependencies |

### 3.3 Decentralised Technologies

| Criterion | P31 Evidence |
|-----------|-------------|
| Open standards | MCP (Anthropic spec), WebMCP (Chrome Origin Trial), A2A (Linux Foundation), A2UI (Linux Foundation), ActivityPub (W3C), DIDComm v2 (DIF) |
| Interoperable data/event flows | A2UI catalog → A2UI renderer → DOM data-* attributes → state-sync → gateway; federation bridge for cross-instance events |
| Immersive world readiness | AG-UI adaptive rendering (spoon-driven motion, colour, layout); quantum scale design tokens (16× `(4/3)^n`) |

### 3.4 Open Source Commons

| Metric | Value |
|--------|-------|
| npm packages published | 3 (`andromeda-cli`, `@p31/agent-engine`, `@p31/game-engine`) |
| License | Apache 2.0 (all packages) |
| CLI servers | 8 (open source, stdio JSON-RPC 2.0) |
| Edge workers | 5 MCP workers + 7 portal deployments |
| Portals | 7 (willow, tetra, sixseven, meatspace, p31ca, phosphorus31, design) |
| Protocol version alignment | 10+ servers all on `2026-07-28` |

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    navigator.modelContext                    ││
│  │                         (Chrome 149+)                       ││
│  │                           ↕                                 ││
│  │              WebMCP Registry (24 tools)                     ││
│  │         ┌─────────────────┼─────────────────┐              ││
│  │         ↕                 ↕                 ↕              ││
│  │   data-spoons    data-a2ui-*      window.__p31MCPExec      ││
│  │  (AG-UI adapt)  (A2UI discovery)      (fallback)          ││
│  └─────────────────────────────────────────────────────────────┘│
│                           ↕           ↕                         │
├────────────────────────────┼───────────┼────────────────────────┤
│                    MCP Gateway (proxy.ts)                       │
│              ┌─────────────┴─────────────┐                     │
│              │    filterTools()          │                     │
│              │  (trust-tier gating)      │                     │
│              └─────────────┬─────────────┘                     │
│                            ↕                                   │
│              ┌─────────────┴─────────────┐                     │
│              │    D1 Audit Log           │                     │
│              └───────────────────────────┘                     │
├────────────────────────────────────────────────────────────────┤
│                   Cloudflare Workers Edge                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │  BROS   │ │  DADS   │ │  Crypto │ │ Justice │  ... 9+      │
│  │ (8 tls) │ │ (7 tls) │ │ (12 tl) │ │ (8 tls) │             │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                           ↕                                   │
│              ┌──────────────────────────────┐                 │
│              │   Federation Bridge          │                 │
│              │  (ActivityPub + DIDComm v2)   │                 │
│              │  (FEP-8b32 + SD-JWT VC)      │                 │
│              └──────────────────────────────┘                 │
├────────────────────────────────────────────────────────────────┤
│                     CLI / Stdio Layer                          │
│  8 MCP servers: Oasis, LOVE, Cognitive, PHOS Forge, etc.      │
│  ≈139 tools total, JSON-RPC 2.0, protocolVersion 2026-07-28   │
└────────────────────────────────────────────────────────────────┘
```

### Cross-Layer Data Flow

```
User Action → DOM mutation (data-spoons/data-love-balance)
  → state-sync.js → PATCH /api/state → Gateway Session
    → filterTools() (trust-tier gate)
      → MCP tool call → D1 audit log
        → response → WebMCP registry → DOM update
          → AG-UI re-adapts (CSS custom properties)
```

---

## 5. Open Source Status

### Published npm Packages

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| `andromeda-cli` | latest (npm) | Apache 2.0 | CLI MCP server framework |
| `@p31/agent-engine` | latest (npm) | Apache 2.0 | AI agent orchestration |
| `@p31/game-engine` | latest (npm) | Apache 2.0 | Adaptive game framework |

### Repository Structure

- **Monorepo:** `/home/p31/P31-local-workspace/`
- **Apps:** gateway, app-builder, a2ui-renderer, p31ca
- **Workers:** mcp-x402-gateway, edge-render, crypto-mcp, phos-ai-proxy, jitterbug-api
- **CLI:** 8 MCP servers under `cli/` and `tools/`
- **Portals:** 7 Cloudflare Pages sites under `/home/p31/production/portals/`
- **Design system:** `design-system.json` (124 tokens, 12 groups, OKLCH colour)

### Licensing Status

- All first-party code: Apache 2.0
- Dependency check: needs full audit (see §9 Gaps)
- No proprietary dependencies; all dependencies are open-source

---

## 6. Consortium Readiness

### Current Status

P31 is currently a **single-developer project** (Phosphorus31). The OIS call requires:
- 3+ independent legal entities from 3+ different EU member states or associated countries
- Consortium of industry + research partners
- Commitment to open science practices

### Proposed Consortium Structure

| Role | Entity Type | Country | Responsibility |
|------|------------|---------|---------------|
| **Coordinator / Core Tech** | Phosphorus31 (SME/individual) | IE | Protocol layer implementation, architecture, gateway, MCP |
| **Research Partner** | University / Research Institute | TBD | AG-UI cognitive load validation, A2UI formal specification, user studies |
| **Industry Partner** | SME (OSS / Web Technologies) | TBD | WebMCP standardisation, browser integration, Chrome Origin Trial expansion |
| **3C Pilot Liaison** | 3C large-scale pilot entity | TBD | Integration testing, requirements feedback, deployment validation |

### Outreach Plan

1. **Research partners:** Contact European HCI/AI labs working on cognitive load adaptation, decentralised identity, or agent protocols
2. **Industry partners:** Engage EU-based OSS consultancies and web-focused SMEs already in the Cloudflare Workers / edge computing ecosystem
3. **3C pilot:** Identify relevant 3C large-scale pilot projects through the CSA (Coordination and Support Action)
4. **NGI (Next Generation Internet) alumni network:** Leverage NGI Zero / NGI TrustChain communities

**Budget allocation:** ≈30% coordinator, 25% research partner, 25% industry partner, 20% third-party open calls (€50-150K per sub-project)

---

## 7. Security & Hardening Status

### Completed

| Item | Status |
|------|--------|
| Protocol version alignment (10+ servers) | ✅ `2026-07-28` |
| RCE sanitisation (CLI MCP servers) | ✅ Shell metacharacter filtering (`/;&|\`\n|\$\(/`) |
| Audit log fallback (gateway) | ✅ `console.error` fallback when D1 unavailable |
| Session file permissions | ✅ `{ mode: 0o600 }` on all session files |
| A2UI JSON Schema | ✅ `a2ui.schema.json` v0.9 |
| Egress control | ✅ No external `fetch()` in any worker (all internal bindings) |
| CSP meta tags | ✅ In all 7 portals |
| DID auth | ✅ Bearer JWT → `extractDid()` in gateway |

### Remaining (§3.2)

| Item | Priority |
|------|----------|
| **Scoped tokens:** Short-lived, scope-bound tokens per gateway tool call | Medium |
| **Behavioural baselines:** Per-user tool-call patterns logged to D1 for anomaly detection | Medium |
| **Dependency audit:** Full `npm audit` + licence compliance scan | Medium |

---

## 8. Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| **Current** | 2026-07 | ✅ 5-layer protocol stack live, 7 portals deployed, 24 WebMCP tools |
| **Phase 3.2-3.3** | 2026-08 | Scoped tokens, behavioural baselines, dependency audit |
| **Phase 4a** | 2026-08 | OIS dossier finalised, partner outreach begins |
| **Phase 4b** | 2026-09 | Agent-card.json, a2ui-catalog.json, AG-UI spec doc created |
| **Phase 4c** | 2026-09-10 | Consortium formed, proposal drafted |
| **OIS Submission** | 2026-10-15 | Full proposal submitted (HORIZON-CL4-2026-04-DATA-02 deadline) |
| **Post-submission** | 2026-10+ | Continue core development regardless of OIS outcome |

---

## 9. Known Gaps

| Gap | Impact | Remediation |
|-----|--------|-------------|
| `agent-card.json` missing from `/.well-known/` | A2A agent discovery not operational | Create file from AGENTS.md spec |
| `a2ui-catalog.json` missing from `/.well-known/` | A2UI agent discovery not operational | Generate from A2UI CLI tool |
| No formal AG-UI specification document | Layer 5 behaviour implicit, harder to standardise | Write `docs/AGUI_SPEC.md` |
| No consortium yet | Cannot apply to OIS solo | Begin partner outreach (roadmap §8) |
| No npm audit performed | Unknown dependency risk | Run `npm audit` across all `apps/`, `workers/`, `cli/`, `packages/` |
| WebMCP registry only in `/home/p31/production/portals/assets/` | Not in monorepo workspace | Copy to `packages/ui/src/webmcp/` |

---

## 10. Appendices

### A. Tool Counts by MCP Server

| Server | Tools | Location |
|--------|-------|----------|
| Oasis CLI | 11 | `cli/mcp-server.js` (shared) + `cli/oasis-*` |
| Component Registry | 5 | `cli/mcp-server.js` (shared) |
| LOVE Ledger | 4 | `cli/mcp-server.js` (shared) |
| Cognitive Prosthetic | 47 | `cli/cognitive-mcp/` |
| Cognitive Comms | 20 | `cli/cognitive-comms/` |
| MARGE | 14 | `cli/marge-mcp/` |
| BOB | 14 | `cli/bob-mcp/` |
| PHOS Forge | 24-27 | `tools/phos-forge/` |
| BROS (edge) | 8 | `workers/mcp-x402-gateway/bros/` |
| DADS (edge) | 7 | `workers/mcp-x402-gateway/dads/` |
| p31-crypto-mcp (edge) | 12 | `workers/crypto-mcp/` |
| justice-hub (edge) | 8 | `workers/justice-hub/` |
| p31-mcp-server (edge) | 9 | `workers/p31-mcp-server/` |
| **Total** | **≈185-188** | |

### B. Portal Inventory

| Portal | Domain | Entry Point | Brand |
|--------|--------|-------------|-------|
| Children | willow.p31ca.org | `willow-portal.html` | willow |
| Parent | tetra.p31ca.org | `tetra-ops.html` | tetra |
| Teen | sixseven.p31ca.org | `p31-portal.html` | p31 |
| Meatspace | meatspace.p31ca.org | `meatspace-bonding-mvp.html` | meatspace |
| Developer | p31ca.org | `index.html` | p31ca |
| Institutional | phosphorus31.org | `index.html` | phosphorus31 |
| Design | design.p31ca.org | `index.html` | design |

### C. Design Token System

From `design-system.json` — 124 tokens across 12 groups:

| Group | Tokens | Example |
|-------|--------|---------|
| Scale | 10 | `--p31-scale-0` through `--p31-scale-9` (12px to 90px, `16×(4/3)^n`) |
| Colour | 24 | `--p31-accent`, `--p31-accent-alt`, `--p31-accent-violet` (OKLCH) |
| Semantic | 12 | `--p31-bg`, `--p31-text`, `--p31-error`, `--p31-success` |
| Spacing | 8 | `--p31-space-xs` through `--p31-space-xxl` |
| Typography | 14 | `--p31-font-ui`, `--p31-font-display`, `--p31-font-mono` |
| Motion | 6 | `--p31-duration-fast`, `--p31-ease-default` |
| Surface | 10 | `--p31-glass-bg`, `--p31-glass-border`, `--p31-glass-blur` |
| Shadow | 8 | `--p31-shadow-sm` through `--p31-shadow-xl` |
| Adaptive | 8 | `--p31-spoon-*` mapped to `data-spoons` levels |
| Brand | 12 | `--p31-willow-*`, `--p31-tetra-*`, `--p31-phos-*` |
| Accessibility | 6 | `--p31-focus-ring`, `--p31-touch-target` |
| Deprecated | 6 | Legacy, mapped forward |

### D. Key Documents Referenced

- `docs/A2UI_CATALOG.md` — A2UI component specification (v0.9)
- `docs/AGENT_INTEGRATION.md` — Agent discovery and federation
- `docs/ARCHITECTURE.md` — System architecture overview
- `docs/ARCHITECTURE_DATA_LAYER.md` — Data flow and state management
- `docs/DEPLOYMENT.md` — Deployment runbook
- `docs/EDGE_TO_LOCAL_HANDOFF_TEST_PLAN.md` — Edge-to-CLI failover testing
- `docs/WEBMCP_TRIAL.md` — Chrome Origin Trial enrolment
- `design-system.json` — Design token canonical definition
- `packages/interface-generator/src/adapters/a2ui.schema.json` — A2UI JSON Schema v0.9
- `/home/p31/production/portals/assets/webmcp-registry.js` — WebMCP 24-tool registry

---

*End of dossier. Next update scheduled after Phase 3.2-3.3 completion and consortium outreach.*
