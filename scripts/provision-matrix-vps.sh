#!/usr/bin/env bash
# P31 — Hetzner VPS Provisioner for Matrix Homeserver
# Creates a CX22 (2 vCPU, 4 GB RAM, 40 GB SSD) Ubuntu 24.04 VPS,
# waits for boot, copies the matrix/ directory, and kicks off deploy.sh.
#
# Requires: HETZNER_API_TOKEN in environment or .env.master
# Cost: ~$4.15/mo (Hetzner CX22, Falkenstein)

set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"

G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m' R='\033[0;31m' N='\033[0m'
ok()   { echo -e "${G}  ✓${N} $1"; }
warn() { echo -e "${Y}  ⚠${N} $1"; }
die()  { echo -e "${R}  ✗${N} $*"; exit 1; }
hdr()  { echo -e "\n${C}── $1 ──────────────────────────────────${N}"; }

# ── Load secrets ─────────────────────────────────────────────────────────────
for f in "$REPO/.env.master" "$REPO/software/.env.master" "/home/p31/.env.master"; do
  [ -f "$f" ] && { set -a; source "$f"; set +a; ok "Loaded $f"; break; }
done

HETZNER_API_TOKEN="${HETZNER_API_TOKEN:-}"
[ -n "$HETZNER_API_TOKEN" ] || die "HETZNER_API_TOKEN not set — add to .env.master or export before running"

SSH_KEY_NAME="${HETZNER_SSH_KEY_NAME:-p31-matrix}"
SERVER_NAME="matrix-p31"
SERVER_TYPE="cx22"          # 2 vCPU / 4 GB / 40 GB — sufficient for Synapse + 5 bridges
LOCATION="ash"              # Ashburn VA — low latency to I-95 corridor
IMAGE="ubuntu-24.04"
MATRIX_DIR="$REPO/software/matrix"
DOMAIN="matrix.p31ca.org"

hetzner() { curl -sSf -H "Authorization: Bearer $HETZNER_API_TOKEN" \
                      -H "Content-Type: application/json" "$@"; }

# ── Step 1: Ensure SSH key is registered ──────────────────────────────────────
hdr "Step 1: SSH key"
KEY_ID=$(hetzner "https://api.hetzner.cloud/v1/ssh_keys" \
  | python3 -c "import sys,json; ks=json.load(sys.stdin)['ssh_keys']; \
    k=next((x for x in ks if x['name']=='$SSH_KEY_NAME'),None); \
    print(k['id'] if k else '')" 2>/dev/null || echo "")

if [ -z "$KEY_ID" ]; then
  # Generate key if none exists locally
  KEY_PATH="$HOME/.ssh/p31_matrix_ed25519"
  if [ ! -f "$KEY_PATH" ]; then
    ssh-keygen -t ed25519 -C "p31-matrix-$(date +%Y%m%d)" -f "$KEY_PATH" -N ""
    ok "Generated $KEY_PATH"
  fi
  PUB=$(cat "${KEY_PATH}.pub")
  KEY_ID=$(hetzner -X POST "https://api.hetzner.cloud/v1/ssh_keys" \
    -d "{\"name\":\"$SSH_KEY_NAME\",\"public_key\":\"$PUB\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['ssh_key']['id'])")
  ok "Registered SSH key (id=$KEY_ID)"
else
  ok "SSH key already registered (id=$KEY_ID)"
fi

# ── Step 2: Create server ─────────────────────────────────────────────────────
hdr "Step 2: Create server ($SERVER_TYPE / $LOCATION)"
EXISTING_IP=$(hetzner "https://api.hetzner.cloud/v1/servers?name=$SERVER_NAME" \
  | python3 -c "import sys,json; ss=json.load(sys.stdin)['servers']; \
    print(ss[0]['public_net']['ipv4']['ip'] if ss else '')" 2>/dev/null || echo "")

if [ -n "$EXISTING_IP" ]; then
  warn "Server $SERVER_NAME already exists at $EXISTING_IP"
  SERVER_IP="$EXISTING_IP"
else
  CLOUD_INIT=$(cat <<CLOUDINIT
#cloud-config
package_update: true
package_upgrade: true
packages:
  - docker.io
  - docker-compose-v2
  - curl
  - openssl
  - gettext-base
  - fail2ban
  - ufw
runcmd:
  - systemctl enable docker
  - systemctl start docker
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw allow 8448/tcp
  - ufw --force enable
  - mkdir -p /opt/matrix
CLOUDINIT
)
  CLOUD_INIT_ESCAPED=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" <<< "$CLOUD_INIT")

  RESPONSE=$(hetzner -X POST "https://api.hetzner.cloud/v1/servers" -d "{
    \"name\": \"$SERVER_NAME\",
    \"server_type\": \"$SERVER_TYPE\",
    \"location\": \"$LOCATION\",
    \"image\": \"$IMAGE\",
    \"ssh_keys\": [$KEY_ID],
    \"user_data\": $CLOUD_INIT_ESCAPED,
    \"labels\": {\"project\": \"p31\", \"role\": \"matrix\"}
  }")

  SERVER_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['server']['id'])" 2>/dev/null || die "Failed to create server: $RESPONSE")
  SERVER_IP=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['server']['public_net']['ipv4']['ip'])")
  ok "Server created: id=$SERVER_ID ip=$SERVER_IP"
fi

# ── Step 3: Wait for SSH ──────────────────────────────────────────────────────
hdr "Step 3: Wait for SSH ($SERVER_IP)"
MAX_WAIT=120
WAITED=0
while ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@"$SERVER_IP" echo ok >/dev/null 2>&1; do
  echo -ne "  waiting... ${WAITED}s\r"
  sleep 10
  WAITED=$((WAITED + 10))
  [ $WAITED -ge $MAX_WAIT ] && die "SSH timeout after ${MAX_WAIT}s — server may still be booting; re-run when ready"
