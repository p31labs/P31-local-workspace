# CWP-2026-040 — Personal Sierpinski Swarm: Verified Integration Plan (040H–040M)

- **Status:** Ready for swarm execution (build mode)
- **Depends on:** CWP-2026-040 backend (`18f7e7e`, pushed) — fractal backbone already built
- **Date:** 2026-07-14
- **Scope decisions (user):** all 3 scales; storage = best fit (PGLite self / D1 sync); identity = existing DID stack; SaaS = optional bridges only; integration = wire 1–2 flagship OSS via MCP; first scale = Self.

> License/activity claims for **external** tools below are taken from the user-provided deep-research summary and are flagged `VERIFY@040K` — they must be independently confirmed (GitHub LICENSE + last-commit) before any adapter is wired. The **local stack** claims are verified: the files exist and were authored this session.

---

## 0. Reality check (read first)
The fractal backbone already exists (CWP-2026-040). Most tools in the curated list **duplicate** what is already built:
- Cortex / Atomic / Reckons.AI / second-brain-mcp / Kryton / MegaMem → our PGLite `unified_knowledge_graph` + `p31-cortex` D1 graph + swarm.
- OpenClaw / Hermes → our `p31-cortex` agents + `agent-runtime` + `care-mesh` + `mcp-x402-gateway`.
- Family Organizer / Tribu / Kinhold / Yuvomi / HomeHub → our Family/Career D1 sync + coordinator.
- EUDI Wallet / SSI → our `did:key` / `did:jwk` / `did:web` stack.

**So we integrate selectively, behind the existing `FractalDB` seam — we do not reimplement the pattern.**

---

## 1. Verified local stack (real, built this session)
| Component | Location | Role |
|---|---|---|
| `FractalDB` interface + 3 backends | `software/workers/personal-swarm/src/store.ts` | Storage-agnostic seam: `PgliteFractalDB` (sovereign Self), `D1FractalDB` (Family/Career sync on `p31-cortex` D1 id `6a645125-…`), `MemoryFractalDB` (tests) |
| Causal memory (040A) | `src/causalMemory.ts` | trigger→goal→approach→outcome→lesson |
| Behavioural DNA (040B) | `src/behaviouralDna.ts` | 13-trait genome evolving from outcomes |
| Swarm wiring (040C) | `src/swarm.ts` | scale→`p31-cortex` agent map |
| Consolidation (040D) | `src/consolidation.ts` | event-driven (no new cron) |
| Hono API + D1 migration | `src/index.ts`, `migrations/0001_fractal.sql` | Family/Career sync tables |
| MCP surface | `software/workers/mcp-x402-gateway` | existing 48-tool gateway — external KGs plug in here |
| DID stack | `software/packages/sovereign/src/identity.ts`, `software/packages/shared/src/sovereign/crypto.ts` | `did:key`/`did:jwk`/`did:web` → 040I |
| Self KG | `apps/phos/src/lib/ChaosVault.ts` | PGLite `unified_knowledge_graph` |
| Cortex agents | `software/p31-cortex/src/do/*` | legal, grant, content, finance, benefits, kofi |

**15 vitest tests passing, `tsc` clean** (CWP-2026-040).

---

## 2. Tool triage (from provided research — VERIFY@040K before wiring)
| Bucket | Tools | Treatment |
|---|---|---|
| **Adopt via MCP adapter** | Cortex `VERIFY@040K` (typed-rel extraction), Reckons.AI `VERIFY@040K` (human-verified Turtle facts), Kryton `VERIFY@040K` (Apache-2.0, shared-brain MCP), second-brain-mcp `VERIFY@040K` (MIT), Atomic `VERIFY@040K` (MIT) | Drop in as `FractalDB` adapters via `mcp-x402-gateway`. |
| **Pattern only** (redundant w/ stack) | OpenClaw, Hermes (agent runtimes), Family Organizer, Tribu, Kinhold, Yuvomi, HomeHub (Family OS) | Adopt the *idea*, not the package. |
| **Optional, consent-gated bridges** (closed SaaS — sovereignty conflict) | Gemini Spark, FamilyWall, Cozi, Blomma, Grug, Vera, Pathrise, Speechify | Never authoritative store; bridge only on explicit user consent. |
| **Already covered** | EUDI Wallet / SSI | Our DID stack → **040I**. |

---

