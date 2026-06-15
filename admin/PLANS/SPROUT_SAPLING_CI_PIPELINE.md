# SPROUT→SAPLING Plan: CI Pipeline

**Target:** `.github/workflows/ci.yml` → `🌿 SPROUT → 🌳 SAPLING`
**Current:** CODE:2 TEST:1 DOCS:1 OPS:1 SEC:1
**Gap:** Never run in production. No test file. No badge.

## Required Moves

| Dim | Target | Action |
|-----|--------|--------|
| CODE:2→3 | Add branch protection: `main` requires CI to pass before merge | Add `branches` to GitHub repo settings (manual, ~30s) |
| TEST:1→2 | Add a smoke test that validates the workflow YAML parses | `scripts/validate-ci.sh` — runs `act --list` or simple YAML parse |
| DOCS:1→2 | Add CI status badge to root README | `[![CI](https://github.com/p31labs/andromeda/actions/workflows/ci.yml/badge.svg)](...)` |
| OPS:1→3 | Add `ci/github-actions` directory context to deploy scripts | Verify workflow correctly triggers turbo pipeline |
| SEC:1→2 | Audit workflow for secret leakage (no `env` on PR triggers) | Already clean — no secrets in PR-triggered workflows |

## Execution

### 1. Push CI workflow and verify first run
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add test + coverage pipeline"
git push
# → Watch first run at https://github.com/p31labs/andromeda/actions
```

### 2. Add CI badge to root README
Insert after PMM badge line:
```markdown
[![CI](https://github.com/p31labs/andromeda/actions/workflows/ci.yml/badge.svg)](https://github.com/p31labs/andromeda/actions/workflows/ci.yml)
```

### 3. Validate workflow syntax
```bash
# Requires `act` (local GitHub Actions runner)
act --list -W .github/workflows/ci.yml
```

### 4. Update PMM label in README
After first green run: change `🌿 SPROUT` → `🌳 SAPLING` in README.

## Estimated spoon impact
- Action review: -0.5 (minor friction)
- First green CI run: +0.5 (AHA: automation works)
- Net: **0 spoons consumed, +0.5 generated**
