# Controlled Work Package — Interactive Operator UI (cognitive load shell)

| Field | Value |
|--------|--------|
| **CWP ID** | `CWP-P31-UI-2026-01` |
| **Title** | Fully interactive P31 operator interface: unified shell, glass-box visibility, tag in/out, and progressive disclosure |
| **Version** | 1.1.0 |
| **Effective date** | 2026-04-26 |
| **Status** | **Complete (v1.1.0)** — A–C shipped; **hub** discovery (nav + banner); **local** command-center extended; **glass** aggregate summary on `/ops/`. EPCP Worker deploy remains operator-owned. |
| **Applies to** | **`andromeda/software/p31ca`** (primary route `/ops/`); **home** `scripts/ecosystem-glass.mjs`, `p31-ecosystem.json`, `operator-shift.mjs`; **edge** `cloudflare-worker/command-center` (read-only integration + health); **orchestrator** Worker (mutations — **not** implemented in Astro alone). **Does not** merge `phosphorus31.org` SUPER-CENTAUR UI without sister CWP **`CWP-P31-SC-2026-01`** alignment. |

**Sister packages (do not conflate):**

| ID | Role |
|----|------|
| **`CWP-P31-ECO-2026-01`** | Catalog, registry, hub home — same Ring A tree; UI shell **adds** navigation, does **not** replace registry graph. |
| **`CWP-P31-SC-2026-01`** | Ring D org server + `mesh-bridge` — optional deep link from shell only. |
| **EPCP command-center** | Worker operator glass — may be **embedded** or linked as **fleet** source (see §4 D-UI-4). |

---

## 1. Purpose

Deliver **one** primary **interactive frame** on **`p31ca.org`** so the operator can:

1. **Navigate** personal, mesh/fleet, and mutation planes without losing context (fixed chrome, ≤4 top-level nav items).
2. **Reduce cognitive load** via **progressive disclosure** (ambient → meso → micro), a **global density control** (calm / standard / deep), and **no** interrupt-driven modal spam for status (Calm Technology).
3. **See inside the machine** via a **glass box** panel fed by **canonical URLs** (`p31-constants.json`, `p31-ecosystem.json` probes) — aggregated green/amber/red, raw detail on demand.
4. **Tag in / tag out** of on-call focus: **local** audit trail today (`~/.p31/operator-shift.jsonl`); **Phase C** persists to **edge** (KV/DO or command-center) for multi-device truth.
5. **Respect trust boundaries**: static HTML is **not** auth; orchestrator + EPCP mutations stay **Worker-gated** per **`docs/EDGE-SECURITY.md`**.

This CWP is the **controlling** document. Work not listed in §4 or §6 is **out of scope** unless **Version** is bumped and WBS extended.

---

## 2. References (read order)

| # | Document / path | Use |
|---|------------------|-----|
| R1 | `P31-ROOT-MAP.md` (home) | Multi-root tracks A/B/C; where code lives |
| R2 | `AGENTS.md` (home) | Verify commands, ecosystem glass, operator shift |
| R3 | `p31ca/docs/EDGE-SECURITY.md` | Orchestrator / edge trust boundary |
| R4 | `p31-constants.json` (home) | Mesh URLs, bonding URL — **no invented hosts** |
| R5 | `p31-ecosystem.json` (home) | Glass probes + deployables order |
| R6 | `Neuro-Inclusive Mesh Dashboard Design.txt` (home) | UX principles; **trim** internal metaphors from user-facing copy |
| R7 | `docs/HANDOFF-PROMPT-COMMAND-CENTER.md` (home) | EPCP vs orchestrator map |
| R8 | `p31ca/ground-truth/p31.ground-truth.json` | Routes registry; new public paths |
| R9 | `p31ca/scripts/hub/registry.mjs` | Optional hub card for “Operator shell” when stable |
| R10 | `andromeda/.../command-center/CLOSURE.md` | EPCP bindings + `/api/health` |
| R11 | `CWP-P31-ECO-2026-01` | Hub data pipeline — shell **consumes**, does not fork catalog |

---

## 3. Ecosystem rings

| Ring | This CWP |
|------|----------|
| **A — p31ca.org** | **Primary.** `/ops/` shell, components, client islands. |
| **B — Edge Workers** | **Read** health/mesh JSON; **write** only via documented APIs; command-center + orchestrator URLs from constants/manifest. |
| **C — Other Pages** | Link-out to BONDING, EPCP URL — no merge. |
| **D — phosphorus31.org** | **Out of scope** unless optional link row; SUPER-CENTAUR remains sister CWP. |

---

## 4. Assumptions and constraints

