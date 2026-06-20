#!/usr/bin/env bash
# WCD-06: SIGNED — P31-OQE <2026-06-18> — T+2 auto-HALT hook (emergency-halt)
# emergency-halt.sh — System Hold Hold Integration Hook
#
# Called by spoon_monitor_app.py or cron to:
#   1. Check if System Hold is active
#   2. If active: reset CANARY, block Track B/C terminals, log event
#   3. Exit 0 = clear, Exit 1 = System Hold active (use as shell gate)
#
# Usage:
#   ./emergency-halt.sh check           # Check status only
#   ./emergency-halt.sh halt            # Execute halt sequence
#   ./emergency-halt.sh gate CMD "..."  # Run CMD only if clear
#
# Exit codes:
#   0  Clear — no System Hold active
#   1  System Hold active — operations restricted
#   2  CANARY failure — must complete dead-stick test

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CANARY="${SCRIPT_DIR}/P31-CANARY.sh"
HEALTH_LOG="/home/p31/.p31/health.jsonl"
HOLD_DIR="/home/p31/.p31/cognitive-passport"
HOLD_LOCK="${HOLD_DIR}/hold.hold"
HOLD_LOG="${HOLD_DIR}/hold.hold"
BLOCKED_ROUTES="${HOLD_DIR}/blocked_routes.list"

mkdir -p "$HOLD_DIR" 2>/dev/null || true

halt_exec() {
  echo "🚨 RED BOARD HALT INITIATED — $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  
  # Reset CANARY for re-entry gating
  if [[ -f "$CANARY" ]]; then
    bash "$CANARY" --reset 2>/dev/null || true
  fi
  
  # Create lock file (blocks Track B/C)
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") SYSTEM_HOLD_ACTIVE" > "$HOLD_LOCK"
  
  # Log event
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] EMERGENCY_HALT_EXECUTED source=emergency-halt.sh" >> "$HEALTH_LOG" 2>/dev/null || true
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] HALT — CANARY reset, Track B/C blocked" >> "$HOLD_LOG" 2>/dev/null || true
  
  # Optional: block terminal sessions (populate list if present)
  if [[ -f "$BLOCKED_ROUTES" ]]; then
    while IFS= read -r term; do
      pkill -f "$term" 2>/dev/null || true
    done < "$BLOCKED_ROUTES"
  fi
  
  echo "✅ Halt complete. Track A (somatic) continues. Track B/C LOCKED."
  return 1
}

check() {
  if [[ -f "$HOLD_LOCK" ]]; then
    echo "STATUS: SYSTEM HOLD ACTIVE (lock: $(cat "$HOLD_LOCK"))"
    # Check if CANARY is blocking
    if [[ -f "$CANARY" ]]; then
      bash "$CANARY" --status 2>/dev/null || true
    fi
    return 1
  fi
  
  # Check health log for recent System Hold events
  recent=$(tail -100 "$HEALTH_LOG" 2>/dev/null | grep -c '"event":"red_board"' || true)
  recent=${recent:-0}
  if [[ "$recent" -gt 0 ]]; then
    echo "STATUS: RECENT RED BOARD EVENTS (${recent} in last 100 log entries)"
    return 1
  fi
  
  echo "STATUS: CLEAR — no System Hold active"
  return 0
}

gate() {
  local status
  status=$(check 2>/dev/null && echo "CLEAR" || echo "BLOCKED")
  
  if [[ "$status" == "CLEAR" ]]; then
    echo "[emergency-halt] Gate passed — executing: $*"
    "$@"
    return $?
  else
    echo "[emergency-halt] Gate BLOCKED — System Hold active. Cannot execute: $*"
    return 1
  fi
}

case "${1:-check}" in
  check)   check ;;
  halt)   halt_exec ;;
  gate)    shift; gate "$@" ;;
  *)
    echo "Usage: $0 [check|halt|gate CMD...]|Usage: $0 [check|halt|gate CMD...]|Usage: $0 [check|halt|gate CMD...]"
    exit 2
    ;;
esac
