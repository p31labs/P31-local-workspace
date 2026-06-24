# RUNBOOK.md — @p31/shared

## Incident Response

### 1. Consumer build failure

**Symptoms:** `pnpm build` in bonding/p31ca fails with TypeScript errors
after a shared update.

**Triage:**
```bash
pnpm --filter @p31/shared typecheck
pnpm --filter @p31/shared test -- --coverage
```

**If typecheck fails:**
- Check for breaking API changes in recent shared commits.
- Revert the shared change, bump patch, and re-deploy consumers.

**If tests fail but typecheck passes:**
- Check the specific test failure — likely a logic regression in trust,
  hibernation, or cogpass modules.
- Run `pnpm --filter @p31/shared test -- --reporter verbose` to see
  individual test results.

---

### 2. Runtime error in production (shared consumed by a worker)

**Symptoms:** Worker HTTP 500 or incorrect behavior after deploy.

**Triage:**
1. Check the worker's `/health` endpoint for version info.
2. Verify which shared version the worker bundled:
   ```bash
   grep '@p31/shared' software/*/node_modules/@p31/shared/package.json
   ```
3. Check worker logs:
   ```bash
   npx wrangler tail
   ```

**Resolution:**
- If shared is the cause: rollback the worker to the previous version:
  ```bash
  npx wrangler versions rollback
  ```
- Then revert shared, bump patch, re-deploy.

---

### 3. npm publish failure

**Symptoms:** `publish-shared.yml` workflow fails at the publish step.

**Triage:**
- Check npm token expiry in GitHub Secrets.
- Verify `NPM_TOKEN` has write access to `@p31/shared`.
- Run publish locally:
  ```bash
  pnpm publish --no-git-checks --access public
  ```

---

### 4. Dependency vulnerability

**Symptoms:** `pnpm audit` reports critical or high vulnerabilities.

**Resolution:**
```bash
pnpm --filter @p31/shared update <package>
pnpm --filter @p31/shared test
pnpm --filter @p31/shared build
```

For zero-day fixes: patch, bump, publish, update consumers urgently.

---

## Health Check Reference

Consumers should expose a `/health` endpoint. Example:

```typescript
import { createHealthResponse, VERSION } from '@p31/shared';

export default {
  async fetch(req) {
    if (new URL(req.url).pathname === '/health') {
      return Response.json(createHealthResponse(VERSION, {
        dependencies: { d1: { status: 'ok' } },
        startTime: performance.timeOrigin,
      }));
    }
  }
};
```

---

## Monitoring

- **CI:** `ci.yml` runs shared tests with coverage gates on every PR.
- **Nightly:** `nightly-qsuite.yml` runs full test suite including shared.
- **Convergence:** `convergence.yml` verifies cross-phase consistency.
- **Dashboard:** Command center at `command-center.trimtab-signal.workers.dev`
  pings all worker health endpoints every 5 minutes.

---

## Escalation

| Severity | Response | SLA |
|----------|----------|-----|
| Critical (production down) | Immediate rollback + tag revert | 15 min |
| High (test suite broken) | Fix within business hours | 4 hr |
| Medium (deprecation warning) | Address in next sprint | 1 week |
| Low (cosmetic) | Triage at next refinement | — |

---

## Related Documents

- `DEPLOY.md` — versioning and release procedures
- `README.md` — package overview and API
- `CONTRIBUTING.md` — contribution guidelines
