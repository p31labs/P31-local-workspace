#!/usr/bin/env bash
# sync-passport.sh — Idempotent cognitive-passport sync, gated by Red Board
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REDBOARD_GATE="${SCRIPT_DIR}/redboard-scram.sh"

PASSPORT_SRC="${HOME}/.p31/cognitive-passport/"
HEALTH_SRC="${HOME}/.p31/health.jsonl"
LOG_FILE="${HOME}/.p31/rca/sync-log.jsonl"
LOG_DIR="$(dirname "$LOG_FILE")"

DRY_RUN=false
TARGET="${P31_SYNC_TARGET:-${1:-}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    *) TARGET="$1"; shift ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 [--dry-run] <peer-host:path>"
  echo "   or: P31_SYNC_TARGET=peer:path $0 [--dry-run]"
  exit 2
fi

mkdir -p "$LOG_DIR"

timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
status="REFUSED"
files=""

if ! "$REDBOARD_GATE" check >/dev/null 2>&1; then
  echo "REFUSED — Red Board active, sync blocked to prevent state overwrite"
  echo "{\"ts\":\"${timestamp}\",\"status\":\"${status}\",\"target\":\"${TARGET}\",\"files\":[]}" >> "$LOG_FILE"
  exit 1
fi

rsync_flags=(-av --delete --exclude='redboard.lock' --exclude='redboard.log' --exclude='blocked_terminals.list' --exclude='*.tmp')
if $DRY_RUN; then
  rsync_flags+=(--dry-run)
fi

rsync "${rsync_flags[@]}" "${PASSPORT_SRC}" "${TARGET}/cognitive-passport/"
status="OK"
files="cognitive-passport/,health.jsonl"

rsync "${rsync_flags[@]}" "${HEALTH_SRC}" "${TARGET}/health.jsonl"

echo "{\"ts\":\"${timestamp}\",\"status\":\"${status}\",\"target\":\"${TARGET}\",\"files\":[\"${files}\"]}" >> "$LOG_FILE"
exit 0
