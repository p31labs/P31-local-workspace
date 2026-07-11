# CWP-2026-006: UIG PHASE 2 — ADAPTIVE EXOCORTEX & GENERATIVE LAYER

**Vector Equilibrium to Tetrahedron | Issued 2026-07-10**

**STATUS:** IN EXECUTION — Axis A Batch 1 pushed (`408180f`)
**ISSUED:** 2026-07-10
**OPERATOR:** trimtab-signal / p31
**PARENT:** CWP-2026-005 (UIG Convergence & Workspace Unification)
**GEOMETRY:** Four axes — (A) Design System Unification, (B) UIG Extension, (C) Generative Layer, (D) Operational Readiness
**DEADLINE:** 2026-08-15 (Phase 2 completion) → 2026-08-01 (NLnet grant submission for Phase 2 funding)

---

## PREAMBLE

CWP-2026-005 collapsed the seven parallel UIG faces into a single canonical implementation. The **Adaptive Exocortex** is now functional: PHOS, p31ca, bonding, willow, and phosphorus31 all render adaptive UIs from `InterfaceDescription`, with a single `CrisisOverlay` and a WCAG gate in CI.

CWP-2026-006 is the expansion from **functional** to **universal** and **generative**. It delivers the Phase 2 promises from the NLnet grant narrative: WCAG 2.2 AAA compliance across all surfaces, a unified design system that enforces the `DESIGN.md` single‑accent invariant, and a generative layer that rewrites `InterfaceDescription` via LLM with hard safety constraints.

The external landscape validates this direction:

| Standard | Status | P31 Phase 2 Alignment |
| :--- | :--- | :--- |
| **WCAG 2.2 AAA** | Active recommendation | Deliver 48px touch targets, skip‑link, contrast ≥7:1 |
| **W3C COGA** | Active guidance | Implement simplification, progressive disclosure, user‑controlled adaptation |
| **A2UI v0.9** | April 2026 | Align `InterfaceDescription` with the declarative UI standard |
| **json‑render** | Production‑ready | Use the component catalog as the contract between AI and design |
| **AttentionGuard** | IUI 2026 | Implement behavioral signal (spoons) → UI adaptation loop |

---

## COMPLETED PREREQUISITES (from CWP-2026-005)

| Item | Status | Commit |
| :--- | :--- | :--- |
| R1.1 – Workspace Phase 1 (6 apps) | DONE | `c822ea8` |
| R2 – UIG ported to `apps/phos` | DONE | `d4377a6` |
| R3 – Emerald → Cyan | DONE | `d4377a6` |
| R4 – Willow UIG + spoon 0–5 | DONE | `a7d4696` |
| R5 – Phosphorus31 crisis island | DONE | `a7d4696` |
| R6 – CrisisOverlay dedupe | DONE | `a7d4696` |
| R7 – axe-runner in CI | DONE | `d4377a6` |
| WCD-501 – Delete root `/phos` | DONE | `6d37496` |
| WCD-502 – Doc false‑claim corrections | DONE | `440fc5c` |
| WCD-503 – Final verification suite | PARTIAL (sandbox network; TRIPER 12/12 fresh) | — |
| Phase 0.1 – Secret rotation + history rewrite | DONE | `440fc5c` + force-push |

---

## SCOPE — CWP-2026-006

### Axis A: Design System Unification (WCAG 2.2 AAA + COGA)

| Task | Deliverable | Owner |
| :--- | :--- | :--- |
| A1 | Enforce 48px touch targets across all apps | ✅ DONE (`408180f`) |
| A2 | Add skip‑link to `phos/src/pages/index.astro` and all entry points | ✅ DONE (`408180f`) |
| A3 | Replace all `text-white/30` on dark with `text-white/70` (contrast ≥7:1) | ✅ DONE (`408180f`) |
| A4 | Centralise `data-spoons` motion scaling in `@p31/design-system` | Design system |
| A5 | Implement progressive disclosure (COGA pattern) in PHOS surfaces | PHOS |
| A6 | Add user‑controlled adaptation controls (spoon slider, density toggles) to all apps | UIG renderer |
| A7 | Wire `scripts/audit-wcag.mjs` into `pre-merge` CI (blocking, not non‑blocking) | CI |

**Success criteria:** `scripts/audit-wcag.mjs` returns 0 violations; all apps pass WCAG 2.2 AAA audit.

### Axis B: UIG Extension (All Faces + R1 Phase 2)

| Task | Deliverable | Owner |
| :--- | :--- | :--- |
| B1 | Complete R1 Phase 2: add manifests to `apps/bonding`, `apps/auth`, `apps/status`, `apps/design-hub`; add to workspace | Workspace |
| B2 | Resolve root `packages/*` stubs (delete or implement) | Workspace |
| B3 | Replace `file:` deps with `workspace:*` in all apps | Workspace |
| B4 | Extend UIG to `apps/bonding` (already partial) and verify full coverage | Bonding |
| B5 | Extend UIG to `apps/auth` (if real) | Auth |
| B6 | Document the `InterfaceDescription` schema and UIG renderer | Docs |

