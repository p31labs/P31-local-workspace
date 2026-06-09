# Controlled Work Package — Initial Build (intake → identity → personal tetra bake)

| Field | Value |
|--------|--------|
| **CWP ID** | `CWP-P31-IB-2026-01` |
| **Title** | Production path: collect minimal intake, derive opaque **cryptographic `subject_id`**, **bake** `p31.personalTetra/1.0.0` into the user’s k4-personal Durable Object, then hand off to `mesh-start` / room — with **issuable** invariants, ordering, and verification |
| **Version** | 1.0.0 |
| **Effective date** | 2026-04-26 |
| **Status** | **Issued for execution** (production governance) |
| **Applies to** | **`p31ca/public/initial-build.html`**, **future** intake/bake script bundle, **`k4-personal`** (`PUT /state`, `PUT /tetra` — no new DO route required for MVP), root **`p31-constants.json`** + **`apply:constants`**, **`p31.ground-truth.json`** (route + edge redirect) |

**Normative technical spec:** `integration-handoff/INITIAL-BUILD-SITE-STRICT-PLAN.md` (`P31-IB-PLAN-2026-01`) — state machine, P/Q invariants, merge algorithm, and failure matrix. This CWP **owns** go-live priority; the strict plan is the **appendix** for implementers. If they diverge, **revise the strict plan and bump this CWP**.

**Related (do not conflate):**

| Name | What it is |
|------|------------|
| **Initial Build (IB)** | **Product + edge** path: one **first** session that **commits** profile + **personal tetra** after **identity lock**; hands off to existing PAR stack (`CWP-P31-PAR-2026-01`). |
| **Personal Agent Room (PAR)** | **Ongoing** room: mesh-start, `/agent/...`, `/u/.../home` — **consumes** `subject_id` and tetra **after** IB bake (or after legacy onboard-only path). |
| **Planetary onboard** | **Wye → Delta** narrative + dial + passkey; may **merge** (Option II) or **chain** (Option III) with IB per **D-IB10** decision. |
| **CWP-P31-ECO-2026-01** | Hub/catalog — optional **registry** entry for Initial Build; **sister** CWP, no merge required for IB closure. |
| **CWP-P31-SC-2026-01** | SUPER-CENTAUR / Ring D — **excluded** from IB. |

---

## 1. Purpose

1. **Ship** a **governed** first-run: intake → `subject_id` (passkey `u_*` or `guest_*`) → **`PUT` order** (see strict plan section 6.2) → `mesh-start.html` (or `GET /u/:id/home`) **without** double-minting `subject_id`.
2. **Bind** the **tetra** contract: every bake payload **must** pass `validatePersonalTetra()` in `k4-personal/src/personal-tetra.js` (schema `p31.personalTetra/1.0.0`).
3. **Record** a **bake manifest** in client storage (strict plan section 5–6) for support and future verifiers.
4. **Verify** in CI: `npm run verify:ground-truth` (route + redirect), `npm run verify:constants`, `npm run verify:mesh` (k4-personal liveness + constants alignment).
5. **Respect** youth and accessibility rules (strict plan section 11); **no** agent-hub as primary private chat for minors (PAR D-PA6 pattern).

---

## 2. References (read order)

| # | Path / artifact | Use |
|---|------------------|-----|
| R1 | `integration-handoff/INITIAL-BUILD-SITE-STRICT-PLAN.md` | **Normative** P/Q, state machine, storage keys, `PUT` order |
| R2 | `k4-personal/src/personal-tetra.js` | Validator + `defaultPersonalTetra` |
| R3 | `k4-personal/src/index.js` | `/agent/:id/tetra`, `/state`, CORS |
| R4 | `p31ca/public/p31-welcome-packages.json` | `personalTetra.docks` merge source |
| R5 | `p31ca/public/planetary-onboard.html` | `subject_id` derivation (must **single-source** with IB) |
| R6 | `p31ca/public/mesh-start.html` | Handoff target, first-time `PUT /tetra` merge behavior |
| R7 | `p31ca/ground-truth/p31.ground-truth.json` | `routes.initialBuild`, `edgeRedirects` for `/build` |
| R8 | `docs/MESH-MAP-PERSONAL-START-PAGES.md` | Product map, PAR cross-links |
| R9 | `docs/PLAN-KIDS-VIBE-CODING.md` | Youth path |
| R10 | `CWP-31/deliverables-matrix.json` (PAR) | Sibling D-PA* alignment; IB does not close PAR |
| R11 | `CWP-32/deliverables-matrix.json` | Machine-readable D-IB* (this CWP) |

---

## 3. Ecosystem rings

