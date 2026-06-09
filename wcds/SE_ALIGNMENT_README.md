# Spaceship Earth — Production Alignment Patch

## Quick Apply

```bash
cd software
chmod +x ../se-alignment-patch.sh
bash ../se-alignment-patch.sh
```

The script handles Phases 0 (partial), 1, and 3 automatically.

## Manual Steps Required

### Phase 0, Fix 1 — Add viewPerspective destructure

The sed replacements in the script fix the comparison operators, but you also need
to ensure `viewPerspective` is destructured from the store.

In `ImmersiveCockpit.tsx`, find the line near the top of the component that
destructures from `useSovereignStore()` — something like:

```tsx
const { cameraMode, ... } = useSovereignStore();
```

Add `viewPerspective`:

```tsx
const { cameraMode, viewPerspective, ... } = useSovereignStore();
```

If `viewPerspective` is accessed via `useSovereignStore.getState()` inline
(not destructured), the sed fix already handles those callsites. Just confirm
no bare `cameraMode === 'GODHEAD'` references remain:

```bash
grep -rn "cameraMode.*GODHEAD\|GODHEAD.*cameraMode" spaceship-earth/src/
```

Should return 0 results after patching.

### Phase 2 — GC Allocation Fixes

See `PHASE2_PATCH.ts` for exact before/after replacements.

Add the 6 module-scope scratch objects, then do 5 find-and-replace operations
in the animate loop. Line numbers are approximate — search for the patterns.

### Phase 3 — After zustand bump

```bash
cd spaceship-earth && npm install
```

## Verification

```bash
cd spaceship-earth
npx tsc --noEmit          # 0 errors
npm run build             # clean build
npm run dev               # verify ImmersiveCockpit renders
npx vitest run            # 7 test suites pass

cd ../bonding
npm run build && npx vitest run   # no regression (329+ tests)
```

## Files Touched

| File | Phase | Action |
|------|-------|--------|
| `ImmersiveCockpit.tsx` | P0+P1+P2 | Fix viewPerspective, remove dead hook, GC fixes |
| `observatoryBuilder.ts` | P0 | Import resolves after OrbitState export |
| `SovereignShell.tsx` | P1 | Remove dead import |
| `useAutopoieticLoop.ts` | P1 | **DELETE** |
| `package.json` | P3 | zustand ^4→^5 |
| `eslint.config.mjs` | P4 | Optional, deferrable |
