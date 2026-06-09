#!/usr/bin/env bash
# P31 Matrix — post-deploy verification script
# Run after deploy.sh to confirm all services are healthy.
# Usage: bash scripts/verify.sh [--domain matrix.p31ca.org] [--server-name p31ca.org]

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
PASS=0; WARN=0; FAIL=0

ok()   { echo -e "${GREEN}[PASS]${NC} $*"; ((PASS++)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; ((WARN++)); }
fail() { echo -e "${RED}[FAIL]${NC} $*"; ((FAIL++)); }

# Args
DOMAIN="${1:-matrix.p31ca.org}"
SERVER_NAME="${2:-p31ca.org}"

echo ""
echo "P31 Matrix Homeserver — Verification"
echo "  Domain:      ${DOMAIN}"
echo "  Server name: ${SERVER_NAME}"
echo "  Time:        $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# ── 1. Docker services ────────────────────────────────────────────────────
echo "── Docker services ──────────────────────────────────────"
SERVICES=(caddy postgres synapse bridge-gmessages bridge-whatsapp bridge-signal bridge-meta bridge-postmoogle)
for SVC in "${SERVICES[@]}"; do
  STATUS=$(docker compose ps --format json 2>/dev/null | python3 -c "
import sys,json
for line in sys.stdin:
  try:
    s = json.loads(line.strip())
    if s.get('Service') == '${SVC}':
      print(s.get('State','unknown'))
  except: pass
" 2>/dev/null || echo "unknown")

  if [ "$STATUS" = "running" ]; then
    ok "  $SVC: running"
  else
    fail "  $SVC: $STATUS"
  fi
done

# ── 2. Synapse HTTP health ────────────────────────────────────────────────
echo ""
echo "── Synapse API health ───────────────────────────────────"
VERSIONS_URL="https://${DOMAIN}/_matrix/client/versions"
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$VERSIONS_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  ok "  /_matrix/client/versions: 200"
else
  fail "  /_matrix/client/versions: $HTTP_CODE (expected 200)"
fi

HEALTH_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "https://${DOMAIN}/_matrix/client/r0/login" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HEALTH_CODE" = "200" ]; then
  ok "  Client API: reachable"
else
  warn "  Client API: may not be fully ready"
fi

# ── 3. Federation ─────────────────────────────────────────────────────────
echo ""
echo "── Federation ───────────────────────────────────────────"
FED_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "https://${DOMAIN}/_matrix/federation/v1/version" 2>/dev/null || echo "000")
if [ "$FED_CODE" = "200" ]; then
  ok "  Federation v1/version: 200"
else
  warn "  Federation v1/version: $FED_CODE (may need port 8448 open)"
fi

# ── 4. .well-known delegation (p31ca.org) ────────────────────────────────
echo ""
echo "── .well-known delegation ───────────────────────────────"
WK_SERVER=$(curl -sf "https://${SERVER_NAME}/.well-known/matrix/server" 2>/dev/null || echo "")
if echo "$WK_SERVER" | grep -q "matrix.p31ca.org"; then
  ok "  /.well-known/matrix/server: correct"
else
  fail "  /.well-known/matrix/server: missing or wrong (got: ${WK_SERVER:-none})"
fi

WK_CLIENT=$(curl -sf "https://${SERVER_NAME}/.well-known/matrix/client" 2>/dev/null || echo "")
if echo "$WK_CLIENT" | grep -q "matrix.p31ca.org"; then
  ok "  /.well-known/matrix/client: correct"
else
  fail "  /.well-known/matrix/client: missing or wrong"
fi

DID_DOC=$(curl -sf "https://${SERVER_NAME}/.well-known/did.json" 2>/dev/null || echo "")
if echo "$DID_DOC" | grep -q "did:web:p31ca.org"; then
  ok "  /.well-known/did.json: present"
else
  warn "  /.well-known/did.json: not yet deployed (deploy p31ca static site)"
fi

# ── 5. TLS ────────────────────────────────────────────────────────────────
echo ""
echo "── TLS certificate ──────────────────────────────────────"
TLS_EXPIRY=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null | \
  openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 || echo "")
