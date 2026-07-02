#!/usr/bin/env bash
set -euo pipefail

# P31 Sovereign Justice — Phase 0 Full Automation
# Provisions Cloudflare resources, runs migrations, deploys workers
# Usage: bash scripts/provision.sh
# Requires: wrangler CLI authenticated, Node.js 18+

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JUSTICE_DIR="$(dirname "$SCRIPT_DIR")"
WRANGLER="npx wrangler"

echo "═══ P31 SOVEREIGN JUSTICE — PHASE 0 PROVISIONING ═══"
echo ""

# ── Step 1: Create D1 Database ────────────────────────────────────────
echo "▸ Checking D1 database: sovereign-justice-db"
DB_ID=$($WRANGLER d1 list 2>&1 | grep sovereign-justice-db | awk -F'│' '{print $2}' | xargs)
if [ -z "$DB_ID" ]; then
  echo "  → Creating..."
  DB_OUTPUT=$($WRANGLER d1 create sovereign-justice-db 2>&1 || true)
  if echo "$DB_OUTPUT" | grep -q "database_id"; then
    DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id: \K[^\n]+' || echo "$DB_OUTPUT" | grep -oP '"database_id":"\K[^"]+')
  fi
  DB_ID=$(echo "$DB_ID" | xargs)
fi
echo "  → Database ID: ${DB_ID:-"(not found)"}"

# ── Step 2: Create Vectorize Index ─────────────────────────────────────
echo "▸ Checking Vectorize index: p31-justice-corpus"
VEC_EXISTS=$($WRANGLER vectorize list 2>&1 | grep p31-justice-corpus || true)
if [ -z "$VEC_EXISTS" ]; then
  echo "  → Creating..."
  $WRANGLER vectorize create p31-justice-corpus --dimensions 1536 --metric cosine 2>&1
else
  echo "  → Already exists."
fi

# ── Step 3: Create R2 Bucket ───────────────────────────────────────────
echo "▸ Checking R2 bucket: sovereign-justice-evidence"
R2_EXISTS=$($WRANGLER r2 bucket list 2>&1 | grep sovereign-justice-evidence || true)
if [ -z "$R2_EXISTS" ]; then
  echo "  → Creating..."
  $WRANGLER r2 bucket create sovereign-justice-evidence 2>&1
else
  echo "  → Already exists."
fi

# ── Step 4: Create KV Namespace ────────────────────────────────────────
echo "▸ Checking KV namespace: JUSTICE_KV"
KV_ID=$($WRANGLER kv namespace list 2>&1 | grep JUSTICE_KV | awk -F'│' '{print $2}' | xargs || true)
if [ -z "$KV_ID" ]; then
  echo "  → Creating..."
  KV_OUTPUT=$($WRANGLER kv namespace create JUSTICE_KV 2>&1)
  KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+')
  echo "  → Created: $KV_ID"
else
  echo "  → Already exists (ID: $KV_ID)"
fi

# ── Step 5: Create Queue ───────────────────────────────────────────────
echo "▸ Checking Queue: evidence-ipfs-pinning"
QUEUE_EXISTS=$($WRANGLER queues list 2>&1 | grep evidence-ipfs-pinning || true)
if [ -z "$QUEUE_EXISTS" ]; then
  echo "  → Creating..."
  $WRANGLER queues create evidence-ipfs-pinning 2>&1
else
  echo "  → Already exists."
fi

# ── Step 6: Update configs with provisioned IDs ────────────────────────
echo ""
echo "═══ UPDATING CONFIG FILES ═══"

update_config() {
  local config="$JUSTICE_DIR/$1"
  local key="$2"
  local value="$3"
  if [ -n "$value" ] && grep -q "$key" "$config" 2>/dev/null; then
    sed -i "s|$key = \"\"|$key = \"$value\"|g" "$config" 2>/dev/null || true
    sed -i "s|$key = \"your-.*\"|$key = \"$value\"|g" "$config" 2>/dev/null || true
    echo "  → Updated $key in $1"
  fi
}

update_config "wrangler.toml" "database_id" "$DB_ID"
update_config "wrangler-rag.toml" "database_id" "$DB_ID"
update_config "wrangler-evidence.toml" "database_id" "$DB_ID"
update_config "wrangler-escrow.toml" "database_id" "$DB_ID"
update_config "wrangler-evidence.toml" "id" "$KV_ID"

echo "  → Config files updated."

# ── Step 7: Run D1 Migrations ──────────────────────────────────────────
echo ""
echo "═══ RUNNING MIGRATIONS ═══"
cd "$JUSTICE_DIR"
$WRANGLER d1 migrations apply JUSTICE_D1 --remote 2>&1 || true

# ── Step 8: Deploy Workers ────────────────────────────────────────────
echo ""
echo "═══ DEPLOYING WORKERS ═══"
echo ""

echo "▸ Deploying RAG Pipeline..."
$WRANGLER deploy --config wrangler-rag.toml 2>&1

echo ""
echo "▸ Deploying Evidence Vault..."
$WRANGLER deploy --config wrangler-evidence.toml 2>&1

echo ""
echo "▸ Deploying Escrow Engine..."
$WRANGLER deploy --config wrangler-escrow.toml 2>&1

# ── Step 9: Health Checks ─────────────────────────────────────────────
echo ""
echo "═══ HEALTH CHECKS ═══"
sleep 5
for WORKER in sovereign-justice-rag sovereign-justice-evidence sovereign-justice-escrow; do
  HEALTH_URL="https://${WORKER}.trimtab-signal.workers.dev/api/health"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "unreachable")
  BODY=$(curl -s "$HEALTH_URL" 2>/dev/null || echo '{}')
  echo "  $WORKER → HTTP $HTTP_CODE | $BODY"
done

echo ""
echo "═══ PROVISIONING COMPLETE ═══"
echo ""
echo "Endpoints:"
echo "  RAG:      https://sovereign-justice-rag.trimtab-signal.workers.dev"
echo "  Evidence: https://sovereign-justice-evidence.trimtab-signal.workers.dev"
echo "  Escrow:   https://sovereign-justice-escrow.trimtab-signal.workers.dev"
echo ""
echo "Dogfood with Johnson v. Johnson:"
echo "  bash scripts/dogfood.sh"
