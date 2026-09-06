#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — p31-orchestrator (love-ledger + orchestrator)
# Usage: ./deploy.sh [--dry-run]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "=== DRY RUN MODE ==="
fi

echo "Deploying p31-orchestrator..."
cd "$PROJECT_DIR"

# Run tests before deploy
echo "Running test suite..."
npx vitest run --coverage

if [[ "$DRY_RUN" == true ]]; then
  echo "Would run: npx wrangler deploy"
else
  npx wrangler deploy
fi

echo "Post-deploy health check:"
echo "  curl <worker-endpoint>/health"
echo "Done."
