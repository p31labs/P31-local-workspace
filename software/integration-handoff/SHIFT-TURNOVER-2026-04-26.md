# Shift turnover — P31 Andromeda (Cursor)

**Date:** 2026-04-26  
**Branch:** `ci/phosphorus31-workflow` (PR #49)  
**HEAD at write:** `e97f60e` — *fix(p31ca): add all untracked CI deps — verify scripts, public assets, hub data*  
**Update (same day):** tip pushed `cb566ea` on `ci/phosphorus31-workflow` — **passkey worker**, **p31-google-bridge** package, **p31ca** design-token pipeline / super-centaur static / Playwright e2e / security tooling / docs; Zenodo tooling + `zenodo_results.json` under `docs/files/`. Confirm `p31ca-hub` on that SHA.  
**Verifier:** Re-read with live `git` on this machine; passkey + google-bridge are **committed** on the integration branch as of this update.

---

## 1. Mission state

Focus was **CI repair** so `p31ca-hub` and related workflows pass. Last push was intended to satisfy `MODULE_NOT_FOUND` / missing-file failures by committing scripts and data CI expects.

**Local dry-run (last session, still directionally valid):** full p31ca prebuild chain exit 0 — ground-truth, synergetic, lattice oracle, creator economy, geodesic campaign, `hub:about:generate`, `astro build`.

**First check for the incoming agent**

- Confirm the workflow run for `e97f60e` (or latest push on the branch) is green:

  ```bash
  gh run list --repo p31labs/andromeda --workflow p31ca-hub.yml --limit 3
  ```

- Or: <https://github.com/p31labs/andromeda/actions/workflows/p31ca-hub.yml>

If green, PR #49 is mergeable to `main` (operator discretion).

---

## 2. What’s on the branch (summary)

Nineteen commits ahead of `origin/main` (include merges); recent tip fixes p31ca-hub by landing previously untracked paths (verify scripts, `ground-truth/`, `scripts/hub/`, `package-lock` hygiene, public assets as committed for CI). See `git log origin/main..HEAD` for the exact list.

**Notable themes in the series:** Phosphorus31 workflow, deploy guard, GeodesicRoom / campaign, planetary onboard static pages, passkey worker deploy wiring, multiple Pages project workflows, p31ca-hub unblocking commits.

---

## 3. Working tree — dirty vs untracked

### Generated outputs (do not commit for “noise”)

Many files under `software/p31ca/public/` (including `*-about.html`, `_headers`, `_redirects`, hub HTML) show **modified** after local `build` / `hub:about:generate`. **CI regenerates** these via `hub:about:generate` on a clean checkout. Treat local diffs as **regenerated output** unless you intentionally changed copy or the generator.

### Real work still outside git (untracked, high value)

| Path | Note |
|------|------|
| `.github/workflows/donate-api.yml` | donate-api CI |
| `.github/workflows/p31-google-bridge.yml` | Google bridge CI (`node scripts/verify.mjs`) |
| `software/p31ca/workers/passkey/README.md`, `schema.sql`, `src/**` | Passkey source — **commit** (prod re-deploy safety) |
| `software/p31-google-bridge/**` | Full worker (OAuth, `/setup`, `npm run verify`, etc.) — **commit** when ready to version |
| `software/p31ca/security/*`, `eslint.config.security.mjs`, `scripts/security/` | Required if `security:check` or CI ever references them without skip |
| `software/integration-handoff/CONTROLLED-WORK-PACKAGE-SUPER-CENTAUR.md` | SUPER-CENTAUR CWP |
| `software/integration-handoff/CWP-30/mesh-bridge.ts` | Handoff for phosphorus31.org `SUPER-CENTAUR` mesh bridge |
| `docs/P31-WORKSPACES-DEEP-DIVE.md`, `docs/P31-WORKSPACES-SITE-PLAN.md` | Workspaces / Field design |
| Other `??` in `docs/`, `software/docs/adr/`, `scripts/verify-monetary-surface.mjs` | Review and batch-commit by theme |

**Also modified (tracked) but unstaged:** donate-api, k4-cage, kenosis-mesh, command-center, monorepo-verify, p31ca READMEs, etc. — review before a hygiene commit.

---

## 4. Immediate task list (incoming agent)

1. **CI green + merge** — If `p31ca-hub` is green on the tip of this branch, merge PR #49 to `main` (squash/merge as policy dictates):
   `gh pr merge 49 --repo p31labs/andromeda --squash` (add `--auto` if using merge queue).
2. **Commit passkey worker source** — `software/p31ca/workers/passkey/{README.md,schema.sql,src/index.ts}` (and any sibling files not ignored).
3. **Commit new workflows** — `donate-api.yml`, `p31-google-bridge.yml` with any package/script they depend on.
4. **Commit security stack** (if p31ca is meant to run `security:check` in CI) — `security/`, `eslint.config.security.mjs`, `scripts/security/`.
5. **SUPER-CENTAUR** — Read `CONTROLLED-WORK-PACKAGE-SUPER-CENTAUR.md`. Bridge sample: `CWP-30/mesh-bridge.ts` → operator copies to phosphorus31.org tree per that doc.
6. **Workspaces** — Read `docs/P31-WORKSPACES-*.md` before implementing “Field / Cage / Cockpit” UX.

**Google bridge quick verify (after folder is committed):** from monorepo root, `pnpm run google-bridge:verify` (runs `print:redirect` + preflight + `wrangler deploy --dry-run` in `p31-google-bridge`).

---

## 5. Infrastructure snapshot (as of handoff; verify live)

| Surface | URL / pattern |
|--------|----------------|
| phosphorus31.org | https://phosphorus31.org |
| p31ca.org | https://p31ca.org |
| hearing ops | https://ops.p31ca.org |
| bonding | https://bonding.p31ca.org |
| command-center (KV) | `command-center.trimtab-signal.workers.dev` |
| k4-cage | `k4-cage.trimtab-signal.workers.dev` |
| p31-vault / p31-technical-library | `*.pages.dev` (per status / dashboard) |
| passkey API | `https://p31ca.org/api/passkey/*` (live; source should be in git) |
| donate-api | Not deployed / secrets pending (Stripe, Discord) |
| p31-google-bridge | Not deployed until worker is committed + configured |

**Command-center status push:** `update-status.sh` uses `wrangler kv key put` — HTTP POST to the worker is not viable behind Access; KV ID is the documented namespace in handoff context.

**GitHub Actions secrets (typical):** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

---

## 6. Key paths

| Topic | Path |
|-------|------|
| Fleet / dashboard JSON | `software/cloudflare-worker/command-center/status.json` |
| Status update script | `software/cloudflare-worker/command-center/update-status.sh` |
| p31ca prebuild | `software/p31ca/package.json` |
| Ground truth | `software/p31ca/ground-truth/p31.ground-truth.json` |
| Passkey wrangler | `software/p31ca/workers/passkey/wrangler.toml` |
| Monorepo root map | `P31-ROOT-MAP.md` (repo root) |

---

## 7. Constraints / watch-outs

- **p31ca prebuild** is strict: new references in verify scripts need committed files or CI breaks.
- **Wrangler env blocks:** KV/R2/vars under `[env.production]` are not magically inherited from top level — duplicate bindings per env as needed.
- **pnpm vs npm:** Turbo / some packages use pnpm at `software` level; p31ca and several apps use their own `package-lock.json` — follow each workflow’s install style.
- **Node 20 in Actions:** `actions/*@v4` deprecation timeline — plan upgrade before mid-2026.
- **Operator comms:** direct, minimal preamble; no submarine/military metaphors; S.J. / W.J. only for children.

---

## 8. Known gaps (not blocking the above CI fix)

- **Pages without monorepo source:** e.g. some `*.pages.dev` properties may still lack a matching workflow or source tree — confirm against `status.json` and GitHub Projects.
- **donate-api:** code + `donate-api.yml` exist; needs secrets and first deploy.
- **p31-google-bridge:** package **committed** (`software/p31-google-bridge/`); deploy + OAuth + KV still operator-owned.
- **Zenodo:** Papers **V–XX** batch published 2026-04-26; DOIs in P31 home `p31-constants.json` and `docs/files/zenodo_results.json`. Optional: add `cites` metadata to XI/XIX (and related) toward XII in Zenodo UI.

---

*End of shift turnover. Update this file’s date and HEAD if you continue the same PR across days.*