done
ok "SSH reachable at $SERVER_IP"

# ── Step 4: Generate .env if REPLACE tokens remain ────────────────────────────
hdr "Step 4: Matrix .env"
ENV_FILE="$MATRIX_DIR/.env"
[ -f "$ENV_FILE" ] || cp "$MATRIX_DIR/.env.example" "$ENV_FILE"

if grep -q "REPLACE_generate" "$ENV_FILE" 2>/dev/null; then
  for VAR in POSTGRES_PASSWORD BRIDGE_GMESSAGES_AS_TOKEN BRIDGE_GMESSAGES_HS_TOKEN \
             BRIDGE_WHATSAPP_AS_TOKEN BRIDGE_WHATSAPP_HS_TOKEN \
             BRIDGE_SIGNAL_AS_TOKEN BRIDGE_SIGNAL_HS_TOKEN \
             BRIDGE_META_AS_TOKEN BRIDGE_META_HS_TOKEN \
             BRIDGE_POSTMOOGLE_AS_TOKEN BRIDGE_POSTMOOGLE_HS_TOKEN; do
    VAL=$(openssl rand -hex 32)
    sed -i.bak "s|${VAR}=REPLACE_generate_with_openssl_rand_hex_32|${VAR}=${VAL}|" "$ENV_FILE"
  done
  rm -f "${ENV_FILE}.bak"
  ok "Generated random secrets in .env"
fi

# Fill B2 credentials from environment if available
for VAR in B2_APPLICATION_KEY_ID B2_APPLICATION_KEY; do
  VAL="${!VAR:-}"
  if [ -n "$VAL" ] && grep -q "REPLACE_from_backblaze" "$ENV_FILE"; then
    sed -i.bak "s|${VAR}=REPLACE_from_backblaze_dashboard|${VAR}=${VAL}|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
    ok "Injected $VAR"
  fi
done

if grep -q "REPLACE" "$ENV_FILE" 2>/dev/null; then
  warn ".env still has REPLACE tokens — check B2 credentials and Postmoogle Gmail app password"
  warn "Manual: edit $ENV_FILE then re-run this script from Step 4 onward"
fi

# ── Step 5: Copy matrix dir to VPS ───────────────────────────────────────────
hdr "Step 5: Copy files → $SERVER_IP:/opt/matrix"
rsync -az --exclude data/ --exclude ".env" "$MATRIX_DIR/" root@"$SERVER_IP":/opt/matrix/
scp "$ENV_FILE" root@"$SERVER_IP":/opt/matrix/.env
ok "Files synced"

# ── Step 6: Deploy on VPS ────────────────────────────────────────────────────
hdr "Step 6: Deploy on VPS"
ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" 'bash /opt/matrix/scripts/deploy.sh'
ok "Matrix deployed"

# ── Step 7: Update DNS ───────────────────────────────────────────────────────
hdr "Step 7: DNS"
CF_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-}}"
CF_ZONE_ID="${CF_ZONE_ID:-}"

if [ -n "$CF_TOKEN" ] && [ -n "$CF_ZONE_ID" ]; then
  # Upsert A record for matrix.p31ca.org
  REC_ID=$(curl -sSf -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=A&name=$DOMAIN" \
    -H "Authorization: Bearer $CF_TOKEN" \
    | python3 -c "import sys,json; rs=json.load(sys.stdin)['result']; print(rs[0]['id'] if rs else '')" 2>/dev/null || echo "")

  if [ -n "$REC_ID" ]; then
    curl -sSf -X PUT "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$REC_ID" \
      -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
      -d "{\"type\":\"A\",\"name\":\"$DOMAIN\",\"content\":\"$SERVER_IP\",\"proxied\":false}" | python3 -c "import sys,json; r=json.load(sys.stdin); print('Updated' if r['success'] else r)" 2>/dev/null
  else
    curl -sSf -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
      -d "{\"type\":\"A\",\"name\":\"$DOMAIN\",\"content\":\"$SERVER_IP\",\"proxied\":false}" | python3 -c "import sys,json; r=json.load(sys.stdin); print('Created' if r['success'] else r)" 2>/dev/null
  fi
  ok "DNS: $DOMAIN → $SERVER_IP (orange-cloud off; Matrix federation needs direct IP)"
else
  warn "Cloudflare credentials not found — set DNS manually:"
  warn "  A  matrix.p31ca.org  →  $SERVER_IP  (proxied: false)"
  warn "  SRV  _matrix._tcp.p31ca.org  →  matrix.p31ca.org  port 8448"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}═══ VPS provisioning complete ═══${N}"
echo ""
echo -e "  Server:   root@${C}$SERVER_IP${N}"
echo -e "  Domain:   ${C}$DOMAIN${N}  (verify TLS with: curl https://$DOMAIN/_matrix/client/versions)"
echo -e "  Synapse:  https://$DOMAIN  (register @will:p31ca.org from Element)"
echo ""
echo -e "  ${Y}Next:${N}"
echo -e "  1. Register user: ssh root@$SERVER_IP docker exec -it matrix-synapse register_new_matrix_user -u will -p <password> -a http://localhost:8008"
echo -e "  2. Postmoogle:    set POSTMOOGLE_GMAIL_APP_PASSWORD in /opt/matrix/.env, then docker compose restart postmoogle"
echo -e "  3. Signal bridge: docker exec matrix-signal-bridge register"
echo ""
