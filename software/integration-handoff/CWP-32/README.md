# CWP-32 — Initial Build (IB) handoff

**Parent:** [`CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md`](../CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md) — `CWP-P31-IB-2026-01` — **Issued for execution** (production)

| Artifact | Purpose |
|----------|---------|
| [`deliverables-matrix.json`](./deliverables-matrix.json) | Machine-readable D-IB* status and PR links |
| [`DECISIONS.md`](./DECISIONS.md) | Closes strict plan §12 (onboard path, meta keys, allowlist, telemetry) — **D-IB10** |
| [`../INITIAL-BUILD-SITE-STRICT-PLAN.md`](../INITIAL-BUILD-SITE-STRICT-PLAN.md) | Normative P/Q invariants, state machine, `PUT` order, failure matrix (`P31-IB-PLAN-2026-01`) |
| `p31ca/public/initial-build.html` | Production shell; short URL **https://p31ca.org/build** (redirect) |
| `p31ca/public/lib/p31-subject-id.js` | `p31.subjectIdDerivation/0.1.0` — shared `u_*` / `guest_*` with `planetary-onboard.html` — **D-IB4** |
| `p31ca/public/lib/p31-initial-build-bake.js` | `PUT /state` → `PUT /tetra` + `p31.buildRecord/0.1.0` → `localStorage` — **D-IB5, D-IB6** |
| [`RUNBOOK.md`](./RUNBOOK.md) | Re-entry + partial-failure **D-IB8** |

**Sister CWPs:** `CWP-P31-PAR-2026-01` (Personal Agent Room), `CWP-P31-ECO-2026-01` (catalog), `CWP-P31-SC-2026-01` (SUPER-CENTAUR).

**Verify**

- `npm run verify:ground-truth` (p31ca) — `routes.initialBuild`, `/build` redirect, `initialBuild.page` + `subjectIdDerivation.lib` + `initialBuild.bakeModule` snippets
- P31 home: `npm run verify:constants`, `npm run verify:mesh`

**Closure (IB-6)**

- Parent CWP version **1.1.0**, **Status: Complete**; this matrix: all `D-IB*` `done` with PR links; **D-IB10** in [`DECISIONS.md`](./DECISIONS.md).
