# Controlled Work Package — P31 Ecosystem Integration (p31ca + edge)

| Field | Value |
|--------|--------|
| **CWP ID** | `CWP-P31-ECO-2026-01` |
| **Title** | Unified technical hub, single product graph, and controlled edge alignment |
| **Version** | 1.0.3 |
| **Effective date** | 2026-04-25 |
| **Status** | Issued for execution |
| **Applies to** | `andromeda/software/p31ca` (primary); touches `scripts/hub/*`, `ground-truth/*`, `src/pages/index.astro`, `public/*`; **does not** merge `phosphorus31.org` unless a separate CWP is opened |

---

## 1. Purpose

Deliver **one** deployable home on **`p31ca.org`** that:

1. Preserves **Sovereign Cockpit / technical hub** shell (BaseLayout, WebGL hero, HUD, `/dome` CTA, styling).
2. Replaces ad-hoc and duplicate **product catalog** data with a **single registry-derived** graph consumed by the Astro home, about pipeline, and enrichment tooling.
3. Extends **ground truth** only where invariants are required; does not duplicate the full 48+ product list inside ground truth.
4. Produces a **reproducible** build (`hub:ci` → `astro build`) and **drift protection** in CI.
5. Documents **edge integration** (Workers / Pages) at the **inventory** level without pretending live mesh state — agents use real bindings, not this document alone.

This CWP is the **controlling** document for scope. Items not listed in §4 or the WBS are **out of scope** unless a revision bumps **Version** and adds tasks.

---

## 2. References (read order)

| # | Document / path | Use |
|---|------------------|-----|
| R1 | `andromeda/software/p31ca/DEPLOY.md` | Pages project `p31ca` vs `p31-hearing-ops` / other apps |
| R2 | `andromeda/software/p31ca/ground-truth/p31.ground-truth.json` | Route, redirect, and file-pin invariants |
| R3 | `andromeda/software/p31ca/scripts/hub/registry.mjs` | Authoritative product graph for hub |
| R4 | `P31-ROOT-MAP.md` (home) | Multi-root workspace tracks A/B/C |
| R5 | `AGENTS.md` (home) | Agent read order and verify commands |
| R6 | `.github/workflows/p31ca-hub.yml` (Andromeda) | Path-filtered `hub:ci` on `software/p31ca/**` |
| R7 | `.github/workflows/monorepo-verify.yml` (Andromeda) | Root `pnpm install` + deploy guard + Turbo `build` / `test` (includes hub when in workspace) |
| R8 | Root `scripts/inventory-cf.mjs` (P31 home, if present) | Optional pattern for Phase 4 — **extend or call** from `inventory-ecosystem.mjs`; avoid two diverging inventories |
| R9 | `andromeda/software/integration-handoff/CONTROLLED-WORK-PACKAGE-SUPER-CENTAUR.md` | **Ring D** — SUPER-CENTAUR ↔ mesh Workers (`phosphorus31.org`); **sister** CWP; **does not** merge into p31ca catalog (see R9 **§5** deliverables `D-SC*`; handoff source `CWP-30/mesh-bridge.ts`) |
| R10 | `andromeda/docs/corporate/` + `p31ca/public/open-doc-suite.html` | **P31 Open Doc Suite** — corporate one-pager, print HTML, Forge bridge; public hub surface `/open-doc-suite.html`, redirect `/doc-suite`; `p31.ground-truth` `sites.andromedaCorporate` + `routes.openDocSuite` |

**Related CWP:** **`CWP-P31-SC-2026-01`** (SUPER-CENTAUR) covers **phosphorus31.org** server integration with the **Worker** fleet. This ecosystem CWP (**`CWP-P31-ECO-2026-01`**) covers **`p31ca.org`** only. **Single inventory of Worker hostnames:** ECO **R8** / Phase **4.1** (`ECOSYSTEM-INVENTORY` or `inventory-cf` pattern) and SUPER-CENTAUR **D-SC7** (R9) must **not** fork into two stories — one canonical list, cross-checked in review.

---

