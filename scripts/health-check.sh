#!/usr/bin/env bash
# health-check.sh — R05 CWP-2026-014
# Checks /health on all active P31 Cloudflare Workers.
# Usage: ./scripts/health-check.sh [--json]

set -euo pipefail

JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

declare -A WORKERS=(
  # K4 mesh workers (workers-april22 / CWP-30)
  ["k4-cage"]="https://k4-cage.trimtab-signal.workers.dev/health"
  ["k4-personal"]="https://k4-personal.trimtab-signal.workers.dev/health"
  ["k4-hubs"]="https://k4-hubs.trimtab-signal.workers.dev/health"
  ["p31-agent-hub"]="https://p31-agent-hub.trimtab-signal.workers.dev/health"
  # Legacy workers
  ["bonding-relay"]="https://bonding-relay.trimtab-signal.workers.dev/health"
  ["spaceship-relay"]="https://spaceship-relay.trimtab-signal.workers.dev/health"
  ["p31-cortex"]="https://p31-cortex.trimtab-signal.workers.dev/health"
  ["kenosis-mesh"]="https://kenosis-mesh.trimtab-signal.workers.dev/health"
  ["p31-telemetry"]="https://p31-telemetry.trimtab-signal.workers.dev/health"
  ["p31-kofi-webhook"]="https://kofi.p31ca.org/health"
  ["p31-social-worker"]="https://social.p31ca.org/health"
  ["donate-api"]="https://donate-api.phosphorus31.org/health"
)

PASS=0
FAIL=0
RESULTS=()

for name in "${!WORKERS[@]}"; do
  url="${WORKERS[$name]}"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]]; then
    PASS=$((PASS + 1))
    RESULTS+=("  ✅  $name ($http_code)")
  else
    FAIL=$((FAIL + 1))
    RESULTS+=("  ❌  $name ($http_code) → $url")
  fi
done

if $JSON_MODE; then
  echo "{"
  echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"pass\": $PASS,"
  echo "  \"fail\": $FAIL,"
  echo "  \"workers\": {"
  for name in "${!WORKERS[@]}"; do
    url="${WORKERS[$name]}"
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")
    status="fail"
    [[ "$http_code" == "200" ]] && status="ok"
    echo "    \"$name\": { \"status\": \"$status\", \"http\": $http_code }"
  done
  echo "  }"
  echo "}"
else
  echo ""
  echo "P31 Worker Health Check — $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo "══════════════════════════════════════════════════"
  for result in "${RESULTS[@]}"; do
    echo "$result"
  done
  echo "══════════════════════════════════════════════════"
  echo "  PASS: $PASS  FAIL: $FAIL"
  echo ""
  [[ $FAIL -gt 0 ]] && exit 1 || exit 0
fi