if [ -n "$TLS_EXPIRY" ]; then
  ok "  TLS cert valid until: ${TLS_EXPIRY}"
else
  warn "  TLS: could not verify (may be self-signed or not yet issued)"
fi

# ── 6. Bridge health endpoints ────────────────────────────────────────────
echo ""
echo "── Bridge health (internal) ─────────────────────────────"
declare -A BRIDGE_PORTS=(
  [gmessages]=29336
  [whatsapp]=29318
  [signal]=29328
  [meta]=29319
  [postmoogle]=25252
)
for BRIDGE in "${!BRIDGE_PORTS[@]}"; do
  PORT="${BRIDGE_PORTS[$BRIDGE]}"
  STATUS=$(docker compose exec -T "bridge-${BRIDGE}" \
    wget -qO- "http://localhost:${PORT}/health" 2>/dev/null | head -c 50 || echo "unreachable")
  if [ "$STATUS" != "unreachable" ]; then
    ok "  bridge-${BRIDGE}: healthy"
  else
    warn "  bridge-${BRIDGE}: health endpoint unreachable (may need pairing)"
  fi
done

# ── 7. Postgres ───────────────────────────────────────────────────────────
echo ""
echo "── Database ─────────────────────────────────────────────"
if [ -f .env ]; then
  source .env 2>/dev/null || true
fi
DB_OK=$(docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-synapse}" 2>/dev/null || echo "")
if echo "$DB_OK" | grep -q "accepting connections"; then
  ok "  Postgres: accepting connections"
else
  fail "  Postgres: not ready"
fi

TABLE_COUNT=$(docker compose exec -T postgres \
  psql -U "${POSTGRES_USER:-synapse}" -d "${POSTGRES_DB:-synapse}" \
  -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | \
  tr -d ' \n' || echo "0")
if [ "${TABLE_COUNT:-0}" -gt 10 ] 2>/dev/null; then
  ok "  Synapse schema: ${TABLE_COUNT} tables initialized"
else
  warn "  Synapse schema: ${TABLE_COUNT:-0} tables (may not be fully initialized)"
fi

# ── 8. Admin user ─────────────────────────────────────────────────────────
echo ""
echo "── Operator account ─────────────────────────────────────"
WILL_EXISTS=$(docker compose exec -T postgres \
  psql -U "${POSTGRES_USER:-synapse}" -d "${POSTGRES_DB:-synapse}" \
  -t -c "SELECT count(*) FROM users WHERE name LIKE '%will%';" 2>/dev/null | \
  tr -d ' \n' || echo "0")
if [ "${WILL_EXISTS:-0}" -ge 1 ] 2>/dev/null; then
  ok "  @will account: exists"
else
  warn "  @will account: not found — run deploy.sh step 9 or create manually"
fi

# ── Summary ───────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo -e "  ${GREEN}PASS: ${PASS}${NC}  ${YELLOW}WARN: ${WARN}${NC}  ${RED}FAIL: ${FAIL}${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "Next steps:"
  echo "  1. Check failed services:  docker compose logs <service>"
  echo "  2. Deploy p31ca site:      wrangler pages deploy (for .well-known)"
  echo "  3. Add DNS A record:       ${DOMAIN} → VPS IP"
  echo "  4. Open port 8448:         ufw allow 8448/tcp"
  echo ""
  exit 1
else
  echo "Homeserver verified. Bridge pairing:"
  echo "  SMS:      Send '!gm link' to @gmessagesbot:${SERVER_NAME}"
  echo "  WhatsApp: Send '!wa login' to @whatsappbot:${SERVER_NAME}"
  echo "  Signal:   Send '!signal link' to @signalbot:${SERVER_NAME}"
  echo "  Meta:     Send '!meta login' to @metabot:${SERVER_NAME}"
  echo "  Email:    Gmail → forward to postmoogle.${SERVER_NAME} SMTP"
  echo ""
fi
