# Controlled Work Package — SUPER-CENTAUR ↔ Mesh Edge Integration

| Field | Value |
|--------|--------|
| **CWP ID** | `CWP-P31-SC-2026-01` |
| **Title** | Full SUPER-CENTAUR production integration (phosphorus31.org) with Andromeda mesh Workers |
| **Version** | 1.0.1 |
| **Effective date** | 2026-04-25 |
| **Status** | Issued for execution |
| **Applies to** | **`phosphorus31.org` tree** (Ring **D** — parallel org site); **Andromeda** handoff: `integration-handoff/CWP-30/`, `unified-k4-cage/`; **read-only** touch to **`p31ca`** registry/docs for cross-links only |

**Related (do not conflate):**

| Name | What it is |
|------|------------|
| **SUPER-CENTAUR** | Server app on **`phosphorus31.org`** (e.g. Express) that, in **production**, exposes browser/API routes that **proxy** to the **trimtab-signal** Worker fleet. |
| **CWP-30** | Canonical **TypeScript** handoff: `integration-handoff/CWP-30/mesh-bridge.ts` — copy to `SUPER-CENTAUR/src/mesh-bridge.ts` in the **phosphorus** repo. |
| **p31-centaur-ede** | **VS Code extension** in Andromeda (`software/extensions/p31ca/`, npm `p31-centaur-ede`). **Not** the same deploy as SUPER-CENTAUR. |
| **CWP-P31-ECO-2026-01** | Ecosystem CWP for **`p31ca.org`** catalog/home unification. **Sister** document; no merge of Ring D into Ring A. |

---

## 1. Purpose

1. **Wire** the production **SUPER-CENTAUR** server so it registers **`meshProxy(app)`** (from the handoff) **before** other routes, in **`NODE_ENV=production`**, per `CWP-30/mesh-bridge.ts` comments.
2. **Align** the **MESH** URL map in `mesh-bridge.ts` with the **current** Worker `workers.dev` / custom hostnames (no stale endpoints).
3. **Resolve** **auth** proxy paths with **`p31-bouncer`** (or document intentional stubs until bouncer implements `/auth` / `POST` as assumed — see file header NOTE).
4. **Validate** end-to-end: **`GET /api/mesh`**, **spoons**, **fleet health** (Centaur’s **`/api/fleet/health`**) and Worker **`FLEET_HEALTH_PATHS`** in code.
5. **Document** the integration for operators and agents (this CWP + **phosphorus** `README` or `SUPER-CENTAUR/README`), without claiming live mesh numbers except via **fetched** JSON or **registry**-documented URLs.
6. **Optionally** add a **registry** row or hub footnote in **`p31ca`** that points to **phosphorus31.org** for “Centaur / org programs” (already a brand boundary in `P31-ROOT-MAP.md`).

---

## 2. References

| # | Path / artifact | Use |
|---|------------------|-----|
| R1 | `software/integration-handoff/CWP-30/mesh-bridge.ts` | **Source of truth** to copy; contains `MESH`, routes, `meshProxy`, `FLEET_HEALTH_PATHS` |
| R2 | `software/unified-k4-cage/README.md` § “SUPER-CENTAUR bridge” | Deploy instructions pointer |
| R3 | `k4-cage/wrangler.toml` | `k4-cage` name and **custom domain** (if any) — reconcile with `MESH.cage` |
| R4 | `k4-personal/`, `k4-hubs/`, `p31-agent-hub/` | Service shapes for proxy targets |
| R5 | `P31-ROOT-MAP.md` | Ring D vs technical hub (Track B) |
| R6 | `p31ca/docs/CONTROLLED-WORK-PACKAGE-ECOSYSTEM-INTEGRATION.md` (v1.0.2+, **CWP-P31-ECO-2026-01**) | **Sister** CWP — inventory task **4.1** / **R8**; align **D-SC7** here with ECO’s single inventory; **one** host list (see ECO R9) |
| R7 | Home `validate-p31-full.sh` / `audit_runner.py` (if present) | **SUPER-CENTAUR** P1 checks — update paths if `phosphorus` tree layout changes |
| R8 | Root `scripts/inventory-cf.mjs` | Cloudflare inventory — **include** `MESH` hosts when reconciling **docs/ECOSYSTEM-INVENTORY** (from ECO CWP) |

---

## 3. Ecosystem rings (what this CWP owns)

