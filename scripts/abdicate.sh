#!/usr/bin/env bash
# WCD-06: SIGNED — P31-OQE <2026-06-18> — T-0 SCRAM valve (abdicate.sh)
# abdicate.sh — Emotional Packet Retirement (SOULSAFE Kenosis Protocol v0.1)
# Retires an emotional packet by writing an immutable tombstone and logging the event.
# This is the lightweight CORE-LOCAL protocol.
# For cryptographic governance abdication, see crypto-kenosis scripts in admin/.
#
# Usage:
#   ./abdicate.sh --packet-id <UUID> --reason <string> [--tombstone <path>]
#
# Exit codes:
#   0  Success
#   1  Missing or invalid arguments
#   2  Tombstone directory creation failure
#   3  Tombstone write failure
#   4  Health log write failure

set -euo pipefail

PACKET_ID=""
REASON=""
TOMBSTONE_DIR="/home/p31/.p31/cognitive-passport"

usage() {
  echo "Usage: $0 --packet-id <UUID> --reason <string> [--tombstone <path>]"
  echo "  --packet-id   Unique identifier for the emotional packet"
  echo "  --reason      Free-text reason for retirement"
  echo "  --tombstone   Override tombstone directory (default: .p31/cognitive-passport)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --packet-id) PACKET_ID="$2"; shift 2 ;;
    --reason)    REASON="$2"; shift 2 ;;
    --tombstone) TOMBSTONE_DIR="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; usage ;;
  esac
done

if [[ -z "$PACKET_ID" || -z "$REASON" ]]; then
  echo "Error: --packet-id and --reason are required."
  usage
fi

if [[ ! "$PACKET_ID" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Error: packet-id must be alphanumeric with dashes/underscores only."
  exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_ID="${USER:-unknown}-$(hostname)-$(date +%s)"
TOMBSTONE_FILE="${TOMBSTONE_DIR}/${PACKET_ID}.abdicate"

if [[ ! -d "$TOMBSTONE_DIR" ]]; then
  if ! mkdir -p "$TOMBSTONE_DIR" 2>/dev/null; then
    echo "Error: Cannot create tombstone directory: $TOMBSTONE_DIR"
    exit 2
  fi
fi

TMPFILE=$(mktemp "${TOMBSTONE_FILE}.tmp.XXXXXX")
trap 'rm -f "$TMPFILE"' EXIT

cat > "$TMPFILE" <<EOF
# ABDICATION TOMBSTONE
packet_id:   ${PACKET_ID}
reason:      "${REASON}"
timestamp:   ${TIMESTAMP}
session_id:  ${SESSION_ID}
status:      ABDICATED
operator:    ${USER:-unknown}
host:        $(hostname)
pwd:         $(pwd)
shell:       ${SHELL:-unknown}
EOF

if ! mv "$TMPFILE" "$TOMBSTONE_FILE" 2>/dev/null; then
  echo "Error: Cannot write tombstone: $TOMBSTONE_FILE"
  exit 3
fi

trap - EXIT

HEALTH_LOG="/home/p31/.p31/health.jsonl"
ABDICATE_EVENT=$(cat <<EOJSON
{"ts":"${TIMESTAMP}","event":"abdicate","packet_id":"${PACKET_ID}","reason":"${REASON}","session":"${SESSION_ID}"}
EOJSON
)

if ! echo "$ABDICATE_EVENT" >> "$HEALTH_LOG" 2>/dev/null; then
  echo "Warning: Tombstone written but health log update failed."
  exit 4
fi

echo "KENOSIS COMPLETE — ${PACKET_ID} retired at ${TIMESTAMP}"
echo "Tombstone: ${TOMBSTONE_FILE}"
exit 0
