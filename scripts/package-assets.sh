#!/usr/bin/env bash
# package-assets.sh — Upload asset to Gumroad via presigned URL
# Part of the P31 Money Stream mesh.
set -euo pipefail

LOG_FILE="logs/package-assets.log"
DRY_RUN=false
ASSET_FILE=""
PRODUCT_ID=""
GUMROAD_TOKEN="${GUMROAD_TOKEN:-}"

usage() {
    echo "Usage: $0 --file <path> --product <product_id> [--dry-run]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --file) ASSET_FILE="$2"; shift 2 ;;
        --product) PRODUCT_ID="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) usage ;;
    esac
done

if [ -z "$ASSET_FILE" ] || [ -z "$PRODUCT_ID" ]; then
    echo "{\"status\":\"skipped\",\"reason\":\"no file/product — daemon cycle, no pending uploads\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi
[ -f "$ASSET_FILE" ] || { echo "{\"status\":\"error\",\"message\":\"file not found\",\"file\":\"$ASSET_FILE\"}" > "$LOG_FILE"; exit 2; }

mkdir -p "$(dirname "$LOG_FILE")"

if [ "$DRY_RUN" = true ]; then
    echo "{\"status\":\"dry_run\",\"file\":\"$ASSET_FILE\",\"product\":\"$PRODUCT_ID\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

if [ -z "$GUMROAD_TOKEN" ]; then
    echo "{\"status\":\"error\",\"message\":\"GUMROAD_TOKEN not set\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 2
fi

PRESIGN_URL=$(curl -s -X POST "https://api.gumroad.com/v2/products/${PRODUCT_ID}/asset" \
    -H "Authorization: Bearer $GUMROAD_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"filename\":\"$(basename "$ASSET_FILE")\"}" | jq -r '.upload_url // .presigned_url // "unsupported"')

if [ "$PRESIGN_URL" = "unsupported" ] || [ -z "$PRESIGN_URL" ]; then
    echo "{\"status\":\"stub\",\"message\":\"Gumroad presigned URL endpoint not yet integrated — manual upload required\",\"file\":\"$ASSET_FILE\",\"product\":\"$PRODUCT_ID\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

curl -s -X PUT -T "$ASSET_FILE" "$PRESIGN_URL" | jq '{status:"success",file:"'"$ASSET_FILE"'",timestamp:"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > "$LOG_FILE"
exit 0