| Ring | This CWP |
|------|----------|
| **A — p31ca.org** | **Out of scope** for implementation; **optional** single registry link / copy only. |
| **B — Edge Workers** | **Read/verify** only: URLs in `MESH` must match deployed names; no Worker rewrites *here* unless a bugfix is required in `mesh-bridge.ts` in **Andromeda** and re-copied. |
| **C — Other Pages apps** | Out of scope. |
| **D — phosphorus31.org / SUPER-CENTAUR** | **Primary** implementation surface (repo may live outside this workspace copy). |

---

## 4. Assumptions and constraints

- **A1** — SUPER-CENTAUR uses **Node** + **Express** (or compatible `Application` type) as in the handoff `import type { Application, … } from 'express'`.
- **A2** — **Development**: `meshProxy` **no-ops** (local routes win). **Production** must set **`NODE_ENV=production`** on the **phosphorus** host.
- **A3** — Cross-origin browser calls from **`p31ca.org`** to **`phosphorus31.org`**, if any, require **CORS** and **credentials** policy — **out of code** in Andromeda unless you add a **small** doc task in WBS; **separate** security review.
- **A4** — Vertex labels (`will`, S.J., W.J., etc.) in public routes follow **`.cursorrules`** / privacy rules in **copy**; **not** re-litigated in this CWP.
- **A5** — `mesh-bridge` **NOTE** on bouncer (`GET /health` vs `POST /auth`) is **binding** — either fix bouncer, **or** fix proxy paths, **or** document “not yet wired” and disable those routes in prod until ready.

---

## 5. Deliverables

| ID | Deliverable | Verification |
|----|-------------|--------------|
| **D-SC1** | `mesh-bridge.ts` **present** in `phosphorus31.org/.../SUPER-CENTAUR/src/` and **sourced** from R1 (version/hash noted in **phosphorus** README) | File diff or checksum vs Andromeda |
| **D-SC2** | **`meshProxy(this.app)`** (or `app`) called at **start** of route registration in the **server bootstrap** (e.g. `super-centaur-server.ts` — name may differ) | Code review; prod only |
| **D-SC3** | **`MESH` constants** match **live** Worker URLs (spot-check `curl` to each `FLEET_HEALTH_PATHS`) | Manual or scripted smoke |
| **D-SC4** | **`GET /api/fleet/health`** on **Centaur** returns **degraded/all_up** JSON with per-worker row | **HTTP 200** in prod |
| **D-SC5** | **`GET /api/mesh`** via Centaur **proxies** to **k4-cage** and returns **JSON** (shape per cage API) | Integration test or curl |
| **D-SC6** | **Auth** story documented: which routes are **live** vs **501**/disabled | **phosphorus** doc |
| **D-SC7** | **Sister** inventory line: **ECO** `ECOSYSTEM-INVENTORY.md` (when added) or **MESH** table lists **p31-agent-hub**, **k4-cage**, **k4-personal**, **k4-hubs**, **p31-bouncer**, **reflective-chamber** with same hosts as D-SC3 | R6/R8 cross-check |
| **D-SC8** | **`validate-p31-full.sh`** (or replacement) P1: paths to **`phosphorus31.org/.../SUPER-CENTAUR`** or **static** `mesh-bridge` grep updated so CI doesn’t false-fail | Script exit 0 on golden path |

---

## 6. Work breakdown structure (WBS)

### Phase 0 — Baseline in phosphorus repo

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **SC-0.1** | Clone/open **`phosphorus31.org`** tree; locate **`SUPER-CENTAUR`**, `super-centaur-server.ts` (or entry), and **production** start command. | Map doc | File paths written in **D-SC6** doc |
| **SC-0.2** | **Diff** R1 `mesh-bridge.ts` against any **existing** `mesh-bridge` in **phosphorus** (if any). | Diff report | Conflicts resolved — **Andromeda** copy is **canonical** unless phosphorus has a **signed** local patch (document delta). |

### Phase 1 — Install handoff and wire server

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **SC-1.1** | **Copy** R1 → `SUPER-CENTAUR/src/mesh-bridge.ts` (path per R2). | D-SC1 | `meshProxy` export exists; TypeScript build passes |
| **SC-1.2** | `import { meshProxy } from './mesh-bridge'` in server; **`meshProxy(app)`** as **first** route registration in prod. | D-SC2 | Prod deploy; smoke |
| **SC-1.3** | Add **env** e.g. `MESH_CAGE_BASE` **optional** override — **not required** in v1; if skipped, use hardcoded `MESH` in file | N/A or future CWP | — |

### Phase 2 — URL reconciliation and health

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **SC-2.1** | For each `MESH` key, run **`FLEET_HEALTH_PATHS`** fetch (local script or `curl` checklist). | Table | D-SC3; fix typos in **Andromeda** `mesh-bridge.ts` if URL wrong, **re-copy** to phosphorus |
| **SC-2.2** | Exercise **`/api/fleet/health`** on deployed **phosphorus** (production). | Screenshot or JSON log | D-SC4 |
| **SC-2.3** | Exercise **`/api/mesh`**, **`/api/vertex/:id`** sample. | D-SC5 | 200 or documented 4xx for missing data |