## 2b. Ecosystem rings (reference — not additional scope)

Integration **does not** mean one deploy. These rings stay **separate**; this CWP only unifies **Ring A**’s **catalog and home path** and adds **Ring B**-adjacent **inventory documentation**.

| Ring | Role | Examples (tree) | In this CWP? |
|------|------|-----------------|--------------|
| **A — Public hub** | Catalog, about, `/dome`, static HTML apps | `p31ca/` → Pages **p31ca** | **Yes** (primary) |
| **B — Edge** | K₄, workers, relays | `k4-cage`, `k4-hubs`, `p31-agent-hub`, `donate-api`, `bonding` relay | **Doc / inventory only** (D7); no worker rewrites |
| **C — Full apps** | Own Pages / PWA, not the hub bundle | BONDING → `bonding.p31ca.org`; Spaceship Earth; `p31-hearing-ops` | **Out of scope** for merge; **registry links** stay correct |
| **D — Parallel org** | Different product | `phosphorus31.org` | **Excluded** (separate CWP) |

**Naming (implementers):** The npm package for the **hub** is `p31ca` (folder `software/p31ca`). The VS Code extension in `extensions/p31ca` is npm **`p31-centaur-ede`** — do not collide names when adding scripts or workspace entries.

---

## 3. Assumptions and constraints

- **A1** — `p31ca.org` remains deployed from **`software/p31ca`** → `dist/` → Cloudflare project **`p31ca`**.
- **A2** — `phosphorus31.org` stays a **parallel** release track (no code merge in this CWP).
- **A3** — Canonical **Sovereign Cockpit dome** is **`/dome`**; **OBSERVATORY** (panel map) is **`/observatory.html`** (see R2 `routes`).
- **A4** — Registry may contain **absolute** `appUrl`s (workers.dev, `bonding.p31ca.org`); the **hub grid** about links use **`*-about.html`** patterns generated from the same registry where applicable.
- **A5** — No live K₄ or KV state is read at build time; any future **health board** is **read-only** and optional in later task blocks.

---

## 4. Deliverables (outcomes)

| ID | Deliverable | Verification (see §8) |
|----|-------------|------------------------|
| D1 | **`hub-landing.json` (or successor)** is the **sole** data source for the **home** product grid and matches **reconciled** registry ids (no parallel `mvpData` on `/`). | G1, V1 |
| D2 | **`index.astro`** imports built JSON; **removes** long inline `coreProducts` / duplicate card sources. | G2, V1 |
| D3 | **Filter UI** (all / live / research / tool as designed) in **cockpit** styling, client script only where needed. | G3 |
| D4 | **`public/index.html`** is **not** the deployed home; either **removed** or **renamed** + **301** from legacy path; `mvpData` **eliminated** or **generated** from the same build as D1. | G4, V2 |
| D5 | **`enrich-mvp-about-pages.mjs` (and related)** read **JSON targets** (from `hub:build` output), not scraped `public/index.html`. | G5, V3 |
| D6 | **Ground truth** updated only for new **invariants** (e.g. legacy home redirect) — **not** the full product list. | R2 check |
| D7 | **`docs/`** (this file) + one **`ECOSYSTEM-INVENTORY.md`** (generated or semi-auto) listing CF **Pages** and **Worker** names tied to registry `appUrl` hostnames (warn-only where unknown). | G7 |
| D8 | **CI** — `p31ca-hub` (or follow-on job) runs **new drift checks** (no orphan `mvpData` home, enrich script contract). | G8 |

---

## 5. Exclusions (explicit non-goals for this CWP)

- Merging **phosphorus31.org** repo or deploy into p31ca.
- Rewriting **k4-cage** / **p31-agent-hub** business logic; only **documentation** and **optional** read-only health surfacing in a **later** task block.
- Replacing **Cognitive Passport** authoring flow; **sync/verify** unchanged except where paths to **hub** data are updated.
- Unifying **Three.js** versions across `dome.astro` and `observatory.html` (different products); see R2 pins.

---

## 6. Work breakdown structure (WBS)

### Phase 0 — Baseline and reconciliation

