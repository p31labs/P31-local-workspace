#!/usr/bin/env bash
# WCD-06: SIGNED — P31-OQE <2026-06-18> — T+1 dead-stick test (P31-CANARY)
# P31-CANARY.sh — Dead-Stick Test for Post-Red-Board Re-Entry
#
# After a Red Board event, the system MUST pass the canary before
# any Track B or C terminal is unlocked. This is the non-negotiable
# re-entry gate. No exceptions.
#
# Usage:
#   ./P31-CANARY.sh                    # Run full canary (touch done file)
#   ./P31-CANARY.sh --force            # Skip canary, mark done (emergency only)
#   ./P31-CANARY.sh --status           # Check if canary is pending/completed
#   ./P31-CANARY.sh --reset            # Reset canary for new Red Board event
#
# Exit codes:
#   0  Canary passed (canary.done exists)
#   1  Canary failed (must complete before re-entry)
#   2  Invalid arguments

set -euo pipefail

CANARY_DIR="/home/p31/.p31/cognitive-passport"
CANARY_DONE="${CANARY_DIR}/canary.done"
REDBOARD_LOG="${CANARY_DIR}/redboard.log"

usage() {
  echo "P31-CANARY.sh — Post-Red-Board re-entry gate"
  echo ""
  echo "Usage: $0 [--force|--status|--reset]"
  echo ""
  echo "  --force    Mark canary done without performing task (emergency bypass)"
  echo "  --status   Check canary state"
  echo "  --reset    Clear canary.done for new Red Board event"
  echo ""
  echo "Default: Run canary and wait for manual completion."
  exit "${1:-0}"
}

mkdir -p "$CANARY_DIR"

case "${1:-}" in
  --status)
    if [[ -f "$CANARY_DONE" ]]; then
      echo "STATUS: canary COMPLETE (done at $(stat -c %y "$CANARY_DONE" 2>/dev/null || stat -f '%Sm' "$CANARY_DONE"))"
      exit 0
    else
      echo "STATUS: canary PENDING — complete the task below before re-entry:"
      echo "  TASK: Fold 3 physical items"
      echo "  COMPLETE: touch $CANARY_DONE"
      exit 1
    fi
    ;;
  --force)
    echo "FORCE: Marking canary done without task completion."
    echo "FORCE: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" > "$CANARY_DONE"
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] FORCE CANARY PASS" >> "$REDBOARD_LOG" 2>/dev/null || true
    exit 0
    ;;
  --reset)
    rm -f "$CANARY_DONE"
    echo "RESET: canary cleared for new Red Board event."
    exit 0
    ;;
  "")
    ;;
  *)
    echo "Error: Unknown option: $1"
    usage 2
    ;;
esac

if [[ -f "$CANARY_DONE" ]]; then
  echo "CANARY ALREADY COMPLETE — re-entry permitted."
  exit 0
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         P31 CANARY — DEAD-STICK TEST        ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Before you re-enter the vessel, you must    ║"
echo "║  prove the generator is stable.              ║"
echo "║                                              ║"
echo "║  TASK: Fold 3 physical items.                ║"
echo "║  (Laundry, towel, paper — anything tactile.) ║"
echo "║                                              ║"
echo "║  When complete:                              ║"
echo "║    touch $CANARY_DONE"
echo "║                                              ║"
echo "║  Track B/C terminals remain LOCKED until    ║"
echo "║  canary.done exists.                         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Waiting for completion..."

while [[ ! -f "$CANARY_DONE" ]]; do
  sleep 2
done

echo ""
echo "✅ CANARY PASSED — $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Re-entry permitted. Resume operations."
