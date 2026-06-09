#!/usr/bin/env bash
# P31 — Worker Secrets Bootstrap
# Sets all Cloudflare Worker secrets for Phase 2 edge services.
# Reads from .env.master if present; prompts for any missing values.
# Run once per deployment environment.

set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"

G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m' R='\033[0;31m' N='\033[0m'
ok()   { echo -e "${G}  ✓${N} $1"; }
warn() { echo -e "${Y}  ⚠${N} $1"; }
die()  { echo -e "${R}  ✗${N} $1"; exit 1; }
hdr()  { echo -e "\n${C}── $1 ──────────────────────────────────${N}"; }

# ── Locate wrangler ──────────────────────────────────────────────────────────
WRANGLER="$(command -v wrangler 2>/dev/null || echo "")"
if [ -z "$WRANGLER" ]; then
  WRANGLER="$(cd "$REPO/software/p31ca" && npx --yes wrangler --version >/dev/null 2>&1 && echo "npx wrangler")"
  [ -n "$WRANGLER" ] || die "wrangler not found — npm install -g wrangler"
fi
ok "wrangler: $WRANGLER $(${WRANGLER} --version 2>/dev/null | head -1 || true)"

# ── Load .env.master ─────────────────────────────────────────────────────────
for f in "$REPO/.env.master" "$REPO/software/.env.master" "/home/p31/.env.master"; do
  if [ -f "$f" ]; then
    set -a; source "$f"; set +a
    ok "Loaded secrets from $f"
    break
  fi
done

# ── Helper: set one secret ────────────────────────────────────────────────────
set_secret() {
  local worker_dir="$1"
  local secret_name="$2"
  local env="${3:-production}"
  local val="${!secret_name:-}"

  if [ -z "$val" ] && [ -t 0 ] && [ -t 1 ]; then
    echo -ne "  ${Y}${secret_name}${N} (hidden): "
    read -rs val
    echo ""
  fi

  if [ -z "$val" ]; then
    warn "$secret_name not set — skipping (set manually: cd $worker_dir && ${WRANGLER} secret put $secret_name)"
    return
  fi

  (cd "$worker_dir" && echo "$val" | ${WRANGLER} secret put "$secret_name" --env "$env" 2>&1 \
    | grep -qE "Success|already|Updated" && ok "$secret_name → $worker_dir") \
    || warn "$secret_name set failed in $worker_dir"
}

# ── Helper: set secret with no env flag (legacy workers) ─────────────────────
set_secret_noenv() {
  local worker_dir="$1"
  local secret_name="$2"
  local val="${!secret_name:-}"

  if [ -z "$val" ] && [ -t 0 ] && [ -t 1 ]; then
    echo -ne "  ${Y}${secret_name}${N} (hidden): "
    read -rs val
    echo ""
  fi

  if [ -z "$val" ]; then
    warn "$secret_name not set — skipping"
    return
  fi

  (cd "$worker_dir" && echo "$val" | ${WRANGLER} secret put "$secret_name" 2>&1 \
    | grep -qE "Success|already|Updated" && ok "$secret_name → $worker_dir") \
    || warn "$secret_name set failed"
}

# ── Q-Factor Coherence Worker ─────────────────────────────────────────────────
hdr "Q-Factor (api.p31ca.org/qfactor/*)"
QF="$REPO/software/cloudflare-worker/q-factor"
set_secret "$QF" "P31_API_SECRET"   "" "production"
set_secret "$QF" "P31_FHIR_SECRET"  "" "production"

# ── FHIR Worker (api.p31ca.org/fhir/*) ───────────────────────────────────────
hdr "FHIR (api.p31ca.org/fhir/*)"
FHIR="$REPO/software/p31ca/workers/fhir"
if [ -d "$FHIR" ]; then
  # P31_FHIR_SECRET is the fhir-side name for the shared token
  local _fhir_secret="${P31_FHIR_SECRET:-}"
  [ -z "$_fhir_secret" ] && _fhir_secret="${P31_API_SECRET:-}"
  (cd "$FHIR" && echo "$_fhir_secret" | ${WRANGLER} secret put "P31_API_SECRET" --env production 2>&1 \
    | grep -qE "Success|already|Updated" && ok "P31_API_SECRET → fhir") || warn "P31_API_SECRET fhir failed"
  set_secret "$FHIR" "EPIC_CLIENT_ID"      "" "production"
  set_secret "$FHIR" "EPIC_CLIENT_SECRET"  "" "production"
  set_secret "$FHIR" "HA_WEBHOOK_CRITICAL" "" "production"
  set_secret "$FHIR" "HA_WEBHOOK_WARNING"  "" "production"
else
  warn "FHIR worker dir not found at $FHIR"
fi

# ── Command-Center ────────────────────────────────────────────────────────────
hdr "Command-Center"
CC="$REPO/software/cloudflare-worker/command-center"
set_secret_noenv "$CC" "P31_FHIR_SECRET"
set_secret_noenv "$CC" "STATUS_TOKEN"
set_secret_noenv "$CC" "CF_API_TOKEN"

# ── Edge Gate (Bouncer) ───────────────────────────────────────────────────────
hdr "Bouncer"
set_secret_noenv "$REPO/software/cloudflare-worker/bouncer" "BOUNCER_GATE_TOKEN"

# ── Genesis Gate ──────────────────────────────────────────────────────────────
hdr "Genesis Gate"
# .env.master stores as GENESIS_ADMIN_TOKEN; worker expects ADMIN_TOKEN
local _gat="${GENESIS_ADMIN_TOKEN:-}"
[ -n "$_gat" ] && (cd "$REPO/software/genesis-gate" && echo "$_gat" | ${WRANGLER} secret put "ADMIN_TOKEN" 2>&1 \
  | grep -qE "Success|already|Updated" && ok "ADMIN_TOKEN → genesis-gate") || warn "ADMIN_TOKEN genesis-gate skipped"

# ── K4 Cage ───────────────────────────────────────────────────────────────────
hdr "K4 Cage"
K4C="$REPO/software/k4-cage"
local _k4at="${K4_CAGE_ADMIN_TOKEN:-}"
local _k4ft="${K4_CAGE_FANOUT_TOKEN:-}"
[ -n "$_k4at" ] && (cd "$K4C" && echo "$_k4at" | ${WRANGLER} secret put "ADMIN_TOKEN" 2>&1 \
  | grep -qE "Success|already|Updated" && ok "ADMIN_TOKEN → k4-cage") || warn "ADMIN_TOKEN k4-cage skipped"
[ -n "$_k4ft" ] && (cd "$K4C" && echo "$_k4ft" | ${WRANGLER} secret put "INTERNAL_FANOUT_TOKEN" 2>&1 \
  | grep -qE "Success|already|Updated" && ok "INTERNAL_FANOUT_TOKEN → k4-cage") || warn "INTERNAL_FANOUT_TOKEN k4-cage skipped"

# ── K4 Hubs ───────────────────────────────────────────────────────────────────
hdr "K4 Hubs"
set_secret_noenv "$REPO/software/k4-hubs" "HUBS_WRITE_TOKEN"
set_secret_noenv "$REPO/software/k4-hubs" "HUB_LIVE_RELAY_SECRET"

# ── Agent Hub ─────────────────────────────────────────────────────────────────
hdr "Agent Hub"
set_secret_noenv "$REPO/software/p31-agent-hub" "AGENT_HUB_SECRET"
set_secret_noenv "$REPO/software/p31-agent-hub" "HUBS_WRITE_TOKEN"

# ── Kenosis Mesh ──────────────────────────────────────────────────────────────
hdr "Kenosis Mesh"
local _kat="${KENOSIS_AUTH_TOKEN:-}"
[ -n "$_kat" ] && (cd "$REPO/software/kenosis-mesh" && echo "$_kat" | ${WRANGLER} secret put "AUTH_TOKEN" 2>&1 \
  | grep -qE "Success|already|Updated" && ok "AUTH_TOKEN → kenosis-mesh (rotated)") || warn "AUTH_TOKEN kenosis-mesh skipped"
set_secret_noenv "$REPO/software/kenosis-mesh" "SIMPLEX_OPERATOR_SECRET"

# ── P31 Forge ─────────────────────────────────────────────────────────────────
hdr "P31 Forge"
FORGE="$REPO/software/p31-forge"
set_secret_noenv "$FORGE" "FORGE_API_KEY"
set_secret_noenv "$FORGE" "DISCORD_WEBHOOK_SECRET"
set_secret_noenv "$FORGE" "GITHUB_WEBHOOK_SECRET"
set_secret_noenv "$FORGE" "KOFI_SECRET"
set_secret_noenv "$FORGE" "DISCORD_WEBHOOK_URL"
set_secret_noenv "$FORGE" "BLUESKY_HANDLE"
set_secret_noenv "$FORGE" "BLUESKY_APP_PASSWORD"
set_secret_noenv "$FORGE" "MASTODON_INSTANCE"
set_secret_noenv "$FORGE" "MASTODON_ACCESS_TOKEN"
set_secret_noenv "$FORGE" "TWITTER_API_KEY"
set_secret_noenv "$FORGE" "TWITTER_API_SECRET"
set_secret_noenv "$FORGE" "TWITTER_ACCESS_TOKEN"
set_secret_noenv "$FORGE" "TWITTER_ACCESS_TOKEN_SECRET"
set_secret_noenv "$FORGE" "REDDIT_CLIENT_ID"
set_secret_noenv "$FORGE" "REDDIT_CLIENT_SECRET"
set_secret_noenv "$FORGE" "REDDIT_USERNAME"
set_secret_noenv "$FORGE" "REDDIT_PASSWORD"
set_secret_noenv "$FORGE" "NOSTR_PRIVATE_KEY"
set_secret_noenv "$FORGE" "DEVTO_API_KEY"
set_secret_noenv "$FORGE" "HASHNODE_TOKEN"
set_secret_noenv "$FORGE" "HASHNODE_PUBLICATION_ID"
set_secret_noenv "$FORGE" "ZENODO_TOKEN"

# ── Google Bridge ─────────────────────────────────────────────────────────────
hdr "Google Bridge"
set_secret "$REPO/software/p31-google-bridge" "GOOGLE_CLIENT_SECRET" "" "production"

# ── Donate API ────────────────────────────────────────────────────────────────
hdr "Donate API"
set_secret_noenv "$REPO/software/donate-api" "STRIPE_SECRET_KEY"
set_secret_noenv "$REPO/software/donate-api" "STRIPE_WEBHOOK_SECRET"
set_secret_noenv "$REPO/software/donate-api" "DISCORD_WEBHOOK_URL"

# ── Node Zero M2M ─────────────────────────────────────────────────────────────
hdr "Node Zero M2M"
NZM="$REPO/software/p31ca/workers/node-zero-m2m"
[ -d "$NZM" ] && set_secret_noenv "$NZM" "M2M_BEARER_TOKEN"

# ── K4 Agent Hub (home root packages/) ───────────────────────────────────────
hdr "K4 Agent Hub"
K4AH="/home/p31/packages/k4-agent-hub"
if [ -d "$K4AH" ] && [ -f "$K4AH/wrangler.toml" ]; then
  set_secret_noenv "$K4AH" "OPERATOR_PUBLIC_KEY"
fi

# ── Buffer Worker ─────────────────────────────────────────────────────────────
hdr "Buffer Worker"
for d in "$REPO/software/p31ca/workers/buffer" "$REPO/software/cloudflare-worker/buffer"; do
  if [ -d "$d" ] && [ -f "$d/wrangler.toml" ]; then
    set_secret_noenv "$d" "P31_API_SECRET"
    break
  fi
done

# ── Home Assistant MQTT bridge token ─────────────────────────────────────────
hdr "HA long-lived access token (for Meshtastic bridge)"
MQTT_CONF="$REPO/firmware/meshtastic/ha-mqtt-bridge.yaml"
if [ -f "$MQTT_CONF" ] && grep -q "REPLACE_HA_LONG_LIVED_TOKEN" "$MQTT_CONF"; then
  HA_TOKEN="${HA_LONG_LIVED_TOKEN:-}"
  if [ -z "$HA_TOKEN" ] && [ -t 0 ] && [ -t 1 ]; then
    echo -e "  ${Y}HA long-lived token${N} (Profile → Security → Long-Lived Access Tokens):"
    echo -ne "  Token (hidden): "
    read -rs HA_TOKEN
    echo ""
  fi
  if [ -n "$HA_TOKEN" ]; then
    sed -i.bak "s|REPLACE_HA_LONG_LIVED_TOKEN|$HA_TOKEN|" "$MQTT_CONF"
    rm -f "${MQTT_CONF}.bak"
    ok "HA token injected into ha-mqtt-bridge.yaml"
  else
    warn "HA token not set — bridge will fail to authenticate"
  fi
else
  ok "ha-mqtt-bridge.yaml already configured"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${G}═══ Secrets bootstrap complete ═══${N}"
echo ""
echo -e "  ${C}Still manual (requires physical device):${N}"
echo -e "  1. Epic FHIR auth:   https://api.p31ca.org/fhir/auth  (iPhone Safari)"
echo -e "  2. eSIM:             iPhone → Settings → Cellular → Add eSIM → US Mobile Warp"
echo -e "  3. Meshtastic flash: meshtastic --configure firmware/meshtastic/p31-mesh-config.yaml"
echo -e "  4. Matrix VPS:       bash scripts/provision-matrix-vps.sh  (needs HETZNER_API_TOKEN)"
echo ""