- **A1** — Operator uses **initials S.J. / W.J.** for children in any **new** copy; no full names.
- **A2** — **Prefers-reduced-motion** and **contrast** are **P0** for the shell (WCAG-oriented).
- **A3** — **3D** (K₄ / R3F) is **optional** and only in phases where it **reduces** reading load; 2D fallback always exists.
- **A4** — **No** world-writable orchestrator routes from static pages; UI shows **401/403** as “auth required,” not fake success.
- **A5** — **npm run verify** (home) and **`p31ca`** **`verify:ground-truth`** / **`hub:ci`** stay green unless a **listed** exception is documented in the PR.

---

## 5. Deliverables

| ID | Deliverable | Verification |
|----|-------------|--------------|
| **D-UI-1** | **`/ops/`** Astro route **registered** in **`p31.ground-truth.json`** `routes.operatorShell`; scaffold page **ships** with persistent nav + placeholder panels. | G-UI-1, V-UI-1 |
| **D-UI-2** | **Nav model** documented in code comments: Personal · Mesh · Actions · Docs (or equivalent ≤4). | Code review |
| **D-UI-3** | **Density control** (at least 3 levels) **persisted** in `sessionStorage` or URL param; **reduced-motion** disables non-essential animation. | G-UI-2 |
| **D-UI-4** | **Glass box** panel: client or **server** fetch to **public** probe URLs only; surfaces **summary** + expand to **per-probe** rows; no secrets in browser. | G-UI-3 |
| **D-UI-5** | **Tag in/out** UX: buttons that call **local** script instructions or **future** Worker API; **show** link to **`npm run operator:shift-status`** until Phase C. | G-UI-4 |
| **D-UI-6** | **Orchestrator** and **EPCP** surfaces **linked** or **embedded iframe** only where **CORS** + **X-Frame-Options** allow; otherwise **new tab** with warning. | Manual |
| **D-UI-7** | **CI**: `verify:ground-truth` green; root `verify:ecosystem` green; no new **orphan** `_redirects` rules. | V-UI-2 |
| **D-UI-8** | **Closure PR** updates **Version** to `1.1.0`, **Status** `Complete`, **Change log** with links. | Maintainer |

---

## 6. Work breakdown structure (WBS)

### Phase 0 — Scaffold and contract (✅ v1.0.0 baseline)

| Task ID | Task | Outputs | Acceptance |
|---------|------|---------|------------|
| **UI-0.1** | Add **`src/pages/ops/index.astro`** + **`routes.operatorShell`** in R8. | D-UI-1 | `GET /ops/` 200 in `astro dev` / preview |
| **UI-0.2** | Author **this CWP** + home **pointer** doc. | D-UI-2 (doc) | Reviewer can execute from WBS alone |
| **UI-0.3** | Wire **SharedFooter** or minimal **inline nav** to **`/`**, **`/orchestrator`**, **`/lattice.html`**, **`/connect.html`**, **`cognitive-passport`** path. | Nav | All links 200 on preview |

### Phase A — Cognitive load primitives

| Task ID | Task | Outputs | Acceptance |
|---------|------|---------|------------|
| **UI-A.1** | Implement **density** state + CSS variables (e.g. `--p31-ui-density-sparse|…`). | D-UI-3 | **Done (v1.0.1):** `data-density` calm/standard/deep, `--ops-pad` / `--ops-text` / `--ops-gap`, `sessionStorage` + `?density=` |
| **UI-A.2** | **Ambient status strip** (single row): merge orchestrator reachability + optional **ecosystem JSON** summary fetch. | — | **Done (v1.0.1):** client GET to k4-personal `/api/health`, orchestrator `/api/orchestrator/status`, command-center `/api/health` — one line, green/amber/red border |
| **UI-A.3** | **Focus mode** (hides secondary chrome). | — | **Done (v1.0.1):** `.ops-focus` hides `.ops-aux` only; **density + pulse strip stay**; Esc or **Exit focus** |

### Phase B — Glass box (read-only)

| Task ID | Task | Outputs | Acceptance |
|---------|------|---------|------------|
| **UI-B.1** | **`scripts/ops/ingest-glass-probes.mjs`** resolves `p31-ecosystem.json` + `p31-mesh-constants.json` + `p31-constants.json` bonding → **`src/data/ops-glass-probes.json`**. Prebuild runs ingest; **Andromeda-only** checkout **skips** if no home ecosystem and **keeps** committed JSON. **`npm run ops:ingest`** in p31ca for manual regen. | D-UI-4 | **Done (v1.0.2):** `/ops/` table lists all probes; client GET fills level / HTTP / ms |
| **UI-B.2** | Optional: **server/BFF** aggregate if CORS blocks a probe class-wide. | — | Not required v1 — document per-URL if observed |

### Phase C — Tag in/out (edge)

| Task ID | Task | Outputs | Acceptance |
|---------|------|---------|------------|
| **UI-C.1** | **command-center** Worker: `GET/POST/OPTIONS /api/operator/shift`, **KV** audit + public row, **CORS** for p31ca.org, **POST** `withAccess` **operator**. | D-UI-5 | **Done (v1.0.3):** see `command-center/src/index.js`; deploy Worker to activate |
| **UI-C.2** | **`/ops/`** fetches **GET** public state; copy links to EPCP for **POST**. | — | **Done:** `#ops-edge-shift-line` live text |

