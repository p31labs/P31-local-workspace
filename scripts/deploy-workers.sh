#!/usr/bin/env bash
# deploy-workers.sh — Deploy all K4 workers in dependency order, then verify.
# Usage: ./scripts/deploy-workers.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/software"

PASS=0
FAIL=0

deploy() {
  local name=$1 dir=$2
  echo ""
  echo "━━━ Deploying $name ━━━"
  if $DRY_RUN; then
    echo "[dry-run] would: cd $dir && npx wrangler deploy"
    return
  fi
  (cd "$dir" && npx wrangler deploy) && echo "✅ $name deployed" || { echo "❌ $name deploy failed"; FAIL=$((FAIL+1)); }
}

check() {
  local name=$1 url=$2
  code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo 000)
  if [[ "$code" == "200" ]]; then
    echo "  ✅ $name healthy"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name ($code)"
    FAIL=$((FAIL+1))
  fi
}

echo "P31 Workers Deploy — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Base: $BASE"
$DRY_RUN && echo "[DRY RUN MODE]"

# Deploy in dependency order
deploy k4-cage       "$BASE/k4-cage"
deploy k4-personal   "$BASE/k4-personal"
deploy k4-hubs       "$BASE/k4-hubs"
deploy p31-agent-hub "$BASE/p31-agent-hub"

if $DRY_RUN; then
  echo ""
  echo "Dry run complete — no changes made."
  exit 0
fi

echo ""
echo "━━━ Waiting for propagation (10s) ━━━"
sleep 10

echo ""
echo "━━━ Health checks ━━━"
check k4-cage       https://k4-cage.trimtab-signal.workers.dev/health
check k4-personal   https://k4-personal.trimtab-signal.workers.dev/health
check k4-hubs       https://k4-hubs.trimtab-signal.workers.dev/health
check p31-agent-hub https://p31-agent-hub.trimtab-signal.workers.dev/health

echo ""
echo "━━━ Mesh verification ━━━"
MESH=$(curl -sf --max-time 10 https://k4-cage.trimtab-signal.workers.dev/api/mesh 2>/dev/null || echo "{}")
TOPOLOGY=$(echo "$MESH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('topology','?'))" 2>/dev/null || echo "?")
VERTS=$(echo "$MESH"   | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('vertices',[])))" 2>/dev/null || echo "?")
EDGES=$(echo "$MESH"   | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('edges',[])))" 2>/dev/null || echo "?")

if [[ "$TOPOLOGY" == "K4" && "$VERTS" == "4" && "$EDGES" == "6" ]]; then
  echo "  ✅ Mesh: $TOPOLOGY — $VERTS vertices, $EDGES edges"
  PASS=$((PASS+1))
else
  echo "  ❌ Mesh check failed: topology=$TOPOLOGY vertices=$VERTS edges=$EDGES"
  FAIL=$((FAIL+1))
fi

echo ""
echo "━━━ Ping test (will → sj) ━━━"
PING=$(curl -sf -X POST --max-time 10 https://k4-cage.trimtab-signal.workers.dev/api/ping/will/sj 2>/dev/null || echo "{}")
PING_OK=$(echo "$PING" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ok',''))" 2>/dev/null || echo "")
LOVE=$(echo "$PING"    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('love','?'))" 2>/dev/null || echo "?")
if [[ "$PING_OK" == "True" ]]; then
  echo "  ✅ Ping ok — love: $LOVE"
  PASS=$((PASS+1))
else
  echo "  ❌ Ping failed: $PING"
  FAIL=$((FAIL+1))
fi

echo ""
echo "━━━ Summary: $PASS passed, $FAIL failed ━━━"
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
