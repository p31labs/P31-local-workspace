#!/usr/bin/env bash
# log-rotator.sh — compress and archive logs older than 30 days.
# Usage: bash scripts/log-rotator.sh [--dry-run]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$REPO_ROOT/logs"
ARCHIVE_DIR="$LOG_DIR/archive"
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

mkdir -p "$ARCHIVE_DIR"

# Find .jsonl and .log files older than 30 days
find "$LOG_DIR" -maxdepth 1 -type f \( -name '*.jsonl' -o -name '*.log' \) -mtime +30 2>/dev/null | while read -r f; do
  basename_f=$(basename "$f")
  gz="$ARCHIVE_DIR/${basename_f}.gz"
  if [[ -f "$gz" ]]; then
    echo "  skip $basename_f (already archived)"
    continue
  fi
  size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo 0)
  echo "  archive $basename_f ($size bytes)"
  if ! $DRY_RUN; then
    gzip -c "$f" > "$gz"
    rm -f "$f"
  fi
done

# Also archive .p31/*.jsonl files
P31_LOG_DIR="$HOME/.p31"
if [[ -d "$P31_LOG_DIR" ]]; then
  find "$P31_LOG_DIR" -maxdepth 1 -type f -name '*.jsonl' -mtime +30 2>/dev/null | while read -r f; do
    basename_f=$(basename "$f")
    gz="$ARCHIVE_DIR/${basename_f}.gz"
    if [[ -f "$gz" ]]; then
      echo "  skip $basename_f (already archived)"
      continue
    fi
    size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo 0)
    echo "  archive $basename_f ($size bytes)"
    if ! $DRY_RUN; then
      gzip -c "$f" > "$gz"
      rm -f "$f"
    fi
  done
fi

echo "✅ Log rotation complete"
