# CWP-2026-005: UIG CONVERGENCE & WORKSPACE UNIFICATION

**Vector Equilibrium to Tetrahedron | Continuation issued 2026-07-10**
**(Re-issued as detailed continuation post R1–R7 progress)**

**STATUS:** AUTHORIZED — IN PROGRESS (Phase 5 pending)
**ISSUED:** 2026-07-10
**REISSUED:** 2026-07-10 (detailed continuation)
**OPERATOR:** trimtab-signal / p31
**PARENT:** None (standalone refit of P31-local-workspace monorepo)
**GEOMETRY:** Three axes — (A) Security & Standards, (B) UIG Convergence, (C) Workspace Unification — converged on a single deployable trunk.
**DEADLINE:** 2026-07-31 (CWP closeout) → 2026-08-01 (NGI grant submission)

---

## PREAMBLE

The P31 monorepo ("big shebang") accumulated seven parallel faces of the Universal
Interface Generator (UIG) Adaptive Exocortex, a divergent root `/phos`, a stale
embedded `bonding-soup` copy, and workspace globs that would not install. CWP-2026-005
is the collapse of that potential into structure: one canonical `CrisisOverlay`, one
portable UIG surface (`apps/phos`), one coherent workspace manifest, and a WCAG gate
that is *wired into CI* rather than asserted in prose.

The first seven work items (R1–R7) are largely landed on `main`. This document is the
**detailed continuation**: it records completed state with commit hashes, then scopes
Phase 5 (closeout + verification) and the deferred items (R1 Phase 2, Phase 0.1 secret
rotation, grant submission) with exact commands and success criteria.

---

## COMPLETED STATE (as of 2026-07-10, all on `main`)

| Item | Title | Commit | Status | Notes |
|------|-------|--------|--------|-------|
| P0 | Phase 0 security hardening | `d55ce69` | DONE | jitterbug-api constant-time PSK + SQLi allowlists + CORS allowlist + fail-closed webhook; love-ledger fail-closed write gate; docs corrected |
| Wave 1 | Remove stale bonding-soup copy + add UIG/jitterbug tests | `6f18c1d` | DONE | Deleted 87-file embedded `bonding-soup/packages/p31-sovereign-chain`; 4 UIG-MCP tests + 5 jitterbug `timingSafeEqualStr` tests, green |
| R7 | axe-runner wired into CI | `d4377a6` | DONE | `.github/workflows/axe-runner.yml` non-blocking (`continue-on-error`), Playwright/Chromium; fixed `npm ci` → `pnpm install --frozen-lockfile` |
| R3 | design-system accent → quantum-cyan | `d4377a6` | DONE | `#10b981` → `#00F0FF` in `tokens.css`+`themes.css` + `phos`/`apps/phos` themes.css; success green retained as `--phos-success` |
| R2 | UIG ported root `/phos` → `apps/phos` | `d4377a6` | DONE | Additive `/adaptive` surface (`uig.ts`,`uigViews.ts`,`UIGSurface`+CrisisOverlay); routing preserved; **root `/phos` NOT deleted (held for review)** |
| R1.1 | Workspace Phase 1 (6 valid apps) | `c822ea8` | DONE | Deleted empty `packages/shared` stub; added `phos`,`p31ca`,`phosphorus31`,`willow`,`gateway`,`counterscale` to `pnpm-workspace.yaml`; `pnpm install --lockfile-only` exit 0 |
| R4 | willow UIG + spoon 0–5 | `a7d4696` | DONE | `@p31/interface-generator: workspace:*`; `bioStore.ts:62` `Math.min(5,..)`; new `UIGWillowWrapper.tsx`; wired into `App.tsx`; tests updated |
| R5 | phosphorus31 crisis island | `a7d4696` | DONE | `@p31/interface-generator: workspace:*`; new `CrisisIsland.tsx` mounted `Layout.astro` (`client:load`); build passes |
| R6 | CrisisOverlay dedupe | `a7d4696` | DONE | All 7 usages import canonical `@p31/interface-generator`; deleted `phos/src/components/CrisisMode.tsx` + `apps/phos/src/components/CrisisMode.tsx` |

### Verification already performed
- `grep -rn "CrisisOverlay" --include=*.tsx` → single source (`@p31/interface-generator/src/renderer.tsx:18`).
- willow `tsc --noEmit` filtered to R4 files → **0 errors**.
- phosphorus31 `npm run build` → passes (R5 agent).
- `pnpm install --lockfile-only` → exit 0 (peer-dep warnings only, pre-existing).
- TRIPER cert (sibling `bonding-soup` repo) → **AUTHORIZED 12/12** after repointing dangling `andromeda/04_SOFTWARE/p31ca` symlink to `/home/p31/P31-local-workspace/apps/p31ca`. Fresh cert `cert-2026-07-10T20-27-53-240Z.json`.

---

## PHASE 5 — CLOSEOUT & VERIFICATION (PENDING, USER-ACKNOWLEDGED DESTRUCTIVE STEP)

### WCD-501: Delete root `/phos` (destructive — await user confirm)
- **Precondition:** confirm `apps/phos` is canonical and deploy scripts (AGENTS.md `andromeda deploy --app phos`, wrangler `phos` project) point to `apps/phos`, not root `phos`.
- **Command:**
  ```bash
  cd /home/p31/P31-local-workspace
  git rm -rf phos/
  # then grep for any remaining references to /phos root path
  grep -rn "from ['\"]\.\./\.\./phos\|/phos/\|phos/src" --include=*.ts --include=*.tsx --include=*.astro --include=*.json . | grep -v node_modules | grep -v "apps/phos" | grep -v "phos.p31ca.org"
  ```
