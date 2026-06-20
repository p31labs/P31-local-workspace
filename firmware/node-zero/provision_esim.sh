#!/usr/bin/env bash
# ── P31 Node Zero — eSIM Provisioning Wrapper ───────────────────────────────────
# Wraps provision_esim.py for operator convenience.
#
# Usage:
#   ./provision_esim.sh [--port /dev/ttyUSB0] [--qr <image> | --smdp <url>]
#
# Dependencies: python3, pyserial, requests, zbarimg (optional for QR)
# ────────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="${PYTHON:-python3}"

echo "════════════════════════════════════════════════════════"
echo "  Node Zero — eSIM Provisioning"
echo "════════════════════════════════════════════════════════"

# Forward all arguments to Python helper and capture exit code
"$PYTHON" "$DIR/provision_esim.py" "$@"
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "════════════════════════════════════════════════════════"
  echo "  PROVISIONING COMPLETE"
  echo "════════════════════════════════════════════════════════"
else
  echo "ERROR: Provisioning failed (code $exit_code)" >&2
fi

exit $exit_code
