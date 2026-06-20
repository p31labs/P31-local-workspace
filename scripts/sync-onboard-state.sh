#!/usr/bin/env bash
# sync-onboard-state.sh — Sync p31ca onboarding state to operational state file
# Part of the P31 Shipyard Protocol. Called by yardmaster cycle or cron.
set -euo pipefail

P31_REPO_ROOT="${P31_REPO_ROOT:-/home/p31/P31-local-workspace}"
STATE_DIR="${P31_REPO_ROOT}/state"
STATE_FILE="${STATE_DIR}/onboard-state.json"
PORTAL_URL="${1:-https://856f9476.p31ca.pages.dev/onboard/health}"

mkdir -p "$STATE_DIR"

# Fetch the health endpoint that dumps localStorage state
HTTP_CODE=$(curl -s -o /tmp/onboard-state-$$.json -w "%{http_code}" --max-time 10 "$PORTAL_URL" 2>/dev/null || echo "000")

if [[ "$HTTP_CODE" == "200" ]]; then
  # Validate it's parseable JSON
  if python3 -c "import json; json.load(open('/tmp/onboard-state-$$.json'))" 2>/dev/null; then
    cp /tmp/onboard-state-$$.json "$STATE_FILE"
    echo "onboard state synced: $(date -u +%Y-%m-%dT%H:%M:%SZ) (HTTP $HTTP_CODE)"
  else
    echo "WARN: bad JSON from portal, writing fallback"
    echo "{\"_status\":\"error\",\"_http\":\"$HTTP_CODE\",\"_timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATE_FILE"
  fi
else
  echo "WARN: portal returned HTTP $HTTP_CODE, writing error state"
  echo "{\"_status\":\"unreachable\",\"_http\":\"$HTTP_CODE\",\"_timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATE_FILE"
fi

rm -f /tmp/onboard-state-$$.json
