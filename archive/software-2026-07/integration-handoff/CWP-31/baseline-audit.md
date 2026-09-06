# CWP-31 — Baseline audit (Phase PA-0)

**Parent:** `CWP-P31-PAR-2026-01`

| Task | Result |
|------|--------|
| **PA-0.1** | See [`identity.md`](./identity.md) (file:line map + flow). |
| **PA-0.2** | See [`k4-personal-routes.md`](./k4-personal-routes.md). |
| **PA-0.3** | Below — commands green on a clean working tree. |

## PA-0.3 — Verification log

**Recorded:** 2026-04-26  
**Commit (this repo):** `316fc47c82eff15b3c75ed1d5cc085d0f3a05a0c`

| Command | Outcome |
|---------|---------|
| `pnpm --filter k4-personal verify` (from `andromeda/software`) | OK (wrangler deploy --dry-run) |
| `MESH_LIVE_STRICT=0 npm run verify:mesh` (P31 home root) | OK — k4-personal dry-run + live `https://k4-personal.trimtab-signal.workers.dev` /api/health |
| `npm run verify:constants` (P31 home root) | OK — mesh URL aligned with `mesh-start.html` |
| `npm run verify:ground-truth` (from `p31ca/`) | OK |

*Re-run after meaningful changes to k4-personal, `mesh-start.html`, or `p31-constants.json`.*