## 3. Integration architecture
```
                 mcp-x402-gateway (48 existing MCP tools)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   Cortex (MCP)          Reckons.AI (MCP)       Kryton (MCP)
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                  McpFractalDB  (implements FractalDB)
                                │
                                ▼
        ┌───────────────────────────────────────────────┐
        │   Unified FractalDB read/write view (swarm)    │
        │   Self=PGLite · Family/Career=D1 · Ext=MCP    │
        └───────────────────────────────────────────────┘
```
- **`FractalDB` is the seam.** A new `McpFractalDB` implements the same interface and talks to the external tool over MCP via the gateway. **Swarm logic is untouched.**
- **Human-in-the-loop verification** (Reckons pattern): add a `reviewed` gate to stored facts → facts stay local/Turtle, require confirm before agents consume them. Reinforces the behavioural-DNA confidence gating already in `behaviouralDna.ts`.
- **SSI/EUDI** (040I): verification + attestation endpoint on the existing `sovereign` DID stack.

---

## 4. Implementation phases
| CWP | Scale | Work | Deliverables / Acceptance |
|---|---|---|---|
| **040H** | Self (first) | Unified Fractal dashboard — one `FractalDB` read-view over Self PGLite + Family/Career D1 (nodes, causal chains, DNA, links). | Hono aggregation endpoint + client view; new tests; `tsc` clean. |
| **040I** | SSI | DID/SSI verification + attestation endpoint (aligns with EUDI Dec-2026 mandate). Reuse `did:key`/`did:jwk`/`did:web`. | `verify(id, vc)` + issue attestation; tests against `sovereign` pkg; EUDI-compatible VC format. |
| **040K** | Integration | MCP-backed `FractalDB` adapter for **1–2 flagship OSS** (recommend **Cortex** + **Reckons.AI**). Surface via `mcp-x402-gateway`. **No `npm install -g`.** | Adapter implements `FractalDB`; exercised against a mock MCP server; license + activity independently verified. |
| **040L** | Career | Competency-inference engine (SkillBridge pattern) reusing behavioural DNA + causal memory. | `inferCompetencies(skills)` → inferred skills; 10+ tests; reuses DNA confidence gating. |
| **040M** | Docs | Verify-and-prune: confirm real/license status of listed tools; mark closed SaaS as bridges; drop synthetic entries. | Accurate tool table; license notes; closed SaaS flagged. |

---

## 5. What we do NOT build (pattern-only / redundant)
| Category | Tools | Reason |
|---|---|---|
| Agent runtimes | OpenClaw, Hermes | `p31-cortex` + `agent-runtime` already cover. |
| Family OS | Family Organizer, Tribu, Kinhold, Yuvomi, HomeHub | D1 sync + coordinator already cover. |
| Closed SaaS | FamilyWall, Cozi, Blomma, Grug, Vera, Pathrise, Speechify, Gemini Spark | Sovereignty conflict; optional bridges only. |
| Already covered | EUDI Wallet / SSI | DID stack (`did:*`) → 040I. |

---

## 6. Constraints honored
- **No new D1** — reuse `p31-cortex` D1 (id `6a645125-…`); Self stays PGLite/local.
- **No new cron** — consolidation stays event-driven.
- **Sovereignty** — Self local; SaaS only consent-gated, never authoritative.
- **License** — confirm before any adapter (Kinhold reported Elastic-2.0 — verify compatibility; prefer MIT/Apache).

---

## 7. Risk register
| Risk | Mitigation |
|---|---|
| MCP server unavailable for a tool | Build thin MCP client; no new worker. |
| Kinhold Elastic-2.0 incompatible | Skip Kinhold; pattern only. |
| EUDI spec changes by end-2026 | Monitor; adapt 040I. |
| Cortex/Reckons license unclear | Confirm at 040K; fall back to pattern. |

---

## 8. Jurisdiction: US & EU
The P31 stack is **jurisdiction-agnostic** — it works anywhere. Core components (DIDs, post-quantum crypto, SD-JWT VCs, ActivityPub federation) are global standards.
| Aspect | US | EU |
|---|---|---|
| Pilot families | 18 US families onboarding | Not yet |
| Blockchain | Base Sepolia (global testnet) | Same chain |
| NGI grants | NGI TALER / Fediversity are EU-only | Proposals submitted |
| EUDI Wallet | No US mandate | Mandatory by end-2026; DID stack aligns |
| Data sovereignty | Local-first, DID-anchored | Same |

**Short answer:** the tech is global. EUDI integration (040I) is specifically for EU compliance, but the system is already live with US pilot families and can serve anyone, anywhere.

---

## 9. Success criteria
- Unified Fractal Dashboard (040H) — Self PGLite + Family/Career D1 view.
- DID/SSI verification endpoint (040I) — EUDI-ready.
- MCP-backed `FractalDB` adapters for Cortex + Reckons.AI (040K).
- Competency-inference engine (040L) — SkillBridge pattern.
- Verified-and-pruned doc table (040M).
- Typecheck: 0 errors on changed files; existing 384 tests remain green.
- Each phase committed separately and pushed.