- **Success criteria:** `git status` shows `phos/` removed; zero dangling imports referencing the deleted root; `apps/phos` build still green.
- **Cost:** none (local). Risk: if deploy refs still point at root `phos`, `andromeda deploy --app phos` breaks → check AGENTS.md deploy section first.

### WCD-502: Documentation false-claim corrections
- **AGENTS.md** fixes:
  - Auth section: DID:key is **scaffolds only** — `@p31/auth` / `packages/auth` NOT implemented. Already mostly correct; confirm no "DID:key login is live" claims.
  - WCAG 2.2 AAA section header: relabel "Baseline — July 2026" → "Roadmap (Phase 2)". 0-violation claim only verifiable via the now-wired axe-runner (R7); remove any absolute "AAA compliant" wording.
  - MCP server count: 4 in-repo (Oasis CLI 11, Component Registry 5, LOVE Ledger 3, PHOS Forge 27 = ~46 tools). Confirm table matches.
- **GLOBAL_IMPACT_REPORT.md:** correct LOVESBT/UIG status (UIG now converged per R6), TRIPER count 9→12.
- **Success criteria:** no unsubstantiated compliance claims; TRIPER count reads 12/12.

### WCD-503: Final verification suite
```bash
cd /home/p31/P31-local-workspace
pnpm install --frozen-lockfile
# build the three UIG faces
(cd apps/phos && bash node_modules/.bin/astro build)
(cd apps/willow && npm run build)
(cd apps/phosphorus31 && npm run build)
# WCAG gate
node scripts/audit-wcag.mjs   # axe-runner target phos.p31ca.org
```
- **Then** fresh TRIPER cert in sibling repo:
  ```bash
  cd /home/p31/bonding-soup && ./tests/triper/run.sh --fresh   # AUTHORIZED 12/12 expected
  ```
- **Success criteria:** pnpm install exit 0; all three builds exit 0; axe-runner reports 0 violations (or only pre-known non-blockers); TRIPER cert AUTHORIZED 12/12 dated <24h.

---

## DEFERRED ITEMS (out of CWP-2026-005 scope per Fortune 1 way)

### R1 Phase 2 — full workspace unification (CAREFUL SEPARATE PASS)
The following break a naive `apps/*`/`packages/*` glob and were deliberately excluded:
- `apps/bonding`, `apps/auth`, `apps/status`, `apps/design-hub` — standalone npm apps (lockfile + node_modules, **no package.json**). Adding them to the workspace without a manifest fails install.
- `apps/design-tokens` — **symlink** to `software/design-tokens` (untracked).
- Root `packages/*` stubs: `auth`, `p31-core`, `shared` (deleted), `sovereign-core`, `ui-facets`, `vscode-extension` — some empty/phantom; `shared` duplicates real `software/packages/shared` (collision).
- `@p31ca/cli` — **PHANTOM** (referenced in `site/README-site.md`, which is a *submodule* — out of scope, edit reverted).
- **Approach:** one app at a time; add a real `package.json` (or convert to `workspace:*`) before enlisting; never glob-blast.

### Phase 0.1 — secret rotation (USER ACTION)
Exposed secrets still live in the repo (not yet rotated):
- repo-root `.env` (`DEPLOYER_PRIVATE_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `SEPOLIA_RPC`)
- `software/.env.jitterbug` (`JITTERBUG_PSK = 9378c710733f834ab59a229200cf7ef085fafeb581546b85`)
- GH token `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` is already **dead** (rotated to `gho_` OAuth). Push now requires `env -u GH_TOKEN git push origin main` (the `GH_TOKEN` env var still holds the invalid `ghp_` and overrides `gh auth git-credential`).
- **Action:** mint new secrets, rotate in Cloudflare/OpenRouter/Groq/Gemini, purge from git history (BFG/`git filter-repo`), then re-commit sanitized `.env.example`.

### NGI grant submission (USER ACTION)
- Narrative: `grants/NGI-2026-PROPOSALS-DRAFT.md` (calibrated to reality; WCAG 2.2 AAA/COGA = Phase 2 roadmap, not shipped).
- **Deadline:** 2026-08-01.

---

## CRITICAL PATH

```
R1–R7 (DONE on main, d55ce69→a7d4696)
        │
        ├─ WCD-501  Delete root /phos  ──(user confirm)──► apps/phos canonical
        ├─ WCD-502  Doc false-claim fixes  ──────────────► AGENTS.md / GLOBAL_IMPACT_REPORT.md
        └─ WCD-503  Final verification ──────────────────► pnpm + 3 builds + axe + TRIPER 12/12
                                                        │
PHASE 0.1 secret rotation (USER) ───────────────────────┤
NGI grant submission 2026-08-01 (USER) ─────────────────┘
```

**Bottleneck:** WCD-501 is destructive and user-gated. Everything else (502, 503) is
agent-executable immediately after confirm. Phase 0.1 and grant are pure user actions
and run in parallel with no dependency on the code closeout.

---

## PARKING LOT

| Blocked Item | Blocking | Reason | Action |
|--------------|----------|--------|--------|
| Root `/phos` deletion | User confirm | Destructive; must verify deploy refs first | WCD-501 |
| Phase 0.1 secret rotation | User | Requires minting new secrets + history purge | Manual |
| R1 Phase 2 globs | Structural | Standalone apps lack package.json; phantom stubs | Separate careful pass |
| NGI grant submit | User | Narrative ready; submission is human action | 2026-08-01 |

---

*Generated: 2026-07-10 (detailed continuation)*
*P31 Labs | 501(c)(3) Nonprofit | EIN 42-1888158*
