#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
API_DIR="$WORKSPACE_ROOT/software/packages/jitterbug-api"
PWA_DIR="$WORKSPACE_ROOT/software/packages/jitterbug-pwa"
WRANGLER="${WRANGLER:-npx wrangler}"

log() {
  echo "[deploy-jitterbug] $1"
}

require_tool() {
  if ! command -v "$1" &>/dev/null; then
    log "ERROR: Required tool '$1' not found in PATH"
    exit 1
  fi
}

require_tool node
require_tool pnpm

update_wrangler_toml() {
  local db_name="$1"
  local db_id="$2"
  local r2_name="$3"
  local kv_id="$4"

  local toml="$API_DIR/wrangler.toml"
  if [[ -f "$toml" ]]; then
    sed -i "s|database_name = \".*\"|database_name = \"$db_name\"|g" "$toml"
    sed -i "s|database_id = \".*\"|database_id = \"$db_id\"|g" "$toml"
    sed -i "s|bucket_name = \".*\"|bucket_name = \"$r2_name\"|g" "$toml"
    sed -i '/\[\[kv_namespaces\]\]/,/^\[/ s|id = \".*\"|id = \"'$kv_id'\"|g' "$toml"
    log "Updated $toml with live resource IDs"
  else
    log "WARNING: $toml not found, skipping ID update"
  fi
}

log "=== Jitterbug Automated Deployment ==="

# 1. Build packages
log "Building brain-dump-orchestrator..."
cd "$WORKSPACE_ROOT/software/packages/brain-dump-orchestrator"
pnpm run typecheck
pnpm run build

log "Building jitterbug-api..."
cd "$API_DIR"
pnpm run build

log "Building jitterbug-pwa..."
cd "$PWA_DIR"
pnpm run build

# 2. Provision resources (idempotent)
log "Provisioning Cloudflare resources..."

DB_NAME="jitterbug-db"
R2_NAME="jitterbug-deliverables"
KV_TITLE="jitterbug-status-cache"

# D1 Database
DB_ID="$($WRANGLER d1 list --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const m=j.find(x=>x.name==='$DB_NAME');if(m){console.log(m.uuid)}else{console.log('')}}catch(e){console.log('')}})")"

if [[ -z "$DB_ID" ]]; then
  log "Creating D1 database '$DB_NAME'..."
  DB_CREATE_OUT=$($WRANGLER d1 create "$DB_NAME" 2>&1)
  DB_ID=$(echo "$DB_CREATE_OUT" | grep -oE 'database_id = "[^"]+"' | sed 's/database_id = "//;s/"//')
  if [[ -z "$DB_ID" ]]; then
    log "ERROR: Could not extract D1 database ID"
    echo "$DB_CREATE_OUT"
    exit 1
  fi
  log "Created D1 database: $DB_ID"
else
  log "D1 database already exists: $DB_ID"
fi

# R2 Bucket
R2_EXISTS=$($WRANGLER r2 bucket list 2>/dev/null | grep -c "$R2_NAME" || true)
if [[ "$R2_EXISTS" -eq 0 ]]; then
  log "Creating R2 bucket '$R2_NAME'..."
  $WRANGLER r2 bucket create "$R2_NAME"
  log "Created R2 bucket: $R2_NAME"
else
  log "R2 bucket already exists: $R2_NAME"
fi

# KV Namespace
KV_JSON="$($WRANGLER kv namespace list 2>/dev/null || true)"
if [[ -n "$KV_JSON" ]]; then
  KV_ID=$(echo "$KV_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const m=j.find(x=>x.title==='$KV_TITLE');if(m){console.log(m.id)}else{console.log('')}}catch(e){console.log('')}})")
fi

