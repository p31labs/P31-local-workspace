#!/usr/bin/env bash
set -euo pipefail

WRANGLER="${WRANGLER:-npx wrangler}"
R2_BUCKET="${R2_BUCKET:-jitterbug-deliverables}"

log() { echo "[r2-lifecycle] $1"; }

log "Configuring 30-day auto-delete lifecycle for R2 bucket: $R2_BUCKET"

cat > /tmp/r2-lifecycle.json <<'EOF'
{
  "rules": [
    {
      "id": "auto-delete-after-30-days",
      "status": "Enabled",
      "expiration": {
        "days": 30
      },
      "filter": {
        "prefix": ""
      }
    }
  ]
}
EOF

$WRANGLER r2 bucket lifecycle set "$R2_BUCKET" --rules /tmp/r2-lifecycle.json

log "Lifecycle rule applied. Deliverables older than 30 days will be automatically deleted."
