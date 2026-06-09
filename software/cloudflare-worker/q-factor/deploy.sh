#!/usr/bin/env bash
# Q-Factor Worker deploy
set -euo pipefail
cd "$(dirname "$0")"

for f in "../../.env.master" "../../../.env.master"; do
  [ -f "$f" ] && { set -a; source "$f"; set +a; echo "Loaded $f"; break; }
done

command -v wrangler >/dev/null 2>&1 || { echo "wrangler not found"; exit 1; }

echo "[1/3] Creating KV namespace..."
wrangler kv namespace create p31-qfactor-state 2>/dev/null || echo "  (already exists)"
KV_ID=$(wrangler kv namespace list --json 2>/dev/null | \
  python3 -c "import sys,json; ns=json.load(sys.stdin); \
    n=next((x for x in ns if 'p31-qfactor-state' in x.get('title','')),None); \
    print(n['id'] if n else '')" 2>/dev/null || echo "")
[ -n "$KV_ID" ] && sed -i "s/REPLACE_with_wrangler_kv_create_output/$KV_ID/g" wrangler.toml && \
  echo "  KV ID: $KV_ID"

echo "[2/3] Setting secrets..."
for S in P31_API_SECRET P31_FHIR_SECRET; do
  VAL="${!S:-}"
  if [ -n "$VAL" ]; then
    echo "$VAL" | wrangler secret put "$S" --env production 2>&1 | grep -q "Success" && \
      echo "  $S: ✓" || echo "  $S: (may already be set)"
  else
    echo "  $S not in environment — prompting:"
    wrangler secret put "$S" --env production
  fi
done

echo "[3/3] Deploying..."
wrangler deploy --env production
echo "Done — api.p31ca.org/qfactor/*"
