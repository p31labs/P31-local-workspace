#!/usr/bin/env bash
# P31 FHIR Calcium Monitoring Worker — deploy automation
# Reads secrets from .env.master if present, otherwise prompts.
# Usage: bash deploy.sh [--dry-run] [--skip-schema] [--skip-secrets]

set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

DRY=false; SKIP_SCHEMA=false; SKIP_SECRETS=false
for arg in "$@"; do
  case $arg in
    --dry-run) DRY=true ;;
    --skip-schema) SKIP_SCHEMA=true ;;
    --skip-secrets) SKIP_SECRETS=true ;;
  esac
done

# Load .env.master if present
for candidate in "../../.env.master" "../../../.env.master" ~/.env.master; do
  [ -f "$candidate" ] && { set -a; source "$candidate"; set +a; log "Loaded $(realpath "$candidate")"; break; }
done

command -v wrangler >/dev/null 2>&1 || die "wrangler not found — npm install -g wrangler"

echo ""
echo "P31 FHIR Calcium Worker — Deploy"
echo "  Dry run:     $DRY"
echo "  Skip schema: $SKIP_SCHEMA"
echo "  Skip secrets: $SKIP_SECRETS"
echo ""

# ── 1. TypeScript type check ──────────────────────────────────────────────
log "[1/6] Type check..."
npx tsc --noEmit 2>&1 | head -20 || die "TypeScript errors found"
log "  Type check passed"

# ── 2. D1 database (idempotent) ───────────────────────────────────────────
log "[2/6] D1 database..."
if $DRY; then
  warn "  --dry-run: skipping D1 create"
else
  wrangler d1 create p31-fhir-db 2>/dev/null && log "  D1 created" || log "  D1 already exists"

  # Capture real ID if wrangler.toml still has the placeholder
  if grep -q "REPLACE_WITH_D1_ID" wrangler.toml 2>/dev/null; then
    D1_ID=$(wrangler d1 list --json 2>/dev/null | \
      python3 -c "import sys,json; dbs=json.load(sys.stdin); \
        db=next((d for d in dbs if d['name']=='p31-fhir-db'),None); \
        print(db['uuid'] if db else '')" 2>/dev/null || echo "")
    [ -n "$D1_ID" ] && sed -i "s/REPLACE_WITH_D1_ID/$D1_ID/g" wrangler.toml && \
      log "  D1 ID updated: $D1_ID"
  fi
fi

# ── 3. KV namespace (idempotent) ──────────────────────────────────────────
log "[3/6] KV namespace..."
if $DRY; then
  warn "  --dry-run: skipping KV create"
else
  wrangler kv namespace create p31-fhir-tokens 2>/dev/null && log "  KV created" || log "  KV already exists"

  if grep -q "REPLACE_WITH_KV_ID" wrangler.toml 2>/dev/null; then
    KV_ID=$(wrangler kv namespace list --json 2>/dev/null | \
      python3 -c "import sys,json; ns=json.load(sys.stdin); \
        n=next((x for x in ns if 'p31-fhir-tokens' in x.get('title','')),None); \
        print(n['id'] if n else '')" 2>/dev/null || echo "")
    [ -n "$KV_ID" ] && sed -i "s/REPLACE_WITH_KV_ID/$KV_ID/g" wrangler.toml && \
      log "  KV ID updated: $KV_ID"
  fi
fi

# ── 4. D1 schema ──────────────────────────────────────────────────────────
log "[4/6] D1 schema..."
if $SKIP_SCHEMA || $DRY; then
  warn "  Skipped"
else
  wrangler d1 execute p31-fhir-db --file schema.sql --env production 2>&1 | \
    grep -v "^$" | head -5 || warn "  Schema may already exist (idempotent)"
  log "  Schema applied"
fi

# ── 5. Secrets ────────────────────────────────────────────────────────────
log "[5/6] Secrets..."
if $SKIP_SECRETS; then
  warn "  Skipped (--skip-secrets)"
elif $DRY; then
  warn "  --dry-run: would set:"
  for S in EPIC_CLIENT_ID EPIC_CLIENT_SECRET HA_WEBHOOK_CRITICAL HA_WEBHOOK_WARNING P31_API_SECRET; do
    echo "    wrangler secret put $S --env production"
  done
else
  # Auto-set from environment if available, otherwise prompt
  for SECRET in EPIC_CLIENT_ID EPIC_CLIENT_SECRET HA_WEBHOOK_CRITICAL HA_WEBHOOK_WARNING P31_API_SECRET; do
    VAL="${!SECRET:-}"
    if [ -n "$VAL" ]; then
      printf "  %-30s " "$SECRET"
      echo "$VAL" | wrangler secret put "$SECRET" --env production 2>&1 | \
        grep -q "Success" && echo "✓" || echo "(may already be set)"
    else
      echo "  $SECRET not in environment — prompting:"
      wrangler secret put "$SECRET" --env production
    fi
  done
fi

# ── 6. Deploy ─────────────────────────────────────────────────────────────
log "[6/6] Deploy..."
if $DRY; then
  wrangler deploy --dry-run --env production 2>&1 | tail -3
  warn "  --dry-run: no deploy executed"
else
  wrangler deploy --env production
  log "  Deployed → api.p31ca.org/fhir/*"

  sleep 3
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
    "https://api.p31ca.org/fhir/status" 2>/dev/null || echo "000")
  [ "$STATUS" = "200" ] && log "  Smoke test: 200 ✓" || warn "  Smoke test: $STATUS (may still propagate)"
fi

echo ""
echo -e "${GREEN}=== FHIR Worker deployed ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Authorize Epic:  open https://api.p31ca.org/fhir/auth"
echo "  2. Manual check:    curl -X POST https://api.p31ca.org/fhir/check \\"
echo "                        -H 'Authorization: Bearer \$P31_API_SECRET'"
echo "  3. Watch logs:      wrangler tail --env production"
echo "  4. HA webhooks test:"
echo "     curl -X POST https://home.p31ca.org/api/webhook/\$HA_WEBHOOK_CRITICAL"