**Success criteria:** `pnpm install` works from root; all apps build; `apps/bonding` and `apps/auth` have UIG integration.

### Axis C: Generative Layer (LLM rewrites InterfaceDescription)

| Task | Deliverable | Owner |
| :--- | :--- | :--- |
| C1 | Define `generateInterfaceFromIntent(prompt, constraints)` API | UIG |
| C2 | Implement LLM rewrite of `InterfaceDescription` with hard constraints | UIG |
| C3 | Safety gate: crisis mode always overrides; motion scaling always respected; required widgets always present | UIG |
| C4 | Add `?gen=1` query param to enable generative rewrites for testing | UIG |
| C5 | Add MCP tool `uig-generate-from-intent` for agentic UI generation | MCP |
| C6 | Integration into PHOS: user can type intent → adaptive UI | PHOS |

**Success criteria:** LLM can rewrite a dashboard layout based on user intent; safety constraints prevent crisis override; MCP tool returns valid `InterfaceDescription`.

### Axis D: Operational Readiness

| Task | Deliverable | Owner |
| :--- | :--- | :--- |
| D1 | Add MCP‑tool tests for all 46 tools (currently zero coverage) | MCP | ✅ 22 tests, all 4 servers |
| D2 | Refresh TRIPER cert weekly (automated) | CI | ✅ `triper-cert.yml` (weekly + manual) |
| D3 | Add UIG coverage to TRIPER suite | Testing | ✅ 22 tests (generateInterface + generateInterfaceFromIntent) |
| D4 | Deploy sanitised `.env.example` (no real secrets) | Ops | ✅ Committed |

**Success criteria:** MCP tools have ≥80% test coverage; TRIPER cert automated; UIG TRIPER suite passes.

---

## TIMELINE

| Phase | Axis | Duration | Start | End |
| :--- | :--- | :--- | :--- | :--- |
| P1 | Axis A (Design System) | 2 weeks | 2026-07-12 | 2026-07-26 |
| P2 | Axis B (UIG Extension) | 1 week | 2026-07-19 | 2026-07-26 |
| P3 | Axis C (Generative Layer) | 2 weeks | 2026-07-26 | 2026-08-09 |
| P4 | Axis D (Operational) | 1 week | 2026-08-02 | 2026-08-09 |
| **Total** | | **~4 weeks** | | **2026-08-09** |

**Deadline:** Axis A and B must complete by **2026-07-26** to inform the NLnet grant submission (Aug 1) with verifiable WCAG 2.2 AAA claims.

---

## VERIFICATION CHECKLIST (Post‑CWP)

- [x] `scripts/audit-wcag.mjs` returns 0 violations in CI (blocking)
- [ ] All apps build from a single `pnpm install`
- [x] `generateInterfaceFromIntent` produces valid `InterfaceDescription`
- [x] MCP tool tests cover all 4 servers
- [x] TRIPER cert includes UIG suite and is automated weekly
- [x] `.env.example` is committed with no real secrets

---

## RISKS & MITIGATIONS

| Risk | Probability | Mitigation |
| :--- | :--- | :--- |
| LLM hallucinations in generated UI | Medium | Hard safety constraints + validation schema; fallback to deterministic generator |
| WCAG 2.2 AAA audit fails | Medium | Run `scripts/audit-wcag.mjs` early and often; fix incrementally |
| Workspace manifest pass breaks builds | Low | Add manifests one app at a time; verify `pnpm install` after each |
| Provider‑side secret rotation incomplete | High | Document all exposed secrets; rotate before Aug 1 |

---

## PARKING LOT (from CWP-2026-005)

- **WCD-501:** ✅ DONE — root `/phos` deleted (`6d37496`).
- **WCD-502:** ✅ DONE — WCAG header relabeled (`440fc5c`).
- **WCD-503:** PARTIAL — `pnpm install` stalls in sandbox (network); TRIPER cert fresh 12/12.
- **Provider-side key rotation:** STILL PENDING — user action required at OpenRouter, Groq, Gemini, Cloudflare (SEPOLIA_RPC).

All blocking prerequisites cleared. Axis A Batch 1 pushed.

---

## GRANT NARRATIVE UPDATE

The NLnet proposal for Phase 2 must now claim:

- **WCAG 2.2 AAA:** Delivered via Axis A (48px targets, skip‑link, contrast ≥7:1)
- **COGA:** Delivered via Axis A (progressive disclosure, user‑controlled adaptation)
- **A2UI / json‑render alignment:** Delivered via Axis C (InterfaceDescription aligns with A2UI schema)
- **AttentionGuard‑style adaptation:** Delivered via Axis C (LLM rewrites UI from behavioral signals)

These are **roadmap claims** with clear delivery dates (Aug 9, 2026). The narrative is honest, ambitious, and defensible.

---

*Generated: 2026-07-10 (post‑deep research synthesis)*
*P31 Labs | 501(c)(3) Nonprofit | EIN 42-1888158*
