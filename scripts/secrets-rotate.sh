#!/usr/bin/env bash
# secrets-rotate.sh — Set or rotate secrets across P31 Cloudflare Workers.
# Usage:
#   ./scripts/secrets-rotate.sh <worker> <SECRET_NAME> [--env production]
#   ./scripts/secrets-rotate.sh --list <worker> [--env production]
#   ./scripts/secrets-rotate.sh --rotate-all [--env production]
#
# Examples:
#   ./scripts/secrets-rotate.sh pilot-dashboard LOVE_AUTH_SECRET
#   ./scripts/secrets-rotate.sh ledger-bridge BRIDGE_PRIVATE_KEY --env production
#   ./scripts/secrets-rotate.sh --list pilot-dashboard
#   ./scripts/secrets-rotate.sh --rotate-all  # rotates LOVE_AUTH_SECRET on all workers that bind it
#
# Reads the new secret value from:
#   1. stdin (interactive prompt)
#   2. LOVE_AUTH_SECRET env var (if set)
#   3. .env file in repo root (key=value format)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

WORKERS_DIR="$(cd "$(dirname "$0")/../software/workers" && pwd)"

usage() {
  echo "Usage: $0 <worker> <SECRET_NAME> [--env <env>]"
  echo "       $0 --list <worker> [--env <env>]"
  echo "       $0 --rotate-all [--env <env>]"
  echo ""
  echo "Workers: $(ls "$WORKERS_DIR" | tr '\n' ' ')"
  exit 1
}

# ── Discover secrets for a worker from wrangler.toml ──────────────────────
list_secrets() {
  local worker="$1" env_flag="${2:-}"
  local toml="$WORKERS_DIR/$worker/wrangler.toml"
  if [[ ! -f "$toml" ]]; then
    echo -e "${RED}Worker '$worker' not found at $toml${NC}" >&2
    exit 1
  fi
  echo -e "${YELLOW}Secrets declared (via grep) for $worker:${NC}"
  grep -oP 'wrangler secret put \K\w+' "$toml" 2>/dev/null || true
  grep -oP '#\s*Set via:?\s*wrangler secret put \K\w+' "$toml" 2>/dev/null || true
  # Also check source code for secret references
  local src_dir="$WORKERS_DIR/$worker/src"
  if [[ -d "$src_dir" ]]; then
    echo -e "${YELLOW}Secrets referenced in source:${NC}"
    grep -rhoP 'env\.([A-Z_]{10,})' "$src_dir" 2>/dev/null | sort -u | sed 's/env\.//' || true
  fi
}

# ── Set a secret ──────────────────────────────────────────────────────────
set_secret() {
  local worker="$1" secret_name="$2" env_flag="$3"
  local value=""

  # Priority: env var > .env file > stdin
  if [[ -n "${!secret_name:-}" ]]; then
    value="${!secret_name}"
    echo -e "${GREEN}Using value from \$${secret_name}${NC}"
  elif [[ -f ".env" ]] && grep -q "^${secret_name}=" .env; then
    value=$(grep "^${secret_name}=" .env | head -1 | cut -d= -f2-)
    echo -e "${GREEN}Using value from .env${NC}"
  else
    echo -n "Enter value for $secret_name (will not echo): "
    read -rs value
    echo ""
    if [[ -z "$value" ]]; then
      echo -e "${RED}Empty value — aborting${NC}" >&2
      exit 1
    fi
  fi

  echo -e "${YELLOW}Setting $secret_name on $worker ${env_flag}...${NC}"
  echo "$value" | npx wrangler secret put "$secret_name" $env_flag --name "$worker" 2>&1
  echo -e "${GREEN}✓ $secret_name set on $worker${NC}"
}

# ── Main ──────────────────────────────────────────────────────────────────
if [[ $# -lt 1 ]]; then usage; fi

ENV_FLAG=""
if [[ "${3:-}" == "--env" && -n "${4:-}" ]]; then
  ENV_FLAG="--env $4"
fi

case "${1:-}" in
  --list)
    [[ $# -lt 2 ]] && usage
    list_secrets "$2" "$ENV_FLAG"
    ;;
  --rotate-all)
    echo -e "${YELLOW}Rotating LOVE_AUTH_SECRET across all workers...${NC}"
    for worker in "$WORKERS_DIR"/*/; do
      name=$(basename "$worker")
      if grep -q "LOVE_AUTH_SECRET" "$worker/src/"*.ts "$worker/wrangler.toml" 2>/dev/null; then
        set_secret "$name" "LOVE_AUTH_SECRET" "$ENV_FLAG"
      fi
    done
    echo -e "${GREEN}Done.${NC}"
    ;;
  *)
    [[ $# -lt 2 ]] && usage
    set_secret "$1" "$2" "$ENV_FLAG"
    ;;
esac
