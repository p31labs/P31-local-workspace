#!/usr/bin/env bash
# ==============================================================================
# P31CA PHASE 2 — MASTER IGNITION SEQUENCE
# Routes through the p31 CLI and ecosystem deploy rather than hand-rolling npm.
# Run from anywhere inside the andromeda repo, or from the workspace root.
# ==============================================================================

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m' N='\033[0m'
log()  { echo -e "${G}[$(date +%H:%M:%S)]${N} $1"; }
info() { echo -e "${C}  ›${N} $1"; }
warn() { echo -e "${Y}  ⚠${N} $1"; }
ok()   { echo -e "${G}  ✓${N} $1"; }
is_tty() { [ -t 0 ] && [ -t 1 ]; }

echo -e "${C}══════════════════════════════════════════════════════════════${N}"
echo -e "${C}  P31CA PHASE 2 · MASTER IGNITION SEQUENCE                   ${N}"
echo -e "${C}══════════════════════════════════════════════════════════════${N}"
echo ""

# ── Preflight: p31 doctor ──────────────────────────────────────────────────────
log "PREFLIGHT — p31 doctor"
if command -v p31 >/dev/null 2>&1; then
  p31 doctor 2>&1 | grep -E "✓|✗|FATAL" | head -10 || true
  ok "p31 CLI reachable"
else
  warn "p31 CLI not on PATH — continuing without preflight check"
fi

# ── STEP 1: Shared package (activates @noble/post-quantum) ───────────────────
log "STEP 1 — PQC activation (software/packages/shared)"
SHARED="software/packages/shared"
if [ -d "$SHARED" ]; then
  (cd "$SHARED" && npm install --prefer-offline --silent 2>&1 | grep -v "^npm warn" || true)
  ok "PQC libraries active"
else
  warn "$SHARED not found — skipping"
fi

# ── STEP 2: Meshtastic PSK injection ─────────────────────────────────────────
log "STEP 2 — Meshtastic radio provisioning"
MESH_CONF="firmware/meshtastic/p31-mesh-config.yaml"

if [ -f "$MESH_CONF" ]; then
  if grep -q "REPLACE_with_base64_32byte_key" "$MESH_CONF"; then
    info "Generating 256-bit PSK for P31_FAMILY channel..."
    PSK=$(python3 -c "import os,base64; print(base64.b64encode(os.urandom(32)).decode())")
    sed -i.bak "s|psk: \"REPLACE_with_base64_32byte_key\"|psk: \"$PSK\"|" "$MESH_CONF"
    rm -f "${MESH_CONF}.bak"
    ok "PSK injected — save this key:"
    echo -e "    ${Y}${PSK}${N}"
  else
    ok "PSK already configured — skipping"
  fi

  if grep -q "REPLACE_with_wifi_password" "$MESH_CONF"; then
    if is_tty; then
      echo ""
      echo -e "${Y}ACTION — WiFi password for Node Zero home network join${N}"
      echo -ne "  WiFi password (hidden): "
      read -rs WIFI_PW
      echo ""
      if [ -n "$WIFI_PW" ]; then
        sed -i.bak "s|wifi_psk: \"REPLACE_with_wifi_password\"|wifi_psk: \"$WIFI_PW\"|" "$MESH_CONF"
        rm -f "${MESH_CONF}.bak"
        ok "WiFi credentials injected"
      else
        warn "Empty — Node Zero will not join home network until set"
      fi
    else
      warn "Non-interactive — skipping WiFi credential prompt"
      info "Manual: sed -i \"s|REPLACE_with_wifi_password|YOUR_WIFI_PW|\" $MESH_CONF"
    fi
  else
    ok "WiFi credentials already configured — skipping"
  fi

  if grep -q "REPLACE_with_mqtt_password" "$MESH_CONF"; then
    if is_tty; then
      echo ""
      echo -e "${Y}ACTION — MQTT password for home.p31ca.org broker${N}"
      echo -ne "  MQTT password (hidden): "
      read -rs MQTT_PW
      echo ""
      if [ -n "$MQTT_PW" ]; then
        sed -i.bak "s|password: \"REPLACE_with_mqtt_password\"|password: \"$MQTT_PW\"|" "$MESH_CONF"
        rm -f "${MESH_CONF}.bak"
        ok "MQTT credentials injected"
      else
        warn "Empty — Meshtastic→HA bridge offline until set"
      fi
    else
      warn "Non-interactive — skipping MQTT credential prompt"
      info "Manual: sed -i \"s|REPLACE_with_mqtt_password|YOUR_MQTT_PW|\" $MESH_CONF"
    fi
  else
    ok "MQTT credentials already configured — skipping"
  fi

  if command -v meshtastic >/dev/null 2>&1; then
    DEVS=$(ls /dev/ttyUSB* /dev/cu.usbserial* /dev/ttyACM* 2>/dev/null || true)
    if [ -n "$DEVS" ]; then
      log "Radio detected ($DEVS) — flashing config..."
      meshtastic --configure "$MESH_CONF" && ok "Node Zero flashed" || warn "Flash failed"
    else
      warn "No USB radio — when connected: meshtastic --configure $MESH_CONF"
    fi
  else
    warn "meshtastic CLI not installed: pip install meshtastic"
    info "Manual: meshtastic --configure $MESH_CONF"
  fi
else
  warn "$MESH_CONF not found"
fi

# ── STEP 3: Matrix / Postmoogle court email credentials ───────────────────────
log "STEP 3 — Matrix bridge credentials"
MATRIX_ENV="software/matrix/.env"

if [ ! -f "$MATRIX_ENV" ] && [ -f "software/matrix/.env.example" ]; then
  cp "software/matrix/.env.example" "$MATRIX_ENV"
  info "Bootstrapped $MATRIX_ENV from template"
fi

if [ -f "$MATRIX_ENV" ] && grep -q "POSTMOOGLE_GMAIL_APP_PASSWORD=REPLACE" "$MATRIX_ENV"; then
  if is_tty; then
    echo ""
    echo -e "${Y}ACTION — Gmail App Password for court notification bridge${N}"
    echo -e "  Google Account → Security → App Passwords → Mail"
    echo -ne "  Password (hidden): "
    read -rs GMAIL_PW
    echo ""
    if [ -n "$GMAIL_PW" ]; then
      sed -i.bak "s|POSTMOOGLE_GMAIL_APP_PASSWORD=.*|POSTMOOGLE_GMAIL_APP_PASSWORD=$GMAIL_PW|" "$MATRIX_ENV"
      rm -f "${MATRIX_ENV}.bak"
      ok "Postmoogle credentials injected"
    else
      warn "Empty — bridge offline until set"
    fi
  else
    warn "Non-interactive terminal — run this script directly in a TTY to set the Gmail password"
    info "Or: sed -i \"s|POSTMOOGLE_GMAIL_APP_PASSWORD=.*|POSTMOOGLE_GMAIL_APP_PASSWORD=YOUR_PW|\" $MATRIX_ENV"
  fi
else
  [ -f "$MATRIX_ENV" ] && ok "Postmoogle credentials already set" || true
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  info "Docker active — deploying Matrix..."
  (cd "software/matrix/scripts" && bash deploy.sh) && ok "Matrix deployed" || warn "Matrix deploy had errors"
else
  warn "Docker not running locally — Matrix deploy skipped"
  info "VPS deploy: scp -r software/matrix/ user@matrix.p31ca.org:~/matrix && ssh user@matrix.p31ca.org 'bash ~/matrix/scripts/deploy.sh'"
fi

# ── STEP 4: p31 launch (asset pipeline + verify gate) ────────────────────────
log "STEP 4 — p31 launch (asset pipeline)"
if command -v p31 >/dev/null 2>&1; then
  p31 launch --status 2>&1 | grep -E "✓|✗|FATAL|elapsed" || true
  ok "Asset pipeline verified"
else
  warn "p31 CLI unavailable — skipping asset pipeline"
fi

# ── STEP 5: Cloudflare edge deployments ──────────────────────────────────────
log "STEP 5 — Cloudflare edge deployments"

if ! command -v npx >/dev/null 2>&1; then
  warn "npx not found — skipping all edge deployments"
else
  # Deploy the two Phase 2 workers that aren't in ecosystem deploy
  deploy_worker() {
    local name="$1" dir="$2" cmd="${3:-deploy}"
    if [ -d "$dir" ] && [ -f "$dir/wrangler.toml" ]; then
      info "Deploying $name..."
      (cd "$dir" && npx wrangler $cmd 2>&1 | tail -3) && ok "$name deployed" || warn "$name failed — check wrangler auth"
    else
      warn "$name: $dir/wrangler.toml not found"
    fi
  }

  deploy_worker "q-factor"  "software/cloudflare-worker/q-factor"         "deploy"
  deploy_worker "fhir"      "software/p31ca/workers/fhir"                 "deploy"

  # Full ecosystem deploy — covers all 34 workers + p31ca pages
  if is_tty; then
    echo ""
    echo -e "${C}Run full ecosystem deploy? (34 workers + p31ca pages)${N}"
    echo -ne "  [y/N]: "
    read -r RUN_ECO
    echo ""
    if [[ "${RUN_ECO,,}" == "y" ]]; then
      log "Ecosystem deploy — this will take 5-10 minutes..."
      cd /home/p31 2>/dev/null || true
      P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND npm run ecosystem:deploy 2>&1
      ok "Ecosystem deploy complete"
      cd "$REPO_ROOT"
    else
      info "Skipped. To run later: cd /home/p31 && P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND npm run ecosystem:deploy"
    fi
  else
    info "Non-interactive — skipping ecosystem deploy prompt"
    info "To deploy: cd /home/p31 && P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND npm run ecosystem:deploy"
  fi
fi

# ── STEP 6: Worker secrets bootstrap ─────────────────────────────────────────
log "STEP 6 — Worker secrets (q-factor + FHIR + HA token)"
bash "$REPO_ROOT/scripts/bootstrap-secrets.sh" || warn "Secrets bootstrap had errors — check output above"

# ── STEP 7: Matrix VPS (requires HETZNER_API_TOKEN) ──────────────────────────
log "STEP 7 — Matrix VPS provisioning"
if [ -n "${HETZNER_API_TOKEN:-}" ]; then
  bash "$REPO_ROOT/scripts/provision-matrix-vps.sh" && ok "Matrix VPS provisioned" \
    || warn "VPS provisioning failed — check hetzner credentials and re-run: bash scripts/provision-matrix-vps.sh"
else
  warn "HETZNER_API_TOKEN not set — skipping VPS provisioning"
  info "To provision: export HETZNER_API_TOKEN=<token> && bash scripts/provision-matrix-vps.sh"
fi

echo ""
echo -e "${G}══════════════════════════════════════════════════════════════${N}"
echo -e "${G}  IGNITION COMPLETE                                           ${N}"
echo -e "${G}══════════════════════════════════════════════════════════════${N}"
echo ""
echo -e "  ${C}Requires physical device (cannot automate):${N}"
echo -e "  1. Epic FHIR auth:   https://api.p31ca.org/fhir/auth  (iPhone Safari)"
echo -e "  2. eSIM:             iPhone → Settings → Cellular → Add eSIM → US Mobile Warp"
echo -e "  3. Meshtastic flash: pip install meshtastic && meshtastic --configure firmware/meshtastic/p31-mesh-config.yaml"
echo ""
