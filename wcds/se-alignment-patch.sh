#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Spaceship Earth — Production Alignment Patch Script
# Phases 0-3 from alignment doc
# Run from: software/
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SE_DIR="spaceship-earth"
SRC="$SE_DIR/src"
SOVEREIGN="$SRC/components/rooms/sovereign"

echo "═══ PHASE 0: Unblock the Build ═══"

# --- Fix 1: ImmersiveCockpit.tsx — cameraMode → viewPerspective ---
echo "[P0] Patching ImmersiveCockpit.tsx: cameraMode === 'GODHEAD' → viewPerspective === 'GODHEAD'"

# This sed adds viewPerspective to the destructure on the line that already pulls cameraMode
# Adjust the pattern if the destructure line differs
sed -i "s/useSovereignStore.getState().cameraMode !== 'GODHEAD'/useSovereignStore.getState().viewPerspective !== 'GODHEAD'/g" "$SOVEREIGN/ImmersiveCockpit.tsx"
sed -i "s/state\.cameraMode === 'GODHEAD'/state.viewPerspective === 'GODHEAD'/g" "$SOVEREIGN/ImmersiveCockpit.tsx"

echo "[P0] Fix 1 applied."

# --- Fix 2: Export OrbitState interface ---
echo "[P0] Adding OrbitState export to ImmersiveCockpit.tsx"

# Insert the export interface before the component function declaration
# We look for the first 'export default function' or 'export function' or 'const ImmersiveCockpit'
# and insert before it
ORBIT_STATE_BLOCK='export interface OrbitState {\
  rx: number; ry: number;\
  trx: number; try_: number;\
  tDist: number;\
  flyFrom: { rx: number; ry: number; dist: number } | null;\
  flyTo: { rx: number; ry: number; dist: number } | null;\
  flyT: number;\
}\
'

# Check if OrbitState already exists
if ! grep -q "export interface OrbitState" "$SOVEREIGN/ImmersiveCockpit.tsx"; then
  # Insert before the component. Find first 'export' that's a function/const component
  sed -i "/^export \(default \)\?function\|^const ImmersiveCockpit/i\\
$ORBIT_STATE_BLOCK" "$SOVEREIGN/ImmersiveCockpit.tsx"
  echo "[P0] OrbitState interface exported."
else
  echo "[P0] OrbitState already exists, skipping."
fi

echo ""
echo "═══ PHASE 1: Remove Dead Code ═══"

# --- Delete useAutopoieticLoop.ts ---
if [ -f "$SRC/hooks/useAutopoieticLoop.ts" ]; then
  rm "$SRC/hooks/useAutopoieticLoop.ts"
  echo "[P1] Deleted useAutopoieticLoop.ts"
else
  echo "[P1] useAutopoieticLoop.ts already removed."
fi

# --- Remove import and call from ImmersiveCockpit.tsx ---
echo "[P1] Removing useAutopoieticLoop import/call from ImmersiveCockpit.tsx"
sed -i "/import.*useAutopoieticLoop/d" "$SOVEREIGN/ImmersiveCockpit.tsx"
sed -i "/useAutopoieticLoop/d" "$SOVEREIGN/ImmersiveCockpit.tsx"

# --- Remove dead import from SovereignShell.tsx ---
echo "[P1] Removing dead useAutopoieticLoop import from SovereignShell.tsx"
sed -i "/import.*useAutopoieticLoop/d" "$SOVEREIGN/SovereignShell.tsx"

echo ""
echo "═══ PHASE 2: Per-Frame GC Allocations ═══"
echo "[P2] Applying scratch object patch — see PHASE2_PATCH.ts for manual integration"
echo "     (sed cannot safely handle multi-line JSX transforms; apply manually)"

echo ""
echo "═══ PHASE 3: Zustand Version Alignment ═══"
echo "[P3] Bumping zustand ^4.4.0 → ^5.0.0 in $SE_DIR/package.json"

if [ -f "$SE_DIR/package.json" ]; then
  sed -i 's/"zustand": "\^4\.[0-9]*\.[0-9]*"/"zustand": "^5.0.0"/' "$SE_DIR/package.json"
  echo "[P3] zustand bumped. Run: cd $SE_DIR && npm install"
else
  echo "[P3] WARNING: $SE_DIR/package.json not found."
fi

echo ""
echo "═══ VERIFICATION ═══"
echo "Run these manually:"
echo "  cd $SE_DIR && npx tsc --noEmit"
echo "  npm run build"
echo "  npm run dev  # verify ImmersiveCockpit renders"
echo "  npx vitest run"
echo "  cd ../bonding && npm run build && npx vitest run"
echo ""
echo "Done. Phases 0, 1, 3 automated. Phase 2 requires manual patch (see PHASE2_PATCH.ts)."
