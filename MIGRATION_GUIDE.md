# P31 808 Launch — Migration Guide

**Document ID:** P31-MIG-808-001 | **Version:** 1.0.0 | **Effective Date:** 2026-08-08  
**Status:** Production-Ready | **Target Release:** 2026-08-15

---

## 1. Overview

The **808 Launch** unifies the P31 Sovereign Shell and Spaceship Earth cockpit into a cohesive, user-facing product. This guide ensures a smooth transition for:

- **End-users** (operators, bonding family, pilot programs)
- **System integrators** (deployers, SREs)
- **Agent operators** (CWP swarm, MCP clients)

---

## 2. What's Changing

### 2.1 New in v1.1.0

| Component | Change | Reason |
|-----------|--------|--------|
| **Engine Layer** | 9 modules implemented (Phases 1–5) | Measurement now live; ship coherence computed in real-time |
| **Verify Suite** | BASE → `bf53b085` (current deploy) | Ensures tests run against live, not stale, hash |
| **CI/CD** | Workflow paths fixed (`software/` → `packages/`) | CI was broken; now working correctly |
| **Manufacturing Manuals** | Complete technical reference for both products | Enables system integrators to build/deploy independently |

### 2.2 User-Facing Changes

| Feature | Before | After |
|---------|--------|-------|
| **Dome Visualization** | Static geometry | Live coherence + spoon mapping (color/opacity/speed) |
| **LED Control** | Stubbed UI | Full control: 7 modes, speed, brightness, color palette |
| **HUD Panels** | Non-functional | All panels (Duna, System, LED) wired to real state |
| **MCP Integration** | Limited | 4 tools fully functional: `duna_status`, `system_health`, `dome_structure`, `neo_pixel_control` |

---

## 3. Upgrade Path

### For End-Users

**If you're running an older version:**

```bash
# 1. Update the app (auto via PWA)
# Wait for the "Update Available" toast and click "Refresh"

# 2. Clear local cache (if issues)
# DevTools → Storage → Clear All

# 3. Re-pair mesh (if necessary)
# Settings → Mesh → "Initiate Handshake"
```

**No data loss expected.** All IndexedDB state is migrated automatically.

### For System Integrators

**If you're deploying from source:**

```bash
# 1. Pull latest main
cd /home/p31/P31-local-workspace
git fetch origin main
git checkout origin/main

# 2. Install dependencies
pnpm install

# 3. Run type check + tests
pnpm --filter @p31/spaceship-earth typecheck
pnpm --filter @p31/spaceship-earth test
pnpm --filter p31-shell typecheck
pnpm --filter p31-shell test

# 4. Verify both suites pass
cd packages/spaceship-earth && node scripts/verify-ship.cjs
cd ../../production/shell && NODE_PATH=/home/p31/node_modules node scripts/verify-shell.cjs

# 5. Build and deploy
# See DEPLOYMENT_GUIDE.md for wrangler commands
```

---

## 4. Breaking Changes

### 4.1 Engine Layer API

The `measureShipState()` function signature **changed**:

**Before:**
```typescript
measureShipState(raw: UserState): any
  → { modeProbabilities, modeDominant, modeEntropy, densityMatrix: null }
```

**After (v1.1.0):**
```typescript
measureShipState(user: UserState): ShipMeasurement
  → { probabilities, dominant, entropy }  // same behavior, renamed fields
```

**Impact:** If you call `measureShipState()` directly in agent code, rename your response keys:
- `modeProbabilities` → `probabilities`
- `modeDominant` → `dominant`
- `modeEntropy` → `entropy`
- `densityMatrix` removed (internal use only)

**Migration code:**
```typescript
// Old
const result = measureShipState(raw);
console.log(result.modeProbabilities);  // ❌ undefined in v1.1.0

// New
const result = measureShipState(raw);
console.log(result.probabilities);  // ✅ works
```

### 4.2 CI/CD Paths

The GitHub Actions workflow now expects **root-level pnpm workspace**:

**Before:**
- Paths: `software/spaceship-earth/**`
- Install: `./.github/actions/pnpm-04-software` (broken)
- Build: `pnpm --filter @p31/spaceship-earth run build` from `software/`

**After (v1.1.0):**
- Paths: `packages/spaceship-earth/**`
- Install: `corepack enable && pnpm install` (root level)
- Build: `pnpm --filter @p31/spaceship-earth run build` (from root)

**Impact:** If you have custom CI/CD scripts, update paths:
```bash
# Old
cd software/spaceship-earth && wrangler pages deploy dist

# New
cd packages/spaceship-earth && wrangler pages deploy dist
```

### 4.3 Verify Suite BASE

**Before:** `https://5a043de3.spaceship-earth.pages.dev` (stale hash)  
**After:** `https://bf53b085.spaceship-earth.pages.dev` (current live)

**Impact:** If you run `verify-ship.cjs` in CI, use the new default or set the env:
```bash
# Default (now uses bf53b085)
node scripts/verify-ship.cjs

# Or explicit override
SHIP_VERIFY_BASE=https://your-custom-deploy.example.com node scripts/verify-ship.cjs
```

