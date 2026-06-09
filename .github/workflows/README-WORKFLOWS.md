# GitHub Actions — reusable layers

## Scale model

1. **Toolchain** — `.github/actions/toolchain-constants` runs **after** `actions/checkout`. It sets `GITHUB_ENV` from **repo root `package.json`**: `engines.node` → `NODE_VERSION` (first major digit), `packageManager` → `PNPM_VERSION` (strip `pnpm@`). **Wrangler** is not in `package.json`; bump `WRANGLER_VERSION` inside that action only (keep in sync with Cloudflare deploys).

2. **Composites** (`.github/actions/`)

| Action | Use when |
|--------|-----------|
| `toolchain-constants` | Always first (unless job is shell-only). |
| `pnpm-andromeda-full` | Root + `software` frozen install (same as `pnpm run lockfile:check`). |
| `pnpm-04-software` | Only the nested Turbo workspace under `software`. |
| `npm-ci-project` | One package with `package-lock.json` + npm cache. |
| `wrangler-run` | `cloudflare/wrangler-action@v3` + shared Wrangler version. |
| `cloudflare-pages-v1` | `cloudflare/pages-action@v1` + shared Wrangler version. |

3. **Callable workflows** (`workflow_call`) — compose full jobs without copy-paste:

| Workflow | Called by |
|----------|-----------|
| `reusable-monorepo-verify.yml` | `monorepo-verify.yml` |
| `reusable-ci-focused.yml` | `ci.yml` (`secrets: inherit` for Turbo) |
| `reusable-coverage.yml` | `coverage.yml` |

Add new repo-wide gates by extending a reusable file, or add a new `reusable-*.yml` and a one-line caller workflow.

## Pages ownership (no double deploy)

- **Routine** deploys: path workflows (`p31ca-hub`, `p31-technical-library`, `phosphorus31-site`, `bonding`, …).
- **P31 Automation** Pages jobs: **manual** (`workflow_dispatch`) only; push auto-deploy is for **bouncer** + **command-center** only.

## Branch protection status names

Rulesets that require **`build-and-test`**, **`code-quality`**, or **`compliance-check`** are satisfied by the matching workflows in this directory (each defines a job with the same id). In the GitHub UI the check often appears as **`workflow-name / job-name`** (e.g. `build-and-test / build-and-test`). If a rule still shows *Expected — Waiting for status*, edit the ruleset and pick the check from the dropdown after one run on a PR, or align the required name with the string Actions actually emits.

## Local parity

`pnpm run verify:ci-local:static` at repo root; optional `pnpm run verify:stack-links` after edge deploy.