| Ring | This CWP |
|------|----------|
| **A — p31ca.org static** | **Yes** — `initial-build.html`, `/build` redirect, links to onboard/mesh-start/ hub. |
| **B — k4-personal** | **Yes** — client calls existing `PUT` routes only (MVP). |
| **B — passkey Worker** | **Optional** — server binding per PAR PA-1.2, not a gate for IB v1. |
| **B — k4-cage** | **Out** (see PAR). |
| **D — phosphorus31.org** | **Excluded** — see CWP-SC. |

---

## 4. Assumptions and constraints

- **A1** — IB **may** share `localStorage` keys with onboard (`p31_subject_id`, `p31_onboard_meta` / `p31_build_record`); see strict plan **section 5.1** — **D-IB10** must close before conflicting implementations ship.
- **A2** — No new Worker routes required for **MVP** bake; a future `POST /build` is **out of band** until a sub-CWP reopens.
- **A3** — Live mesh **counts** are **not** in this CWP; use `GET /api/health` and constants.

---

## 5. Deliverables

| ID | Deliverable | Verification |
|----|-------------|--------------|
| **D-IB1** | **CWP** (this file) + **strict plan** as appendix; `CWP-32/deliverables-matrix.json` | Merged; matrix `status: open` → `done` with PRs |
| **D-IB2** | **Route** `initial-build` in **ground truth**; **`/build` → `initial-build.html`** in `_redirects` + `edgeRedirects` | `npm run verify:ground-truth` (p31ca) |
| **D-IB3** | **Static** `p31ca/public/initial-build.html` (production shell) references **CWP-P31-IB-2026-01**; CTAs to onboard + mesh | Manual + `fileSnippets` in ground-truth |
| **D-IB4** | **Single-sourced** `subject_id` derivation with `planetary-onboard.html` (or shared module) | Grep + test |
| **D-IB5** | **MVP** client sequence: `PUT /state` (profile) then `PUT /tetra` (full tetra) per strict plan 6.2 | E2E or script |
| **D-IB6** | **Bake manifest** written post-success (`p31_build_record` or extended `p31_onboard_meta`) | Storage inspection |
| **D-IB7** | **Cross-links:** `MESH-MAP`, `AGENTS.md`, review supplement, PAR `CWP-31` README | Doc review |
| **D-IB8** | **Playwright** (optional) or **manual** runbook: re-entry + partial-failure (strict plan section 9) | Artifact |
| **D-IB9** | **Home** `npm run verify` + `verify:mesh` green on clean clone (with Andromeda) | CI / local log |
| **D-IB10** | **Decisions** in strict plan section 12 **closed** in ADR or `CWP-32/DECISIONS.md` (onboard I/II/III, meta key A/B, href allowlist) | Maintainer sign-off |

---

## 6. Work breakdown structure (WBS)

| Phase | ID | Task | Output |
|-------|-----|------|--------|
| **0** | IB-0 | Route + redirect + shell page + ground-truth + ecosystem probe | D-IB2, D-IB3 |
| **1** | IB-1 | Extract or duplicate-proof `subject_id` helper | D-IB4 |
| **2** | IB-2 | Intake UI + validation against `p31.welcomePackages` + dock allowlist | D-IB5 (partial) |
| **3** | IB-3 | Wire `PUT` sequence + error UI | D-IB5 |
| **4** | IB-4 | Bake manifest + storage | D-IB6 |
| **5** | IB-5 | E2E / runbook + D-IB10 decision log | D-IB8, D-IB10 |
| **6** | IB-6 | **Closure:** CWP `1.1.0` **Complete**; deliverables matrix `done` + PR links | D-IB1 |

---

## 7. Exclusions

- Cage bridge, ECO catalog merge, SC server work, agent-engine product wiring, local LLM on Worker.
- `POST /agent/:id/build` (single round-trip) until explicitly scoped.

---

## 8. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Two first-run UIs (onboard + IB) confuse users | **D-IB10** + single primary path in copy |
| `PUT` partial failure (state ok, tetra not) | Retry tetra; document (strict plan section 9) |
| href injection in dock `href` | Allowlist in D-IB5 implementation |

---

## 9. Rollback

- Revert static page + `edgeRedirects` + ground-truth; **client DO state** is not purged by redeploy. Users may **re-bake** via IB or mesh-start.

---

## 10. Configuration management

| Change | Action |
|--------|--------|
| New public path | **R7** + `apply:constants` if URL appears in **generated** TS |
| Tetra schema bump | `personal-tetra.js` + CWP **revision** |

### Change log

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-04-26 | **Issued for production:** CWP, strict plan appendix, route `/initial-build`, redirect `/build`, D-IB1–D-IB10 |

---

*End of CWP `CWP-P31-IB-2026-01`*
