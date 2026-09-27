#!/bin/bash
set -e
cd "${0%/*}/.."

PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo "🔍 P31-Q Design System Audit"
echo "============================"
echo ""

# ── 1. QDS imports ──
echo "1. Residual QDS imports..."
if grep -r "quantum-design-system" apps/p31ca/ apps/phosphorus31/ apps/phos/ apps/willow/ \
   --include='*.{ts,tsx,js,jsx,css,astro}' \
   2>/dev/null | grep -v node_modules | grep -q .; then
  fail "Found residual QDS imports"
else
  pass "No residual QDS imports"
fi

# ── 2. Deleted Crown/GlassCard direct imports ──
echo ""
echo "2. Deleted component imports..."
for pat in "from ['\\\"]./Crown['\\\"]" "from ['\\\"]./GlassCard['\\\"]"; do
  if grep -r "$pat" packages/ui/src/ apps/ 2>/dev/null | grep -v node_modules | grep -v storybook | grep -v dist-storybook | grep -v __stories__ | grep -q .; then
    fail "Found direct import of deleted component ($pat)"
  else
    pass "No direct $pat imports"
  fi
done

# ── 3. design-core CSS module coverage ──
echo ""
echo "3. Design-core CSS module coverage..."
declare -A EXPECTED_MODULES=(
  [base]=1 [glass]=1 [motion]=1 [typography]=1
  [size-class]=1 [ambient]=1 [container]=1 [quantum]=1 [link-glow]=1
)
declare -A ENTRY_FILES=(
  [p31ca]="apps/p31ca/src/layouts/AppShell.astro"
  [phosphorus31]="apps/phosphorus31/src/layouts/Layout.astro"
  [phos]="apps/phos/src/styles/globals.css"
  [willow]="apps/willow/src/styles/globals.css"
)
for app in p31ca phosphorus31 phos willow; do
  f="${ENTRY_FILES[$app]}"
  missing=""
  for mod in base glass motion typography size-class ambient container quantum link-glow; do
    grep -q "@p31ca/design-core/css/${mod}.css" "$f" 2>/dev/null || missing="$missing $mod"
  done
  if [ -z "$missing" ]; then
    pass "$app: all 9 design-core CSS modules"
  else
    fail "$app: missing$missing"
  fi
done

# ── 4. data-brand and data-spoons ──
echo ""
echo "4. data-brand and data-spoons..."

check_brand_spoons() {
  local app=$1 pattern=$2
  local found_brand=0 found_spoons=0
  shopt -s nullglob
  for f in $pattern; do
    [ -f "$f" ] || continue
    grep -q "data-brand" "$f" 2>/dev/null && found_brand=1
    grep -q "data-spoons" "$f" 2>/dev/null && found_spoons=1
  done
  shopt -u nullglob
  [ "$found_brand" -eq 1 ] && pass "$app: data-brand set" || fail "$app: data-brand NOT set"
  [ "$found_spoons" -eq 1 ] && pass "$app: data-spoons set" || fail "$app: data-spoons NOT set"
}

check_brand_spoons p31ca "apps/p31ca/src/layouts/AppShell.astro"
check_brand_spoons phosphorus31 "apps/phosphorus31/src/layouts/Layout.astro"
check_brand_spoons phos "apps/phos/index.html apps/phos/src/"
check_brand_spoons willow "apps/willow/index.html apps/willow/src/"

# ── 5. Crown/GlassCard resolve from design-core ──
echo ""
echo "5. Crown/GlassCard import resolution..."
if grep -r "from ['\\\"]@p31ca/design-core/generated/Crown" packages/ui/src/ 2>/dev/null | grep -q .; then
  pass "Crown imported from design-core (via ui/chrome)"
else
  fail "Crown NOT imported from design-core"
fi
if grep -r "from ['\\\"]@p31ca/design-core/generated/GlassCard" packages/ui/src/ 2>/dev/null | grep -q .; then
  pass "GlassCard imported from design-core (via ui/chrome)"
else
  fail "GlassCard NOT imported from design-core"
fi

# ── 6. SpoonDial in ui ──
echo ""
echo "6. SpoonDial canonical location..."
if [ -f "packages/ui/src/chrome/SpoonDial.tsx" ]; then
  pass "SpoonDial.tsx exists in ui/chrome/"
else
  fail "SpoonDial.tsx MISSING from ui/chrome/"
fi
if grep -r "export.*SpoonDial" packages/ui/src/chrome/index.ts 2>/dev/null | grep -q .; then
  pass "SpoonDial exported from ui/chrome/index.ts"
else
  fail "SpoonDial NOT exported from ui/chrome/index.ts"
fi

# ── 7. App dependencies ──
echo ""
echo "7. App dependencies..."
for app in p31ca phosphorus31 phos willow; do
  if grep -q '"@p31ca/design-core"' "apps/$app/package.json" 2>/dev/null; then
    pass "$app depends on @p31ca/design-core"
  else
    fail "$app missing @p31ca/design-core dependency"
  fi
done

# ── 8. phos/willow app.css import ──
echo ""
echo "8. phos/willow app.css import..."
for app in phos willow; do
  if grep -q "app\.css\|styles/globals\.css" "apps/$app/src/main.tsx" 2>/dev/null; then
    pass "$app imports styles (globals.css)"
  else
    fail "$app missing styles import"
  fi
done

# ── Summary ──
echo ""
echo "============================"
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "✅ Audit complete — all checks passed."
