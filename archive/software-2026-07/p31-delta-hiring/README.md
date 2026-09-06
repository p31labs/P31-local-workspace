# p31-delta-hiring

Shippable **hiring + help surface** for P31: **role packets** (outcomes, constraints, evaluation weights), **wcds** (bounded work samples, rubrics, good/anti patterns), a **help center** + **glossary** + **search** (Fuse.js), and a browser-side **portable proof** (`p31.proofRecord/1.0.0`) with import/export and optional **commit SHAs** on artifacts.

## Run

From `andromeda/software` (with pnpm installed):

```bash
pnpm install
pnpm --filter p31-delta-hiring dev
```

Default Vite port **3150** (see `vite.config.ts`).

## Features (UI)

| Area | Route |
|------|--------|
| Home, equity tiers | `#/` |
| Open roles (guild/priority filters) | `#/roles` |
| Role packet + print | `#/roles/:id` |
| WCD library & detail | `#/wcd`, `#/wcd/:id` |
| Help center & topics | `#/help`, `#/help/:id` |
| Glossary | `#/glossary` |
| Full-text search | `#/search?q=` |
| My proofs, JSON import/export | `#/portfolio` |
| Proof editor | `#/proof/new/:roleId`, `#/proof/:id` |
| Reviewers, changelog, governance | `#/reviewers`, `#/changelog`, `#/governance` |

## Hub production gate (p31ca)

After **`sync:p31ca`**, the monorepo verifies the mirrored bundle (assets resolve, `/p31-style.css`, schemas in source data):

```bash
cd ../p31ca && npm run verify:delta-hiring
```

Playwright: **`p31ca/e2e/delta-hiring.spec.ts`** (runs with `npm run test:e2e` in p31ca).

## One-shot quality gate (local / CI)

```bash
pnpm --filter p31-delta-hiring run check
```

From `software` (uses **Turbo** for the same pipeline + cache when enabled):

```bash
pnpm run check:p31-delta-hiring
```

Runs: `verify` → `test` → `lint` → `build`. GitHub Actions: workflow **`p31-delta-hiring`** runs `check:p31-delta-hiring` on path-filtered push/PR.

## Individual commands

| Script | Purpose |
|--------|--------|
| `pnpm run verify` | Data integrity: roles → WCD map, rubric weights, good/anti lists |
| `pnpm run test` | Vitest (`tests/`) |
| `pnpm run lint` | ESLint on `src/` |
| `pnpm run build` | `tsc` + Vite → `dist/` |

## Build output

`dist/` is static files.

### Same-origin on p31ca (recommended path)

From `andromeda/software` after a successful `pnpm run build` in this package:

```bash
pnpm --filter p31-delta-hiring run sync:p31ca
```

Copies `dist/` → `p31ca/public/delta-hiring/`. Public URL: **`https://p31ca.org/delta-hiring/`** (short **`/hiring`**). Commit the updated `public/delta-hiring/**` in the p31ca tree together with `ground-truth` / `_redirects` / `connect.html` (when you touch those) so the same-origin route and the mesh link stay in sync.

### Standalone Cloudflare Pages

On **push to `main`**, the workflow [`.github/workflows/p31-delta-hiring.yml`](../../.github/workflows/p31-delta-hiring.yml) runs `check` and can **`wrangler pages deploy dist --project-name=p31-delta-hiring`**. Requires a **Pages** project and secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` if you use that job.

## Data & schema

| File | Role |
|------|------|
| `src/data/role-packets.json` | `p31.rolePackets/1.0.0` |
| `src/data/work-samples.json` | `p31.workSamples/1.0.0` |
| `src/data/help-topics.json` | `p31.helpTopics/1.0.0` |
| `src/data/glossary.json` | `p31.glossary/1.0.0` |
| `src/data/changelog.json` | Release notes (hand-maintained) |
| `schemas/proof-record.schema.json` | Portable export |

## Related docs

- `andromeda/docs/social/DELTA_JOB_BOARD.md` — list-oriented board
- `andromeda/docs/social/DELTA_HIRING_SYSTEM_ARCHITECTURE.md` — narrative

This package is the **working UI + contracts** for Delta hiring.
