#!/usr/bin/env bash
# WCD-06: SIGNED — P31-OQE <2026-06-18> — T+2 auto-SCRAM hook (redboard-scram)
# redboard-scram.sh — Red Board Auto-Scram Integration Hook
#
# Called by spoon_monitor_app.py or cron to:
#   1. Check if Red Board is active
#   2. If active: reset CANARY, block Track B/C terminals, log event
#   3. Exit 0 = clear, Exit 1 = Red Board active (use as shell gate)
#
# Usage:
#   ./redboard-scram.sh check           # Check status only
#   ./redboard-scram.sh scram           # Execute scram sequence
#   ./redboard-scram.sh gate CMD "..."  # Run CMD only if clear
#
# Exit codes:
#   0  Clear — no Red Board active
#   1  Red Board active — operations restricted
#   2  CANARY failure — must complete dead-stick test

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CANARY="${SCRIPT_DIR}/P31-CANARY.sh"
HEALTH_LOG="/home/p31/.p31/health.jsonl"
REDBOARD_DIR="/home/p31/.p31/cognitive-passport"
REDBOARD_LOCK="${REDBOARD_DIR}/redboard.lock"
REDBOARD_LOG="${REDBOARD_DIR}/redboard.log"
BLOCKED_TERMINALS="${REDBOARD_DIR}/blocked_terminals.list"

mkdir -p "$REDBOARD_DIR" 2>/dev/null || true

scram() {
  echo "🚨 RED BOARD SCRAM INITIATED — $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  
  # Reset CANARY for re-entry gating
  if [[ -f "$CANARY" ]]; then
    bash "$CANARY" --reset 2>/dev/null || true
  fi
  
  # Create lock file (blocks Track B/C)
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") RED_BOARD_ACTIVE" > "$REDBOARD_LOCK"
  
  # Log event
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] SCRAM_EXECUTED source=redboard-scram.sh" >> "$HEALTH_LOG" 2>/dev/null || true
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] SCRAM — CANARY reset, Track B/C blocked" >> "$REDBOARD_LOG" 2>/dev/null || true
  
  # Optional: block terminal sessions (populate list if present)
  if [[ -f "$BLOCKED_TERMINALS" ]]; then
    while IFS= read -r term; do
      pkill -f "$term" 2>/dev/null || true
    done < "$BLOCKED_TERMINALS"
  fi
  
  echo "✅ Scram complete. Track A (somatic) continues. Track B/C LOCKED."
  return 1
}

check() {
  if [[ -f "$REDBOARD_LOCK" ]]; then
    echo "STATUS: RED BOARD ACTIVE (lock: $(cat "$REDBOARD_LOCK"))"
    # Check if CANARY is blocking
    if [[ -f "$CANARY" ]]; then
      bash "$CANARY" --status 2>/dev/null || true
    fi
    return 1
  fi
  
  # Check health log for recent Red Board events
  recent=$(tail -100 "$HEALTH_LOG" 2>/dev/null | grep -c '"event":"red_board"' || true)
  recent=${recent:-0}
  if [[ "$recent" -gt 0 ]]; then
    echo "STATUS: RECENT RED BOARD EVENTS (${recent} in last 100 log entries)"
    return 1
  fi
  
  echo "STATUS: CLEAR — no Red Board active"
  return 0
}

gate() {
  local status
  status=$(check 2>/dev/null && echo "CLEAR" || echo "BLOCKED")
  
  if [[ "$status" == "CLEAR" ]]; then
    echo "[redboard-scram] Gate passed — executing: $*"
    "$@"
    return $?
  else
    echo "[redboard-scram] Gate BLOCKED — Red Board active. Cannot execute: $*"
    return 1
  fi
}

case "${1:-check}" in
  check)   check ;;
  scram)   scram ;;
  gate)    shift; gate "$@" ;;
  *)
    echo "Usage: $0 [check|scram|gate CMD...]"
    exit 2
    ;;
esac
