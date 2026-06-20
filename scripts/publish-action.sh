#!/usr/bin/env bash
# publish-action.sh — GitHub release creation + asset upload
# Part of the P31 Money Stream mesh.
set -euo pipefail

LOG_FILE="logs/action-publish.log"
DRY_RUN=false
TAG=""
ASSETS=()
RELEASE_NOTES=""

usage() {
    echo "Usage: $0 --tag <version> [--assets file1,file2,...] [--notes <text>] [--dry-run]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --tag) TAG="$2"; shift 2 ;;
        --assets) IFS=',' read -r -a ASSETS <<< "$2"; shift 2 ;;
        --notes) RELEASE_NOTES="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) usage ;;
    esac
done

[ -z "$TAG" ] && usage

mkdir -p "$(dirname "$LOG_FILE")"

if [ "$DRY_RUN" = true ]; then
    ASSETS_JSON=$(printf '%s\n' "${ASSETS[@]}" | jq -R . | jq -s . 2>/dev/null || echo '[]')
    echo "{\"status\":\"dry_run\",\"tag\":\"$TAG\",\"assets\":$ASSETS_JSON,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

if ! command -v gh &>/dev/null; then
    echo "{\"status\":\"error\",\"message\":\"gh CLI not installed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 2
fi

NOTES="${RELEASE_NOTES:-Release $TAG}"
RELEASE_URL=$(gh release create "$TAG" --notes "$NOTES" --title "$TAG" 2>&1) || {
    echo "{\"status\":\"error\",\"message\":\"$RELEASE_URL\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 1
}

for asset in "${ASSETS[@]}"; do
    if [ -f "$asset" ]; then
        gh release upload "$TAG" "$asset" --clobber 2>/dev/null || echo "Warning: failed to upload $asset" >&2
    fi
done

echo "{\"status\":\"success\",\"tag\":\"$TAG\",\"release_url\":\"$RELEASE_URL\",\"asset_count\":${#ASSETS[@]},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
exit 0