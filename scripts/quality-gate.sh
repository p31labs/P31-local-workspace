#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1"; FAIL=$((FAIL+1)); }

echo "=== P31 Quality Gate — $TIMESTAMP ==="

# 1. p31-audit-scan.sh exits clean
if bash scripts/p31-audit-scan.sh; then
  pass "audit-scan.sh completes successfully"
else
  fail "audit-scan.sh exited $?"
fi

# 2. No unstaged changes in tracked files
if git diff --quiet; then
  pass "Working tree is clean"
else
  fail "Unstaged changes present"
fi

# 3. MANIFEST is valid YAML anchor
if grep -q 'P31_SHELF_MANIFEST' P31_SHELF_MANIFEST.yaml 2>/dev/null; then
  pass "Shelf manifest is reachable"
else
  fail "Shelf manifest missing anchor"
fi

# 4. FUEL_BUDGET hasn't drifted
if grep -q 'P31-FUEL-BUDGET' P31-FUEL-BUDGET.yaml 2>/dev/null; then
  pass "Fuel budget anchored"
else
  fail "Fuel budget missing"
fi

# 5. CLAUDE.md & AGENTS.md present
for f in CLAUDE.md AGENTS.md; do
  if [ -f "$f" ]; then
    pass "$f present"
  else
    fail "$f missing"
  fi
done

# 6. Check for stale temp files
STALE=$(find /home/p31/P31-local-workspace -maxdepth 1 -name '*.tmp*' -o -name '*.bak' | head -5)
if [ -z "$STALE" ]; then
  pass "No stale temp files"
else
  fail "Stale temp files exist"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
echo "Gate: $([ "$FAIL" -eq 0 ] && echo 'PASSED' || echo 'FAILED')"

BUS="/home/p31/P31-local-workspace/tools/phos-forge/bus.mjs"
if [[ -f "$BUS" ]]; then
  node "$BUS" emit "quality-gate.completed" "{\"passed\":${PASS},\"failed\":${FAIL},\"timestamp\":\"${TIMESTAMP}\"}" >/dev/null 2>&1 &
fi
exit $FAIL
