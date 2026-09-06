# CWP-32 — decisions (Initial Build strict plan §12)

**CWP:** `CWP-P31-IB-2026-01`  
**Closes:** `INITIAL-BUILD-SITE-STRICT-PLAN.md` section 12 + deliverable **D-IB10**.

| # | Topic | Decision | Notes |
|---|--------|----------|--------|
| 1 | Onboard path I / II / III (strict plan §10) | **III — Parallel** | `planetary-onboard.html` remains the Wye→Delta **narrative**; `initial-build.html` + `/build` is the CWP **entry** and future intake/bake. Handoff: links between surfaces; **S_rebuild** when a full build UI exists (not blocking static shell v0). |
| 2 | Meta key Option A vs B (strict plan §5.1) | **Option B for bake record** | When the intake→bake flow ships, persist `p31_build_record` (schema `p31.buildRecord/0.1.0` per plan §6.3). Keep `p31_onboard_meta` for onboard/mesh copy; do not merge into one key until a later CWP chooses Option A. |
| 3 | `u_` id length (32 vs 64 hex) | **32 hex** after `u_` | Single-sourced in `p31ca/public/lib/p31-subject-id.js` (`p31DigestRawCredentialIdToUSubjectId`); must stay aligned with any passkey worker binding docs. |
| 4 | Hub `href` allowlist file location | **Inline first; ground-truth later** | MVP validation can live in the build static bundle. When the allowlist is shared with CI, add a **`ground-truth/` JSON** (or `fileSnippets` in `p31.ground-truth.json`) in a CWP minor — do not fork multiple lists. |
| 5 | MVP handoff URL | **`mesh-start.html`** | Optional `?welcome=` / query passthrough when onboard or build sets it; default path matches existing flows. |
| 6 | Bake telemetry | **Client-only for v0** | `p31_build_record` + `console` for dev; no Worker audit log requirement for Initial Build v0. |

**Identity helper (D-IB4):** `https://p31ca.org/lib/p31-subject-id.js` — `p31DeriveSubjectId` used by `planetary-onboard.html`.
