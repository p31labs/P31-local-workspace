#!/usr/bin/env bash
# P31 Matrix Homeserver — one-command deploy
# Run as root on a fresh Ubuntu 24.04 VPS
# Usage: bash deploy.sh

set -euo pipefail
cd "$(dirname "$0")/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Prerequisites ────────────────────────────────────────────────────
log "[1/9] Checking prerequisites..."
command -v docker   >/dev/null 2>&1 || die "Docker not installed. Run: curl -fsSL https://get.docker.com | sh"
command -v openssl  >/dev/null 2>&1 || die "openssl not found"
command -v envsubst >/dev/null 2>&1 || apt-get install -y gettext-base -qq

# Load env
[ -f .env ] || die ".env not found — copy .env.example to .env and fill in values"
set -a; source .env; set +a

# Validate required vars
for VAR in SYNAPSE_SERVER_NAME DOMAIN LETSENCRYPT_EMAIL POSTGRES_PASSWORD \
           BRIDGE_GMESSAGES_AS_TOKEN BRIDGE_GMESSAGES_HS_TOKEN \
           BRIDGE_WHATSAPP_AS_TOKEN BRIDGE_WHATSAPP_HS_TOKEN \
           BRIDGE_SIGNAL_AS_TOKEN BRIDGE_SIGNAL_HS_TOKEN \
           BRIDGE_META_AS_TOKEN BRIDGE_META_HS_TOKEN \
           BRIDGE_POSTMOOGLE_AS_TOKEN BRIDGE_POSTMOOGLE_HS_TOKEN \
           POSTMOOGLE_GMAIL_APP_PASSWORD; do
  [[ "${!VAR}" == REPLACE_* ]] && die "$VAR is still set to placeholder value"
done

# ── Directories ──────────────────────────────────────────────────────
log "[2/9] Creating data directories..."
mkdir -p data/synapse/media_store data/synapse/bridges data/logs
chmod 700 data/

# ── Generate Synapse signing key ─────────────────────────────────────
log "[3/9] Generating Synapse signing key..."
if [ ! -f data/synapse/homeserver.signing.key ]; then
  docker run --rm \
    -v "$(pwd)/data/synapse:/data" \
    ghcr.io/element-hq/synapse:latest generate --server-name "$SYNAPSE_SERVER_NAME"
  log "  Signing key generated. BACK UP: data/synapse/homeserver.signing.key"
else
  warn "  Signing key already exists — skipping generation"
fi

# ── Substitute env vars into configs ────────────────────────────────
log "[4/9] Writing bridge registration files..."
for BRIDGE in gmessages whatsapp signal meta postmoogle; do
  TEMPLATE="bridges/${BRIDGE}/config.yaml"
  OUTPUT="bridges/${BRIDGE}/config.yaml.rendered"
  envsubst < "$TEMPLATE" > "$OUTPUT"
  mv "$OUTPUT" "bridges/${BRIDGE}/config.yaml"

  # Postmoogle: registration.yaml is static (pre-written with env vars) — just envsubst it
  if [ "${BRIDGE}" = "postmoogle" ]; then
    envsubst < "bridges/postmoogle/registration.yaml" > "bridges/postmoogle/registration.yaml.rendered"
    mv "bridges/postmoogle/registration.yaml.rendered" "bridges/postmoogle/registration.yaml"
    log "  postmoogle: registration.yaml substituted"
    continue
  fi

  # Generate bridge registration file (the appservice registration Synapse reads)
  if [ ! -f "bridges/${BRIDGE}/registration.yaml" ]; then
    docker run --rm \
      -v "$(pwd)/bridges/${BRIDGE}:/data" \
      "dock.mau.dev/mautrix/${BRIDGE}:latest" \
      --generate-registration 2>/dev/null || \
    # Fallback: write minimal registration manually
    cat > "bridges/${BRIDGE}/registration.yaml" <<YAML
id: ${BRIDGE}
url: http://bridge-${BRIDGE}:$(get_bridge_port $BRIDGE)
as_token: "${BRIDGE^^}_AS_TOKEN_placeholder"
hs_token: "${BRIDGE^^}_HS_TOKEN_placeholder"
sender_localpart: ${BRIDGE}bot
rate_limited: false
namespaces:
  users:
    - exclusive: true
      regex: '@${BRIDGE}_.*:${SYNAPSE_SERVER_NAME}'
  aliases: []
  rooms: []
YAML
    log "  ${BRIDGE}: registration.yaml written"
  fi
done

# ── Substitute postgres password into homeserver.yaml ────────────────
log "[5/9] Writing homeserver.yaml..."
envsubst '${POSTGRES_PASSWORD}' < config/homeserver.yaml > data/synapse/homeserver.yaml

# ── Copy log config ──────────────────────────────────────────────────
cp config/log.config data/synapse/log.config

# ── UFW firewall ─────────────────────────────────────────────────────
log "[6/9] Configuring firewall..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp comment "SSH"
  ufw allow 80/tcp comment "HTTP (ACME)"
  ufw allow 443/tcp comment "HTTPS"
  ufw allow 8448/tcp comment "Matrix federation"
  ufw --force enable
  log "  UFW rules applied"
fi

# ── Pull images ──────────────────────────────────────────────────────
log "[7/9] Pulling Docker images..."
docker compose pull

# ── Start services ───────────────────────────────────────────────────
log "[8/9] Starting services..."
docker compose up -d postgres
log "  Waiting for Postgres to be ready..."
sleep 5
docker compose up -d synapse
log "  Waiting for Synapse to initialise (30s)..."
sleep 30
docker compose up -d

# ── Create admin user ────────────────────────────────────────────────
log "[9/9] Creating operator admin account..."
if docker compose exec synapse register_new_matrix_user \
    -c /data/homeserver.yaml \
    -u will \
    -p "$(openssl rand -hex 16)" \
    -a \
    http://localhost:8008 2>/dev/null; then
  warn "  Admin user @will:${SYNAPSE_SERVER_NAME} created."
  warn "  Use Element to set a real password: /deactivate then re-register, or use:"
  warn "  docker compose exec synapse hash_password -c /data/homeserver.yaml"
else
  warn "  Could not auto-create admin user (may already exist)"
fi

echo ""
echo -e "${GREEN}=== P31 Matrix Homeserver LIVE ===${NC}"
echo "  Homeserver:  https://${DOMAIN}"
echo "  Federation:  @will:${SYNAPSE_SERVER_NAME}"
echo "  Status:      curl https://${DOMAIN}/_matrix/client/versions"
echo ""
echo "Next steps:"
echo "  1. Add DNS A record: ${DOMAIN} → $(curl -sf ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP')"
echo "  2. Add to p31ca.org: .well-known/matrix/server and client delegation"
echo "  3. Login in Element: https://app.element.io (server: matrix.p31ca.org)"
echo "  4. Start bridges:"
echo "     SMS:      docker compose exec bridge-gmessages /usr/bin/mautrix-gmessages --help"
echo "     WhatsApp: send '!wa login' in the bridge bot DM"
echo "     Signal:   send '!signal link' in the bridge bot DM"
echo "     Meta:     send '!meta login' in the bridge bot DM"
echo "  5. Schedule backups: crontab -e → 0 2 * * * $(pwd)/scripts/backup.sh"