### Phase D — Mutations in-frame

| Task ID | Task | Outputs | Acceptance |
|---------|------|---------|------------|
| **UI-D.1** | **Embed** or **link** orchestrator **approve** flows; **error** states for 401. | D-UI-6 | E2E optional |
| **UI-D.2** | **EPCP** status write — **out of frame** until Access cookie story is validated; **link** to **`command-center.p31ca.org`** or **workers.dev** with disclaimer. | — | No secrets in git |

### Phase E — Optional 3D navigator

| Task ID | Task | Outputs | Acceptance |
|---------|------|---------|------------|
| **UI-E.1** | **K₄** **preview** using **connect.html** patterns or **dome** shared Three pin — **behind** “deep” density + **reduced-motion** off. | — | `verify:ground-truth` Three pins unchanged for **other** products |

### Phase F — Closure

| Task ID | Task | Outputs | Acceptance |
|---------|------|---------|------------|
| **UI-F.1** | **Hub** discovery: **`/`** nav **Ops** + hero-region banner → **`/ops/`** (no separate `*-about.html`; avoids COCKPIT grid coupling). | — | **Done (v1.1.0)** |
| **UI-F.2** | **CWP** **Version** `1.1.0` **Status** `Complete`. | D-UI-8 | **Done** |

---

## 7. Exclusions

- Replacing **orchestrator** or **command-center** **Workers** with static-only logic.
- **Unifying** **phosphorus31.org** front-end into p31ca (Ring D).
- **Storing** **health** or **spoon** data that violates **K₄** personal isolation (see k4-personal CWP) without explicit bridge CWP.
- **Production** **WebAuthn** or **passkey** flows in the shell (remain on **`/auth.html`** / passkey Worker CWP track).

---

## 8. Verification matrix

| Code | Test |
|------|------|
| **G-UI-1** | `npm run verify:ground-truth` in `p31ca`; `GET /ops/` returns HTML with `CWP-P31-UI-2026-01` marker |
| **G-UI-2** | Manual: density toggle changes layout; `prefers-reduced-motion` **CSS** **media** **query** **reduces** **motion** |
| **G-UI-3** | Glass panel lists ≥5 probes; colors match **ecosystem-glass** semantics (up/auth/warn/down) |
| **G-UI-4** | Tag UX visible; docs link to home **`operator:shift-*`** or API after Phase C |

| Code | Type |
|------|------|
| **V-UI-1** | `npm run hub:ci` in `p31ca` (when tree present) |
| **V-UI-2** | Root `npm run verify` (includes `verify:ecosystem`) |

---

## 9. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **CORS** on mesh GETs | BFF or **Workers** proxy (Phase B.2); document |
| **iframe** blocked by **X-Frame-Options** | **Open in new tab**; no forced embed |
| **Scope creep** (3D first) | WBS: Phase E **after** A–B |
| **Drift** vs **p31-ecosystem.json** | Single **generate** script from JSON in CI (follow-on task) |

---

## 10. Rollback

1. **Revert** `/ops/` route PR; remove **`routes.operatorShell`** from R8; redeploy **p31ca** Pages.
2. **Restore** **ground-truth** from previous commit; **`verify:ground-truth`** + **`_redirects`** pair consistent.
3. **No** KV/DO migration rollback needed until Phase C.

---

## 11. Configuration management

| Change | Action |
|--------|--------|
| New public **path** | R8 + (if short URL) `edgeRedirects` + `_redirects` + `verify:ground-truth` |
| New **probe** | R5 + optional **generate** for `src/data` |
| **Orchestrator** URL | R4 + **`npm run apply:constants`** |

---

## 12. Change log

| Version | Date | Notes |
|---------|------|--------|
| 1.0.0 | 2026-04-26 | Initial issue: CWP + `/ops/` scaffold + ground-truth `operatorShell` route |
| 1.0.1 | 2026-04-26 | Phase A: density dial, ambient system pulse (3 edge GETs), focus mode, `prefers-reduced-motion` |
| 1.0.2 | 2026-04-26 | Phase B: ingest pipeline + full glass table on `/ops/` (parallel GETs, ok/auth/warn/down) |
| 1.0.3 | 2026-04-26 | Phase C: `/api/operator/shift` on EPCP Worker (KV + CORS); `/ops/` shows live public shift + home `p31-ecosystem` glass probe |
| 1.1.0 | 2026-04-26 | **Closure:** hub **`/`** links **Ops** (top nav) + **G.O.D.** banner; **`npm run command-center`** adds verify / mesh / glass / shift-status; `/ops/` **glass summary** line after parallel probes |

---

## 13. Acceptance sign-off (template)

| Role | Name | Date | OK |
|------|------|------|-----|
| Implementer | | | ☐ |
| Operator | | | ☐ |