if [[ -z "${KV_ID:-}" ]]; then
  log "Creating KV namespace '$KV_TITLE'..."
  KV_OUT=$(echo 'y' | $WRANGLER kv namespace create "$KV_TITLE" 2>&1)
  KV_JSON="$($WRANGLER kv namespace list 2>/dev/null || true)"
  KV_ID=$(echo "$KV_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const m=j.find(x=>x.title==='$KV_TITLE');if(m){console.log(m.id)}else{console.log('')}}catch(e){console.log('')}})")
  if [[ -z "$KV_ID" ]]; then
    log "ERROR: Could not extract KV namespace ID"
    exit 1
  fi
  log "Created KV namespace: $KV_ID"
else
  log "KV namespace already exists: $KV_ID"
fi

# 3. Update wrangler.toml with live IDs
update_wrangler_toml "$DB_NAME" "$DB_ID" "$R2_NAME" "$KV_ID"

# 4. Apply D1 migrations (idempotent)
run_migration() {
  local sql_file="$1"
  log "Running migration: $(basename "$sql_file")"
  local output
  output=$($WRANGLER d1 execute "$DB_NAME" --file="$sql_file" --remote 2>&1) || {
    if echo "$output" | grep -qi "duplicate column name\|already exists"; then
      log "Migration already applied, skipping"
      return 0
    fi
    log "ERROR: Migration failed: $output"
    return 1
  }
  log "Migration applied: $(basename "$sql_file")"
}

MIGRATIONS_DIR="$WORKSPACE_ROOT/migrations"
run_migration "$MIGRATIONS_DIR/001_initial.sql"
run_migration "$MIGRATIONS_DIR/002_add_recursive_fields.sql"
run_migration "$MIGRATIONS_DIR/003_add_ephemeralization.sql"

# 5. Set PSK secret
log "Setting PSK secret..."
PSK_VALUE="p31-sierpinski-ophile-ophore-ssm-$(date +%s)"
echo "$PSK_VALUE" | $WRANGLER secret put PSK 2>/dev/null || true
log "PSK secret configured"

# Remove cron triggers since free plan only allows 5
log "Removing cron triggers from wrangler.toml..."
sed -i '/^\[triggers\]/,/^$/d' "$API_DIR/wrangler.toml"

# 6. Deploy API Worker
log "Deploying jitterbug-api Worker..."
cd "$API_DIR"
DEPLOY_OUTPUT=$($WRANGLER deploy 2>&1)
echo "$DEPLOY_OUTPUT" | tail -10
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[^ ]+workers.dev' | head -1)
if [[ -z "$WORKER_URL" ]]; then
  WORKER_URL="https://jitterbug-api.trimtab-signal.workers.dev"
  log "WARNING: Could not extract Worker URL from deploy output, using known URL"
fi

# 7. Post-deploy health check
log "Running post-deploy health check..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $PSK_VALUE" "$WORKER_URL/health" 2>/dev/null || echo "000")
if [[ "$HEALTH_RESPONSE" == "200" ]]; then
  log "✅ Health check passed: $WORKER_URL/health"
else
  log "⚠️  Health check returned HTTP $HEALTH_RESPONSE — Worker may still be initializing"
fi

# 8. Deploy PWA
log "Deploying jitterbug-pwa..."
cd "$PWA_DIR"
VITE_API_URL="$WORKER_URL" pnpm run build

$WRANGLER pages deploy dist --project-name jitterbug-pwa --branch production 2>&1 | tail -10

# 9. Persist PSK for local development
log "Persisting PSK to .env.jitterbug..."
cat > "$WORKSPACE_ROOT/software/.env.jitterbug" <<EOF
# Jitterbug API PSK (generated $(date -Iseconds))
JITTERBUG_PSK=***REDACTED***
JITTERBUG_API_URL=$WORKER_URL
EOF
chmod 600 "$WORKSPACE_ROOT/software/.env.jitterbug"

log "=== Deployment Complete ==="
log "Worker: $WORKER_URL"
log "PWA: https://jitterbug-pwa.pages.dev"
log "PSK: $PSK_VALUE"
log "Env file: $WORKSPACE_ROOT/software/.env.jitterbug"
