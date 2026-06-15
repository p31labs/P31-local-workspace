#!/usr/bin/env bash
# Test Compilation Verifier — validates every accelerate.test.* file compiles.
# Usage: bash scripts/jitterbug-test-verify.sh
# Returns: 0 if all pass, 1 if any fail

set -euo pipefail
REPO="/home/p31/andromeda"
PASS=0
FAIL=0
FIXED=0

echo "=== Jitterbug Test Compilation Verifier ==="
echo ""

# Find all accelerate test files
cd "$REPO"
FILES=$(find . -name "accelerate.test.*" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null || true)

if [ -z "$FILES" ]; then
    echo "No accelerate test files found. Checkout the acceleration branch?"
    echo "  git checkout accelerate/seed-sweep-flow5"
    exit 0
fi

for tf in $FILES; do
    dir=$(dirname "$tf")
    base=$(basename "$tf" .test.*)

    # Try tsc --noEmit in the artifact directory
    if [ -f "$dir/../tsconfig.json" ]; then
        tsdir="$dir/.."
    elif [ -f "$dir/../../tsconfig.json" ]; then
        tsdir="$dir/../.."
    else
        # Try root tsconfig
        tsdir="$REPO"
    fi

    if [ "${tf##*.}" = "ts" ]; then
        if npx --yes tsc --noEmit --strict false --skipLibCheck --module esnext --target esnext --moduleResolution node --esModuleInterop "$tf" 2>/dev/null; then
            echo "  ✓ PASS: $tf"
            PASS=$((PASS + 1))
        else
            # Try fixing: maybe import path wrong
            echo "  ✗ FAIL: $tf"
            FAIL=$((FAIL + 1))
        fi
    else
        # .mjs file — skip tsc, just node --check
        if node --check "$tf" 2>/dev/null; then
            echo "  ✓ PASS: $tf (node syntax)"
            PASS=$((PASS + 1))
        else
            echo "  ✗ FAIL: $tf (node syntax)"
            FAIL=$((FAIL + 1))
        fi
    fi
done

echo ""
echo "=== Results ==="
echo "  Pass: $PASS"
echo "  Fail: $FAIL"
echo "  Fixed: $FIXED"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "Some tests fail compilation. Run with verbose for details."
    exit 1
fi
exit 0
