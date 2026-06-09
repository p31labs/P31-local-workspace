#!/usr/bin/env bash
# deploy.sh — fully automated passkey worker bootstrap + deploy
# Run from: software/p31ca/workers/passkey/
# Requires: wrangler (authenticated), jq

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
TOML="$SCRIPT_DIR/wrangler.toml"
SCHEMA="$SCRIPT_DIR/schema.sql"
KV_BINDING="CHALLENGES"
D1_NAME="p31-passkey-db"

log()  { echo "▸ $*"; }
die()  { echo "✗ $*" >&2; exit 1; }

# Prefer local install → parent p31ca node_modules → global
if   command -v wrangler >/dev/null 2>&1; then
  WRANGLER=wrangler
elif [ -x "$SCRIPT_DIR/../../node_modules/.bin/wrangler" ]; then
  WRANGLER="$SCRIPT_DIR/../../node_modules/.bin/wrangler"
elif [ -x "$SCRIPT_DIR/../../../node_modules/.bin/wrangler" ]; then
  WRANGLER="$SCRIPT_DIR/../../../node_modules/.bin/wrangler"
else
  die "wrangler not found — run: npm i -g wrangler && wrangler login"
fi
log "Using wrangler: $WRANGLER"
command -v jq       >/dev/null 2>&1 || die "jq not found — brew install jq  or  apt install jq"

# ── 1. KV namespace ──────────────────────────────────────────────────────────
if grep -q "REPLACE_WITH_KV_NAMESPACE_ID" "$TOML"; then
  log "Creating KV namespace '$KV_BINDING'…"
  KV_OUT=$($WRANGLER kv namespace create "$KV_BINDING" 2>&1)
  # Wrangler 4: "id = \"...\""; JSON-style output still possible
  KV_ID=$(printf '%s' "$KV_OUT" | tr '\n' ' ' | sed -n 's/.*\bid = "\([^"]*\)".*/\1/p')
  [ -n "$KV_ID" ] || KV_ID=$(printf '%s' "$KV_OUT" | tr '\n' ' ' | sed -n 's/.*"id" *: *"\([^"]*\)".*/\1/p')
  [ -n "$KV_ID" ] || die "Could not parse KV ID from:\n$KV_OUT"
  log "KV id: $KV_ID"
  sed -i "s/REPLACE_WITH_KV_NAMESPACE_ID/$KV_ID/g" "$TOML"
else
  log "KV namespace already set — skipping creation."
fi

# ── 2. D1 database ────────────────────────────────────────────────────────────
if grep -q "REPLACE_WITH_D1_DATABASE_ID" "$TOML"; then
  log "Creating D1 database '$D1_NAME'…"
  D1_OUT=$($WRANGLER d1 create "$D1_NAME" 2>&1)
  D1_ID=$(echo "$D1_OUT" | grep -o 'database_id = "[^"]*"' | awk -F'"' '{print $2}')
  [ -n "$D1_ID" ] || die "Could not parse D1 database_id from:\n$D1_OUT"
  log "D1 id: $D1_ID"
  sed -i "s/REPLACE_WITH_D1_DATABASE_ID/$D1_ID/g" "$TOML"
else
  log "D1 database already set — skipping creation."
fi

# ── 3. Apply schema ───────────────────────────────────────────────────────────
log "Applying schema to production D1…"
$WRANGLER d1 execute "$D1_NAME" --file="$SCHEMA" --env production --remote
log "Schema applied (remote D1)."

# ── 4. Deploy ─────────────────────────────────────────────────────────────────
log "Deploying p31-passkey → production…"
$WRANGLER deploy --env production
log "Worker deployed (production + zone route from wrangler.toml)."

# ── 5. Smoke test ─────────────────────────────────────────────────────────────
log "Smoke test: POST https://p31ca.org/api/passkey/register-begin"
RESP=$(curl -s -X POST https://p31ca.org/api/passkey/register-begin \
  -H "Content-Type: application/json" \
  --max-time 10 || true)

if echo "$RESP" | jq -e '.challenge' >/dev/null 2>&1; then
  log "✓ Live — challenge field present."
else
  echo "⚠ Response (route may need a minute to propagate):"
  echo "$RESP" | head -5
fi

log "Done. Commit the updated wrangler.toml:"
echo ""
echo "  git add workers/passkey/wrangler.toml"
echo "  git commit -m 'chore(passkey): fill KV + D1 IDs, deploy production'"
