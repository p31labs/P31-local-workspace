#!/usr/bin/env bash
# p31-money-streams.sh — Unified Money Stream Launcher
# Replaces yardmaster's per-script cron entries with a single loop.
# Reads config from .p31/config.yaml (if python3 + pyyaml available) or falls back to defaults.
#
# Usage:
#   ./p31-money-streams.sh              # Run all streams once
#   ./p31-money-streams.sh --stream bounty-hunter   # Run single stream
#   ./p31-money-streams.sh --dry-run   # Log what would run, don't execute
#   ./p31-money-streams.sh --daemon    # Loop forever at configured intervals
#
# Part of the P31 Yardmaster Continuous Shipyard Protocol.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${P31_REPO_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
LOG_DIR="${REPO_ROOT}/logs"

# ── Stream definitions (mirrors .p31/config.yaml money_streams) ────────
declare -A STREAM_SCRIPT=(
  ["bounty-hunter"]="${REPO_ROOT}/scripts/bounty-hunter.sh"
  ["package-assets"]="${REPO_ROOT}/scripts/package-assets.sh"
  ["audit-crawler"]="${REPO_ROOT}/scripts/audit-crawler.sh"
  ["publish-action"]="${REPO_ROOT}/scripts/publish-action.sh"
  ["post-sponsorships"]="${REPO_ROOT}/scripts/post-sponsorships.sh"
)

declare -A STREAM_INTERVAL=(
  ["bounty-hunter"]="7200"
  ["package-assets"]="3600"
  ["audit-crawler"]="3600"
  ["publish-action"]="3600"
  ["post-sponsorships"]="7200"
)

declare -A STREAM_LOG=(
  ["bounty-hunter"]="${LOG_DIR}/bounty-findings.json"
  ["package-assets"]="${LOG_DIR}/package-assets.log"
  ["audit-crawler"]="${LOG_DIR}/audit-leads.json"
  ["publish-action"]="${LOG_DIR}/action-publish.log"
  ["post-sponsorships"]="${LOG_DIR}/outreach.log"
)

STREAMS=(bounty-hunter package-assets audit-crawler publish-action post-sponsorships)

# ── Flags ───────────────────────────────────────────────────────────────
DRY_RUN=false
SINGLE_STREAM=""
DAEMON=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stream)  SINGLE_STREAM="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --daemon)  DAEMON=true; shift ;;
    *) echo "Usage: $0 [--stream NAME] [--dry-run] [--daemon]"; exit 1 ;;
  esac
done

mkdir -p "$LOG_DIR"

# ── Helper ──────────────────────────────────────────────────────────────
run_stream() {
  local name="$1"
  local script="${STREAM_SCRIPT[$name]:-}"
  local log="${STREAM_LOG[$name]:-}"
  local interval="${STREAM_INTERVAL[$name]:-3600}"

  if [[ -z "$script" || ! -f "$script" ]]; then
    echo "[MISSING] $name: script not found at ${script}"
    return 1
  fi

  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[${ts}] [${name}] running..."

  if [[ "$DRY_RUN" == true ]]; then
    echo "  dry-run: $script (interval=${interval}s)"
    return 0
  fi

  # Check spoon level (if SPOON_LEVEL env var exists)
  if [[ -n "${SPOON_LEVEL:-}" ]] && [[ "$SPOON_LEVEL" -lt 2 ]]; then
    echo "  [SKIPPED] SPOON_LEVEL=$SPOON_LEVEL < 2"
    echo "{\"status\":\"skipped\",\"reason\":\"SPOON_LEVEL < 2\",\"stream\":\"${name}\",\"timestamp\":\"${ts}\"}" > "$log"
    return 0
  fi

  # Run with timeout based on interval (max 30 min)
  local timeout_sec=$((interval < 1800 ? interval : 1800))
  if timeout "${timeout_sec}s" bash "$script" > "$log" 2>&1; then
    echo "  [OK] ${name} ($(wc -l < "$log") lines logged)"
  else
    local rc=$?
    echo "  [FAIL] ${name} exit=${rc}"
    # Ensure log has something useful
    echo "{\"status\":\"error\",\"exit_code\":${rc},\"stream\":\"${name}\",\"timestamp\":\"${ts}\"}" >> "$log"
  fi
}

# ── Main ────────────────────────────────────────────────────────────────
if [[ -n "$SINGLE_STREAM" ]]; then
  run_stream "$SINGLE_STREAM"
  exit 0
fi

if [[ "$DAEMON" == true ]]; then
  echo "[MONEY STREAMS] Daemon mode — running all streams in rotation"
  while true; do
    for stream in "${STREAMS[@]}"; do
      run_stream "$stream"
      sleep 5  # brief gap between streams
    done
    echo "[MONEY STREAMS] Cycle complete. Sleeping 5 min before next cycle..."
    sleep 300
  done
  exit 0
fi

echo "[MONEY STREAMS] Running all streams once — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
for stream in "${STREAMS[@]}"; do
  run_stream "$stream"
done
echo "[MONEY STREAMS] All streams complete."
