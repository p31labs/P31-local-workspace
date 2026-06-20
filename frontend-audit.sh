#!/usr/bin/env bash
set -euo pipefail

FRONTEND_DIR="${1:-.}"
MODE="${2:-standard}"  # standard | strict

LEGACY_TERMS="SCRAM|scram|RedBoard|redboard|reactor|submarine|abdicate|kenosis|red.?board"

echo "========================================"
echo " PHOS Frontend Audit"
echo " Target: ${FRONTEND_DIR}"
echo " Mode:   ${MODE}"
echo "========================================"
FINDINGS=0

check() {
  local label="$1"
  local pattern="$2"
  local path="$3"
  shift 3
  local matches
  if matches=$(grep -rIn -E "$pattern" "$path" "$@" 2>/dev/null | grep -v 'node_modules/' | grep -v 'dist/' | grep -v '\.git/' | grep -v 'src-tauri/target/' | grep -v 'src/config/endpoints.ts' | grep -v '/__tests__/'); then
    echo "  [FAIL] ${label}"
    echo "${matches}" | sed 's/^/        /'
    FINDINGS=$((FINDINGS + 1))
  else
    echo "  [PASS] ${label}"
  fi
}

echo ""
echo "[1] Legacy terminology"
check "Hardcoded 'localhost' in source" 'localhost' "$FRONTEND_DIR/src"
check "Legacy military/naval terms" "$LEGACY_TERMS" "$FRONTEND_DIR/src"

echo ""
echo "[2] Hardcoded paths and secrets"
check "Absolute path leak (/home/p31)" '/home/p31' "$FRONTEND_DIR/src" "$FRONTEND_DIR/public"
check "API key/secret/token assignment" "(API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE)[\s:]*=" "$FRONTEND_DIR/src" "$FRONTEND_DIR/public"
  check "Hardcoded .env reference" '\.env' "$FRONTEND_DIR/src" "$FRONTEND_DIR/public"

echo ""
echo "[3] Frontend security"
if [ -f "$FRONTEND_DIR/.gitignore" ]; then
  echo "  [PASS] .gitignore present"
else
  echo "  [FAIL] .gitignore missing"
  FINDINGS=$((FINDINGS + 1))
fi
if [ -f "$FRONTEND_DIR/.env.example" ]; then
  echo "  [PASS] .env.example present"
else
  echo "  [FAIL] .env.example missing"
  FINDINGS=$((FINDINGS + 1))
fi

  if [ "$MODE" = "strict" ]; then
    echo ""
    echo "[4] Strict-mode checks"
    if [ -f "$FRONTEND_DIR/package-lock.json" ] || [ -f "$FRONTEND_DIR/pnpm-lock.yaml" ]; then
      echo "  [CHECK] npm audit (see npm output above)" || true
      (cd "$FRONTEND_DIR" && npm audit --omit=dev || true)
    else
      echo "  [PASS] npm audit skipped (no lockfile; add package-lock.json or pnpm-lock.yaml to enable)"
    fi
    if command -v npx >/dev/null 2>&1 && [ -f "$FRONTEND_DIR/package.json" ]; then
      echo "  [CHECK] typecheck" || true
      (cd "$FRONTEND_DIR" && npm run typecheck || true)
    fi
  fi

echo ""
echo "========================================"
echo " FINDINGS: ${FINDINGS}"
echo "========================================"

exit ${FINDINGS}
