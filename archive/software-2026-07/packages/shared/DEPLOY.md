# DEPLOY.md — @p31/shared

## Overview

`@p31/shared` is a private monorepo library consumed by other P31 packages
via the pnpm workspace protocol. It is not published to npm directly (though
the pipeline supports it). Consumers get the version pinned by the monorepo
lockfile.

---

## Versioning

The canonical version is in `src/version.ts` (the `VERSION` export).

When a consumer (e.g. `bonding`, `p31ca`) builds, it bundles whatever
`@p31/shared` version is resolved in the workspace. To release an update:

1. **Bump the version:**
   ```bash
   # Manual: edit src/version.ts and package.json
   # OR use the release workflow (tag push)
   git tag shared-v1.0.1
   git push origin shared-v1.0.1
   ```

2. **CI publishes:**

   The `publish-shared.yml` workflow handles:
   - Updating `src/version.ts` from the tag
   - Updating `package.json`
   - Building and running tests with coverage
   - Publishing to npm (if configured)
   - Committing the version bump

3. **Consumers update:**

   ```bash
   pnpm --filter @p31/bonding add @p31/shared@latest
   ```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Development — all PRs merge here |
| `shared-v*` tags | Release — triggers publish workflow |

No separate release branch. Tags are cut from `main` after PR merge.

---

## Rolling Back

If a broken version of shared is published:

1. **Identify the bad version** — check CI logs or consumer test failures.
2. **Revert the code** — create a PR reverting the change to `main`.
3. **Bump to a patch** — `shared-v1.0.2` reverting the broken logic.
4. **Update consumers** — each consumer pins the new version.

**npm rollback:** Use `npm dist-tag add @p31/shared@1.0.0 latest` to point
`latest` at the previous working version.

---

## Local Build & Test

```bash
pnpm --filter @p31/shared build
pnpm --filter @p31/shared test -- --coverage
pnpm --filter @p31/shared typecheck
```
