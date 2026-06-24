#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — p31-telemetry-worker
# Usage: ./deploy.sh [--dry-run]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN MODE ==="
fi

echo "Deploying p31-telemetry-worker..."
cd "$PROJECT_DIR"

if [[ "$DRY_RUN" == true ]]; then
  echo "Would run: npx wrangler deploy"
else
  npx wrangler deploy
fi

echo "Post-deploy health check:"
echo "  curl https://p31-telemetry.trimtab-signal.workers.dev/health"
echo "Done."
