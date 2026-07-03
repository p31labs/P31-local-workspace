#!/usr/bin/env bash
# ==============================================================================
# CVE-2026-29779 Verification Script
# Confirms client-side credential exposure is eliminated from PHOS.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHOS_ROOT="$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CVE-2026-29779 Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAIL=0

# ── 1. Check .env for secrets ───────────────────────────────────────────────
echo "[1/5] Checking .env for exposed secrets..."
if [ -f "$PHOS_ROOT/.env" ]; then
  if grep -qE "^PUBLIC_EDGE_AI_TOKEN=|^PUBLIC_JITTERBUG_PSK=***REDACTED*** "$PHOS_ROOT/.env" 2>/dev/null; then
    echo "  ❌ SECRETS FOUND in .env — remove before building"
    FAIL=1
  else
    echo "  ✓ No PUBLIC_* secrets in .env"
  fi
else
  echo "  ✓ No .env file"
fi

# ── 2. Check .env.example ──────────────────────────────────────────────────
echo "[2/5] Checking .env.example..."
if [ -f "$PHOS_ROOT/.env.example" ]; then
  if grep -qE "PUBLIC_EDGE_AI_TOKEN|PUBLIC_JITTERBUG_PSK" "$PHOS_ROOT/.env.example" 2>/dev/null; then
    echo "  ❌ Secrets still in .env.example"
    FAIL=1
  else
    echo "  ✓ .env.example is clean"
  fi
else
  echo "  ⚠ No .env.example found"
fi

# ── 3. Check source files for token references ──────────────────────────────
echo "[3/5] Checking source files for token references..."
TOKEN_REFS=$(grep -rn "PUBLIC_EDGE_AI_TOKEN\|PUBLIC_JITTERBUG_PSK" "$PHOS_ROOT/src" --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$TOKEN_REFS" ]; then
  echo "  ❌ Token references found in source:"
  echo "$TOKEN_REFS" | sed 's/^/    /'
  FAIL=1
else
  echo "  ✓ No token references in src/"
fi

# ── 4. Check built bundle ───────────────────────────────────────────────────
echo "[4/5] Checking built bundle (if dist/ exists)..."
if [ -d "$PHOS_ROOT/dist" ]; then
  BUNDLE_TOKENS=$(grep -rl "PUBLIC_EDGE_AI_TOKEN\|PUBLIC_JITTERBUG_PSK" "$PHOS_ROOT/dist" 2>/dev/null || true)
  if [ -n "$BUNDLE_TOKENS" ]; then
    echo "  ❌ Tokens found in built bundle:"
    echo "$BUNDLE_TOKENS" | sed 's/^/    /'
    FAIL=1
  else
    echo "  ✓ No tokens in built bundle"
  fi
else
  echo "  ⚠ No dist/ — run npm run build first"
fi

# ── 5. Check proxy endpoint references ─────────────────────────────────────
echo "[5/5] Checking proxy endpoint usage..."
PROXY_REFS=$(grep -rn "phos-ai-proxy" "$PHOS_ROOT/src" --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$PROXY_REFS" ]; then
  echo "  ✓ Frontend uses proxy worker:"
  echo "$PROXY_REFS" | sed 's/^/    /'
else
  echo "  ⚠ No proxy references in src/ — verify routing is correct"
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ CVE-2026-29779 VERIFIED — No client-side credential exposure"
else
  echo "  ❌ VERIFICATION FAILED — Review findings above"
  exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
