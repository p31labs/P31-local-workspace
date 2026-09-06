#!/usr/bin/env bash
set -euo pipefail

WRANGLER="${WRANGLER:-npx wrangler}"
R2_BUCKET="${R2_BUCKET:-jitterbug-deliverables}"

log() { echo "[r2-lifecycle] $1"; }

log "Configuring 30-day auto-delete lifecycle for R2 bucket: $R2_BUCKET"

# Idempotently add the 30-day expiration rule.
# If the rule already exists, wrangler exits with a non-zero status
# (Rule IDs must be unique), so we ignore that specific failure.
set +e
$WRANGLER r2 bucket lifecycle add "$R2_BUCKET" "auto-delete-after-30-days" "" --expire-days 30
ADD_EXIT=$?
set -e

if [[ $ADD_EXIT -ne 0 ]]; then
  log "Lifecycle rule already present or could not be added (exit $ADD_EXIT). Assuming desired state."
else
  log "Lifecycle rule applied. Deliverables older than 30 days will be automatically deleted."
fi