| Task ID | Task | Inputs | Outputs | Acceptance |
|---------|------|--------|---------|------------|
| **0.1** | Export **registry** id list and **`public/legacy-mvp-hub.html`** (or `index.html`) **mvpData** id list. | R3, `diff-index-sources.mjs` | **Snapshot:** `docs/ECO-P0-1-SNAPSHOT.md`; run `node scripts/hub/diff-index-sources.mjs` | Stakeholder sign-off on **target id set** for home (all listed products vs “about-backed only”) |
| **0.2** | Align **`COCKPIT_PRODUCT_IDS`** (or replace with **`HUB_INDEX_IDS`**) in `build-landing-data.mjs` with 0.1 decision. | 0.1 | Updated ordered id list; `hub-landing.json` regen | `npm run hub:verify` OK |
| **0.3** | Ensure **card fields** in JSON have **title, status, desc/tagline, tags, url** for every index row. | registry + builder | `hub-landing.json` schema stable | `hub:build` + optional JSON schema test |

### Phase 1 — Astro home: data-driven grid, cockpit shell retained

| Task ID | Task | Inputs | Outputs | Acceptance |
|---------|------|--------|---------|------------|
| **1.1** | `import` **`hub-landing.json`** in `index.astro` (or a thin `src/lib/hub-landing.ts` re-export). | D1 | No inline `coreProducts` array | Grep: no `const coreProducts = [` in `index.astro` |
| **1.2** | Map JSON **prototypes** / **research** blocks from builder if still needed; else drop redundant sections. | `build-landing-data.mjs` | Single scroll narrative | Visual review on `/` |
| **1.3** | Implement **filter bar** + client script; filter keys match **status** enum from JSON. | D1 | Working filters, no layout break with WebGL | Manual + optional Playwright |
| **1.4** | Preserve **WebGL** + **pointer-events** / `.interactive-zone` contract; no duplicate DOM ids (e.g. node panel). | current `index.astro` | Clean DOM | Lighthouse / a11y spot check |

### Phase 2 — Retire dual home; legacy routing

| Task ID | Task | Inputs | Outputs | Acceptance |
|---------|------|--------|---------|------------|
| **2.1** | If **`public/index.html`** must remain for emergency rollback: move to e.g. **`public/legacy-mvp-hub.html`**. | policy | file rename | `GET /legacy-mvp-hub.html` 200 |
| **2.2** | Add **`_redirects`** + **ground-truth** `edgeRedirects` **only if** a stable legacy URL must redirect (e.g. `/mvp/` → `/`). | 0.1 | R2 + `_redirects` match | `npm run verify:ground-truth` |
| **2.3** | Remove **CDN tailwind** dependency from the **home path**; home is Astro-only. | 2.1 | N/A for `/` | Build size / no duplicate index |

### Phase 3 — Tooling: enrich and generators

| Task ID | Task | Inputs | Outputs | Acceptance |
|---------|------|--------|---------|------------|
| **3.1** | Repoint **enrich** script(s) to **read `src/data/hub-landing.json`** (or exported list file). | D1, enrich source | No parse of `mvpData` in HTML | `npm run hub:about:enrich` (or named script) completes |
| **3.2** | Update **`generate-about-pages.mjs`** if it embeds a **duplicate** registry — **single** import from `registry.mjs` only (existing direction). | R3 | No duplicated product blocks out of sync | Diff review |
| **3.3** | Document in **`DEPLOY.md`**: “Home = Astro; legacy MVP HTML path = …” | this CWP | R1 updated | Read-through |

### Phase 4 — Ecosystem inventory (controlled, not live mesh)

| Task ID | Task | Inputs | Outputs | Acceptance |
|---------|------|--------|---------|------------|
| **4.1** | Add script **`scripts/inventory-ecosystem.mjs`** (or **wrap** home `inventory:cf` / `scripts/inventory-cf.mjs` **R8**) that: (a) lists **registry** `appUrl` hostnames, (b) optional glob **`wrangler.toml`** / **`wrangler.jsonc`** under `software`, (c) emits **`docs/ECOSYSTEM-INVENTORY.md`**. | R3, R8, repo glob | D7 | File committed; CI `dry-run` on PR |
| **4.2** | **No** required live fetches in CI; **warn** on unmapped hostnames. | 4.1 | Log output | No failing network in GitHub by default |

