#!/usr/bin/env bash
# bounty-hunter.sh — Nuclei vulnerability scan
# Part of the P31 Money Stream mesh.
set -euo pipefail

LOG_FILE="logs/bounty-findings.json"
DRY_RUN=false
TARGET=""
MODE="fast"

usage() {
    echo "Usage: $0 --target <url|ip> [--mode fast|deep] [--dry-run]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --target) TARGET="$2"; shift 2 ;;
        --mode) MODE="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) usage ;;
    esac
done

[ -z "$TARGET" ] && usage

mkdir -p "$(dirname "$LOG_FILE")"

if [ "${SPOON_LEVEL:-0}" -lt 2 ]; then
    echo "{\"status\":\"skipped\",\"reason\":\"SPOON_LEVEL < 2\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

if [ "$DRY_RUN" = true ]; then
    echo "{\"status\":\"dry_run\",\"target\":\"$TARGET\",\"mode\":\"$MODE\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

if ! command -v nuclei &>/dev/null; then
    echo "{\"status\":\"error\",\"message\":\"nuclei not found\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 2
fi

severity="low,medium,high,critical"
[ "$MODE" = "deep" ] && severity="info,low,medium,high,critical"

TEMP_OUT=$(mktemp)
nuclei -u "$TARGET" -severity "$severity" -json -o "$TEMP_OUT" 2>/dev/null || {
    echo "{\"status\":\"error\",\"message\":\"nuclei execution failed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 1
}

jq -s '{status:"success",findings:.,count:(length),timestamp:"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' "$TEMP_OUT" > "$LOG_FILE"
rm -f "$TEMP_OUT"
exit 0