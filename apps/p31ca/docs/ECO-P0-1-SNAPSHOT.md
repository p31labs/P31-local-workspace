# ECO WBS 0.1 — Index source diff snapshot

**Status:** **Cockpit parity sealed** — `hub-landing.json` ↔ `HUB_COCKPIT_ORDER` only; **`public/legacy-mvp-hub.html`** absent. Normative ADR (P31 home repo): `docs/ADR-ECO-HUB-SINGLE-SOURCE.md`.
**Last verified:** 2026-04-27

## Command

```bash
cd andromeda/software/p31ca
npm run hub:diff
# same as verify-ground-truth && diff-index-sources
```

Or standalone drift check:

```bash
node scripts/hub/diff-index-sources.mjs
```

## Last output (clean — canonical)

```
diff-index-sources: hub-landing + optional mvpData index

[info] public/legacy-mvp-hub.html absent — mvpData parse skipped (expected). Normative ADR: P31 home docs/ADR-ECO-HUB-SINGLE-SOURCE.md
diff-index-sources: OK (ground truth + hub-landing alignment)
```

## Interpretation

- **`src/data/hub-landing.json`** is generated solely from **`registry.mjs`** + **`hub-app-ids.mjs`** (**`scripts/hub/build-landing-data.mjs`**).
- **`src/pages/index.astro`** imports **`hubLanding`** JSON — **no** parallel **`mvpData`** catalog.
- **Legacy **`mvpData`** parsing** in **`diff-index-sources.mjs`** remains a safety net **if** `legacy-mvp-hub.html` is ever re-added; otherwise **`parseMvpDataIds()`** returns **[]**.

## Historical note (pre-parity warnings)

Older runs warned when **`legacy-mvp-hub.html`** **`mvpData`** ids differed from the full cockpit grid. That dual track is **closed** — archived narrative only in git history.

## Strict mode

- **`npm run hub:diff`** — runs **`verify-ground-truth`** then **`diff-index-sources`**  
- **`--strict-mvp`** on **`diff-index-sources.mjs`** — fail if **`mvpData`** ids are not in **registry** (only meaningful if legacy HTML returns)  
- **`--strict`** — treat **`diff-index-sources`** warnings as failure (inline **`coreProducts`** in **`index.astro`**, etc.)