### Phase 5 — CI hardening and closure

| Task ID | Task | Inputs | Outputs | Acceptance |
|---------|------|--------|---------|------------|
| **5.1** | Add **drift** step to **`p31ca-hub`** and/or **prebuild**: fail if `public/index.html` contains **`mvpData`** after sunset date, or if **0.1 diff script** / **`grep`** finds duplicate home catalog pattern (team-defined). Prefer **one** authoritative check so local `npm run hub:ci` matches CI. | 2.1, 3.1, 0.1 | Job step or Node guard | Green main; fork PRs: no **secrets** required |
| **5.2** | **CWP closure**: update **Version** to `1.1.0` and **Status** to `Complete` with date and PR link. | PRs | This file | Maintainer |

---

## 7. Verification matrix

| Code | Test |
|------|------|
| **G1** | `hub-landing.json` row count and ids match WBS 0.1 decision; `hub:verify` passes. |
| **G2** | `index.astro` uses imported JSON; build succeeds. |
| **G3** | Filters change visible set; counts consistent with data. |
| **G4** | Production **`/`** is Astro build (same checks as `DEPLOY.md` recovery). |
| **G5** | Enrich script uses JSON path; no `mvpData` string in enrich source. |
| **G6** | `verify:ground-truth` after redirect edits. |
| **G7** | `ECOSYSTEM-INVENTORY.md` present and under **400** lines or split by follow-on CWP. |
| **G8** | CI workflow runs new steps without **external** Cloudflare API secrets on fork PRs (or gated). |

| Code | Type |
|------|------|
| **V1** | `npm run hub:ci` in `p31ca` |
| **V2** | Manual: `npx wrangler pages deploy` dry-run or dashboard spot-check (operator) |
| **V3** | Script dry-run in CI |

---

## 8. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Wrong **Pages** project gets `dist` | R1; deploy checklist in PR template |
| **WebGL** + filters **jank** | 1.4; performance budget on hero script |
| **Id** mismatch breaks about links | 0.2; `hub:verify` graph checks |
| **Fork** PRs fail CI (inventory) | 4.2 warn-only; secrets gated |
| **Registry** size hurts HTML payload | Lazy section or split JSON by tab (follow-on) |

---

## 9. Dependencies (external)

- Cloudflare **dashboard** access for custom domains and project names.
- **Operator** sign-off on **0.1** (which products appear on `/`).

---

## 10. Rollback

1. Revert the merge PR in Git; redeploy last known good **`p31ca`** deployment from **Pages → Rollback**.
2. If **`public/index.html`** was removed: restore from Git history to **`public/legacy-mvp-hub.html`** and temporary link in nav (emergency only).
3. Ground-truth: revert `edgeRedirects` to previous **JSON + `_redirects`** pair; run `verify:ground-truth`.

---

## 11. Configuration management

| Change | Action |
|--------|--------|
| New invariant route | R2 + `_redirects` + `verify:ground-truth` |
| New product on home | `registry.mjs` + (if in index) **WBS 0.2** id list + `hub:build` |
| This CWP revised | Increment **Version**, log **Change log** table below |

### Change log

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-04-25 | Initial issue |
| 1.0.1 | 2026-04-25 | Added §2b (rings), R6–R8, optional `diff-index-sources`, `inventory-cf` alignment, CI drift notes for 5.1 |
| 1.0.2 | 2026-04-25 | Added **R9** and pointer to **CWP-P31-SC-2026-01** (SUPER-CENTAUR) for Ring D; inventory alignment note |
| 1.0.3 | 2026-04-25 | Clarified R9 paragraph: **R8** + **D-SC7** (not R6–R8) for single Worker host inventory |

---

*End of CWP `CWP-P31-ECO-2026-01`*
