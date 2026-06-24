#!/usr/bin/env bash
# p31-gumroad-deploy.sh — Deploy p31-gumroad-webhook Worker + D1 + Queue
# Part of the P31 Ephemeralization suite.
#
# Usage:
#   ./p31-gumroad-deploy.sh --create-db    # Create D1 database + schema
#   ./p31-gumroad-deploy.sh --create-queue # Create Queue
#   ./p31-gumroad-deploy.sh --deploy       # Deploy Worker
#   ./p31-gumroad-deploy.sh --all          # All of the above
#   ./p31-gumroad-deploy.sh --secrets      # Show required secrets (no values)
#
# Prerequisites:
#   - wrangler CLI authenticated (npx wrangler whoami)
#   - CLOUDFLARE_ACCOUNT_ID in env or .env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="${SCRIPT_DIR}/p31-gumroad-webhook"

cd "$WORKER_DIR"

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
if [[ -z "$ACCOUNT_ID" ]]; then
  echo "ERROR: Set CLOUDFLARE_ACCOUNT_ID or add to .env"
  exit 1
fi

cmd_database() {
  echo "Creating D1 database 'p31-revenue-db'..."
  npx wrangler d1 create p31-revenue-db --account-id "$ACCOUNT_ID" 2>/dev/null || echo "(may already exist)"
  echo ""
  echo "Applying schema..."
  npx wrangler d1 execute p31-revenue-db --remote --file=src/schema.sql 2>/dev/null || echo "(schema may already be applied)"
  echo ""
  echo "Get the database_id from the output above and paste it into wrangler.toml"
}

cmd_queue() {
  echo "Creating Queue 'p31-revenue'..."
  npx wrangler queues create p31-revenue --account-id "$ACCOUNT_ID" 2>/dev/null || echo "(may already exist)"
  echo ""
  echo "Get the queue_id and paste into wrangler.toml"
}

cmd_deploy() {
  echo "Deploying p31-gumroad-webhook..."
  npx wrangler deploy
  echo ""
  echo "Deployed. Set secrets:"
  echo "  wrangler secret put GUMROAD_WEBHOOK_SECRET"
  echo "  wrangler secret put DISCORD_WEBHOOK_URL"
  echo "  wrangler secret put GUMROAD_TOKEN"
  echo ""
  echo "Webhook endpoint: https://p31-gumroad-webhook.trimtab-signal.workers.dev"
}

cmd_secrets() {
  echo "Required secrets for p31-gumroad-webhook:"
  echo ""
  echo "  GUMROAD_WEBHOOK_SECRET  — HMAC secret for verifying Gumroad webhooks"
  echo "                            (found in Gumroad settings > Advanced > Webhooks)"
  echo "  DISCORD_WEBHOOK_URL     — Discord webhook for sale notifications"
  echo "  GUMROAD_TOKEN           — Gumroad API token (for product/asset management)"
  echo "                            (found in Gumroad settings > Advanced > API)"
  echo ""
  echo "Optional:"
  echo "  GENESIS_GATE_URL        — Genesis Gate event endpoint"
  echo ""
  echo "Set with: wrangler secret put <NAME> (run from ${WORKER_DIR})"
}

case "${1:-}" in
  --create-db)   cmd_database ;;
  --create-queue) cmd_queue ;;
  --deploy)      cmd_deploy ;;
  --secrets)     cmd_secrets ;;
  --all)
    cmd_database
    echo ""
    cmd_queue
    echo ""
    cmd_deploy
    ;;
  *)
    echo "Usage: $0 [--create-db] [--create-queue] [--deploy] [--secrets] [--all]"
    exit 1
    ;;
esac