### Phase 3 — Auth and bouncer alignment

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **SC-3.1** | Read **p31-bouncer** routes in repo; compare to `mesh-bridge` `/api/auth/*` | D-SC6 | Either **wire** bouncer, **or** **comment out** / **return 501** for unimplemented **Centaur** routes in prod, **or** point proxy to real paths |
| **SC-3.2** | If browser sessions needed: **cookie** + **SameSite** note in **D-SC6** | Doc | — |

### Phase 4 — Cross-repo documentation and p31ca touch (optional, minimal)

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **SC-4.1** | Update **`P31-ROOT-MAP.md`** or **phosphorus** README: “SUPER-CENTAUR uses `mesh-bridge` from Andromeda `CWP-30`.” | One PR | Link to R1 |
| **SC-4.2** | **Optional** — `p31ca` **registry** `techNotes` or new **stub** product “Org programs (Centaur)” with `appUrl: https://phosphorus31.org/...` | Single row | ECO CWP A2 respected (no merge) |
| **SC-4.3** | Align **R6** **ECOSYSTEM-INVENTORY** with **MESH** list (D-SC7) | Markdown | ECO WBS 4.1 consumer |

### Phase 5 — Home validation scripts and closure

| ID | Task | Output | Acceptance |
|----|------|--------|------------|
| **SC-5.1** | Update **`validate-p31-full.sh`** (and **`audit_runner.py`**) to match **actual** public URLs of **mesh-bridge** or static asset checks — **no** dead `curl` to wrong paths. | D-SC8 | CI green |
| **SC-5.2** | **CWP closure**: set **Status** to `Complete`, **Version** `1.1.0`, **Change log** with PR link. | This file | Maintainer |

---

## 7. Exclusions

- Rebuilding the **entire** SUPER-CENTAUR **UI** (React/Vue) — not required for **mesh** integration.
- **Migrating** SUPER-CENTAUR to **Cloudflare Workers** (remains a **separate** Node app for this CWP).
- **Merging** **phosphorus** into Andromeda monorepo.
- **Changing** **k4-cage** **REST** contract without a **CWP-30** revision and version bump in **mesh-bridge.ts** (R1).

---

## 8. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **Prod** registers **dev** behavior | **Assert** `NODE_ENV=production` in deploy **runbook**; add startup log: `[mesh-bridge] production — mesh proxy routes registered` |
| **502** to Workers | **Network** from **phosphorus** host to **workers.dev** (egress); check firewall |
| **PII** through Centaur | **k4-personal** routes; document **data flow**; use **TLS**; minimal logging |
| **Drift** between handoff and prod | **D-SC1** version pin; re-copy on each **MESH** change in Andromeda |

---

## 9. Rollback

1. **Comment out** `meshProxy(app)` in **phosphorus** server; redeploy.
2. Restore previous **`mesh-bridge.ts`** from **git** in **phosphorus** (if any).
3. Revert Andromeda **R1** only if the rollback was due to a **bad** handoff (prefer forward-fix).

---

## 10. Configuration management

| Change | Action |
|--------|--------|
| New Worker hostname in `MESH` | Edit **R1** in Andromeda → copy to phosphorus → deploy both docs |
| New proxy route (e.g. **telemetry** POST) | CWP **revision**; add route in R1, **unit** test if added to repo |
| CWP text updated | **Version** + **Change log** below |

### Change log

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-04-25 | Initial issue — full WBS for SUPER-CENTAUR + mesh bridge |
| 1.0.1 | 2026-04-25 | **R6** clarified vs ECO v1.0.2+; **CWP-P31-ECO-2026-01** id; Notes **§11** AGENTS line is **done** in home `AGENTS.md` |

---

## 11. Notes (follow-on, not blocking SC-0)

- **Registry vs prose:** Mesh **counts** and **“live”** claims follow home **`AGENTS.md`** rule **#1** (bindings / **ground truth** / registry—**not** WCD narrative alone). **(Done.)**
- **SEO (p31ca):** When **`/`** is data-driven, set **one** canonical and description in **BaseLayout** (ECO CWP follow-on, not this file).
- **Payload:** Full **graph** in JSON is **ECO** D1; **SC** does not require a large **home** JSON — only **cross-links** and **inventory** alignment.

---

*End of CWP `CWP-P31-SC-2026-01`*