---

## 5. Dependency Updates

### Recommended (Security)

| Package | Old | New | Reason |
|---------|-----|-----|--------|
| `@sentry/react` | 7.x | 8.x | Performance monitoring improvements |
| `zustand` | 4.x | 5.x | Stricter type inference, fixes middleware |

**Migration:**
```bash
pnpm update @sentry/react zustand
pnpm typecheck  # Verify no regressions
```

### Optional (Nice-to-Have)

- `three@0.172` → `three@0.173` (minor 3D math improvements, not required)
- `vite@8` → `vite@9` (bundler optimization, backward compatible)

---

## 6. Testing & Validation

### Pre-Deployment Checklist

- [ ] `pnpm typecheck` passes (no TS errors).
- [ ] `pnpm test` passes (100% suite green).
- [ ] `verify-ship.cjs` passes (186+ checks, especially Sections A–G).
- [ ] `verify-shell.cjs` passes (186+ checks).
- [ ] Dome renders without 3D artifacts (console clean).
- [ ] LED controller responds to mode changes within 200ms.
- [ ] MCP tools callable via CLI and WebMCP (if Chrome 149+).
- [ ] PWA can be installed (DevTools → App).
- [ ] Offline fallback works (disconnect network, page still loads).

### Post-Deployment Checklist

- [ ] Health endpoint responds: `GET /api/health` → `{ status: 'ok' }`.
- [ ] Sentry captures errors (check dashboard for 0 new errors in 1h).
- [ ] Users report no crashes or hangs (monitor GitHub Issues / Slack).
- [ ] LED mode changes sync across devices (if multi-device setup).
- [ ] DUNA board reflects correct member count and target.

---

## 7. Rollback Plan

If you encounter critical issues post-deployment:

### Quick Rollback

```bash
# Revert to previous hash
git revert HEAD --no-edit && git push origin main

# Or manually redeploy the previous stable version
SHIP_VERIFY_BASE=https://previous-hash.spaceship-earth.pages.dev \
  wrangler pages deploy dist --project-name=spaceship-earth --branch=main
```

### Communication

- **Slack:** Post in #ops: "Rollback initiated: spaceship-earth → previous hash"
- **GitHub:** Add a comment to the deployment PR explaining the rollback.
- **Users:** No action required; PWA will auto-refresh to previous version within 5 minutes.

---

## 8. Known Limitations (Post-808)

| Issue | Scope | Workaround |
|-------|-------|-----------|
| `@p31/tetra` alias points to nonexistent path | Build-time warning | Remove alias from `tsconfig.json` or create the module. |
| Sibling workflows (`bonding.yml`, etc.) still use `software/` paths | CI for other apps | Update `.github/workflows/bonding.yml`, etc. (out of scope for 808). |
| `spaceship-state.json` not pre-created | First MCP call creates it | No action; lazy creation is normal. |
| RUNBOOK.md verify counts stale | Documentation | Reference MANUFACTURERS_MANUAL.md (186/187 is correct). |

---

## 9. Support & Feedback

### Issues During Migration

**If you encounter:**

1. **TypeScript errors** → `pnpm clean && pnpm install && pnpm typecheck`.
2. **Test failures** → Run `pnpm test --reporter=verbose` to see details; file a GitHub Issue.
3. **Verify suite failures** → Check that SHIP_VERIFY_BASE is correct; check Chrome DevTools for CSP errors.
4. **LED controller unresponsive** → Check browser console for `__p31_led` hook errors; Sentry will log to dashboard.

### Getting Help

- **Technical Issues:** [GitHub Issues](https://github.com/p31labs/P31-local-workspace/issues)
- **Deployment Questions:** Slack #ops
- **User Feedback:** https://p31ca.org/feedback

---

## 10. Timeline

| Date | Event | Responsible |
|------|-------|-------------|
| **2026-08-08** | v1.1.0 tagged in main | SRE |
| **2026-08-09** | Pre-deployment validation | QA team |
| **2026-08-10–12** | Pilot deployment (closed group) | Ops |
| **2026-08-13–14** | User acceptance testing (UAT) | Pilot cohort |
| **2026-08-15** | Public release (808 Launch) | Product |

---

## 11. FAQ

**Q: Will my data be lost?**  
A: No. All IndexedDB and localStorage state is preserved. The app automatically migrates schema on load.

**Q: Does my browser history change?**  
A: No. The PWA manifest is backward-compatible. Existing shortcuts and bookmarks still work.

**Q: How long until the LED controller works?**  
A: The UI is 100% functional as of v1.1.0. Hardware integration is pending; MCP tool is available for testing.

**Q: What if I'm offline during the update?**  
A: The old version keeps working. PWA will fetch the new version next time you have connectivity. Auto-refresh will prompt you.

**Q: Can I opt-out of the update?**  
A: Not recommended, but you can delete the app from your home screen and re-install later. Current version will keep working in your browser cache.

---

**Maintainer:** P31 Labs — trimtab-signal  
**License:** MIT  
**Last Updated:** 2026-08-08
