#!/usr/bin/env bash
# p31-monitor.sh — continuous mesh/portal health + grant deadline tracking.
# Appends evidence to cli/logs/monitor.jsonl and alerts on failures/deadlines.
# Usage: scripts/p31-monitor.sh [--quiet]
# Designed for cron: 0 */6 * * *  /home/p31/P31-local-workspace/scripts/p31-monitor.sh --quiet

cd "$(dirname "$0")/.." || exit 1
QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true

LOG="cli/logs/monitor.jsonl"
mkdir -p cli/logs

# --- Surfaces: label|url (must return 200) ---
SURFACES=(
  "mesh|https://mesh.p31ca.org/health"
  "k4-cage|https://k4-cage.trimtab-signal.workers.dev/health"
  "k4-personal|https://k4-personal.trimtab-signal.workers.dev/health"
  "k4-hubs|https://k4-hubs.trimtab-signal.workers.dev/health"
  "p31-dispatch|https://p31-dispatch.trimtab-signal.workers.dev/health"
  "p31-passport|https://p31-passport.trimtab-signal.workers.dev/health"
  "spaceship-relay-mcp|https://spaceship-relay.trimtab-signal.workers.dev/mcp"
  "portal-willow|https://willow.p31ca.org"
  "portal-tetra|https://tetra.p31ca.org"
  "portal-sixseven|https://sixseven.p31ca.org"
  "portal-meatspace|https://meatspace.p31ca.org"
  "portal-design|https://design.p31ca.org"
  "portal-qpj|https://qpj.p31ca.org"
  "portal-chat|https://chat.p31ca.org"
  "site-p31ca|https://p31ca.org"
  "site-cli|https://cli.p31ca.org"
  "site-phosphorus|https://phosphorus31.org"
)

pass=0; fail=0; fails=""
for s in "${SURFACES[@]}"; do
  name="${s%%|*}"; url="${s#*|}"
  method="GET"
  [[ "$url" == *"/mcp" ]] && method="POST"
  if [[ "$method" == "POST" ]]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 12 \
      -X POST -H "content-type: application/json" \
      -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' "$url" 2>/dev/null || echo 000)
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 12 "$url" 2>/dev/null || echo 000)
  fi
  if [[ "$code" =~ ^[23] ]]; then pass=$((pass+1)); else fail=$((fail+1)); fails="$fails $name($code)"; fi
done

# --- Grant deadlines (date:label:url) ---
TODAY=$(date +%s)
DEADLINES=(
  "2026-09-18:TRANSFORM|https://www.transformgrant.org/apply"
  "2026-10-21:Humanity-AI|https://humanity.ai"
  "2026-11-04:NSF-SBIR-Phase-I|https://seedfund.nsf.gov"
  "2026-12-15:Biswas-Fast-Grants|https://biswasfoundation.org"
)
due=""
for d in "${DEADLINES[@]}"; do
  dt="${d%%:*}"; rest="${d#*:}"; label="${rest%%|*}"
  dts=$(date -d "$dt" +%s 2>/dev/null || echo 0)
  days=$(( (dts - TODAY) / 86400 ))
  if [[ $days -ge 0 && $days -le 14 ]]; then due="$due $label(${days}d)"; fi
done

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "{\"ts\":\"$TS\",\"pass\":$pass,\"fail\":$fail,\"fails\":\"${fails# }\",\"due_soon\":\"${due# }\"}" >> "$LOG"

if ! $QUIET || [[ $fail -gt 0 || -n "$due" ]]; then
  echo "P31 Monitor $TS — PASS $pass / FAIL $fail"
  [[ -n "$fails" ]] && echo "  FAILURES:$fails"
  [[ -n "$due" ]] && echo "  DEADLINES ≤14d:$due"
fi

# Surface a desktop notification on hard failure (best-effort)
if [[ $fail -gt 0 ]] && command -v notify-send >/dev/null 2>&1; then
  notify-send "P31 mesh degraded" "$fail surface(s) down:$fails" 2>/dev/null || true
fi

# Send Discord webhook alert if configured (non-fatal)
if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]] && [[ $fail -gt 0 ]]; then
  payload=$(python3 -c "
import json, sys
content = '⚠️ **P31 Monitor Alert**\nTime: ' + sys.argv[1] + '\nSurfaces down: ' + sys.argv[2] + '\nDeadlines soon: ' + sys.argv[3]
print(json.dumps({'content': content}))
" "$TS" "$fails" "$due")
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "${DISCORD_WEBHOOK_URL}" 2>/dev/null || true
fi

exit 0