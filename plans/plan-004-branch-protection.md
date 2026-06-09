# PLAN-004: GitHub Branch Protection — `main`

## Problem

`main` branch has no protection rules configured. Anyone (including CI pipelines with write tokens) can force-push or delete the branch. The Neo4j credential exposure from a prior session underscores why this matters — a single bad push to main on a protected branch can be reverted atomically. Without protection, a force-push buries the incident.

## Scope

GitHub repository: `github.com/p31labs` (or the repo owning this working directory)

Applies to: `main` branch

## Steps

### Step 1 — Navigate to Branch Protection

```bash
# Open in browser
open https://github.com/p31labs/p31-andromeda/settings/branches
```

Or: GitHub → Settings → Branches → Add rule

### Step 2 — Create Rule for `main`

Configure all of the following:

| Setting                                      | Value             | Reason                      |
| -------------------------------------------- | ----------------- | --------------------------- |
| Branch name pattern                          | `main`            |                             |
| Require a pull request before merging        | ✅ On             | No direct pushes            |
| Dismiss stale reviews                        | ✅ On             | Stale approvals don't count |
| Require review from Code Owners              | ⏸ Skip (optional) | Requires CODEOWNERS file    |
| Require status checks to pass before merging | ✅ On             | See below                   |
| Do not allow bypassing the above settings    | ✅ On             | Even admins must PR         |

**Required status checks** (check by name after CI is confirmed running):

```
npm-test       # Vitest suite
npm-build      # Vite production build
tsc            # TypeScript compile (tsc --noEmit)
```

Add any additional checks visible in the Actions tab.

### Step 3 — Enable GitHub Actions as Required Check

If Actions aren't appearing in the dropdown, trigger a workflow run first:

```bash
git push origin main
```

Then refresh the branch protection page and add the running workflow names as required checks.

### Step 4 — Protect Force-Push

```bash
# Verify current state
gh api repos/p31labs/p31-andromeda/branches/main/protection 2>/dev/null | jq .allow_force_push
```

If `allow_force_push: true`, lock it:

```bash
gh api --method PUT repos/p31labs/p31-andromeda/branches/main/protection \
  -F allow_force_push=false
```

### Step 5 — Require Signed Commits (Optional)

Enforce GPG-signed commits on `main`. Requires contributors to have GPG keys set up. Consider enabling after local devs are briefed.

### Step 6 — Enable Auto-Deletion of Head Branches

GitHub → Settings → General → "Automatically delete head branches" ✅

Keeps the branch list clean. Already had 2 stale branches deleted this session.

## Rollback

```bash
# Remove all protection rules
gh api --method DELETE repos/p31labs/p31-andromeda/branches/main/protection
gh api --method DELETE repos/p31labs/p31-andromeda/branches/main/protection/enforce_admins
```

## Priority

**Medium.** No active breach. Prevents a class of incident that is silent until it isn't. Particularly important given the legal sensitivity of the codebase — forensic integrity matters.
