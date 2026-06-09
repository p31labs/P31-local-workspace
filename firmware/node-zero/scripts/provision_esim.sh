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

# Forward all arguments to Python helper
exec "$PYTHON" "$DIR/provision_esim.py" "$@"
echo "  Node Zero — eSIM Provisioning"
echo "  Port: $PORT"
echo "════════════════════════════════════════════════════════"

# ── Helper: send AT, wait for OK ───────────────────────────────────────────────
at_cmd() {
  # echo -e for newline; expect "OK" within 2s
  echo -e "$1\r" > "$PORT" 2>/dev/null || true
  # Use `microcom -s` in production; placeholder
  sleep 0.2
}

echo "[1/5] Detecting modem type..."
# Placeholder: in real implementation, use `tools/micropicocom` or `pyserial` read
MODEM_TYPE="unknown"  # will become ublox / quectel / qualcomm

# ── Step 2: Get SM‑DP+ URL ─────────────────────────────────────────────────────
if [[ -n "$QR_IMAGE" ]]; then
  echo "[2/5] Extracting SM‑DP+ URL from QR code..."
  # convert QR image to string using zbarimg or similar
  SMDP_URL=$(zbarimg -q "$QR_IMAGE" 2>/dev/null | head -1 || true)
  if [[ -z "$SMDP_URL" ]]; then
    echo "ERROR: Could not read QR code."
    exit 1
  fi
  echo "      SM‑DP+: $SMDP_URL"
elif [[ -z "$SMDP_URL" ]]; then
  echo "ERROR: Must provide --smdp <url> or --qr <image>"
  exit 1
fi

# ── Step 3: Download profile ───────────────────────────────────────────────────
echo "[3/5] Downloading eSIM profile..."
PROFILE_BIN="/tmp/sim-profile.mf"
curl -f -L -o "$PROFILE_BIN" "$SMDP_URL" || {
  echo "ERROR: Profile download failed (check SM‑DP+ address)."
  exit 1
}
echo "      Profile size: $(stat -c%s "$PROFILE_BIN") bytes"

# ── Step 4: Install profile (chipset‑specific) ──────────────────────────────────
echo "[4/5] Installing profile..."
case "$MODEM_TYPE" in
  ublox)
    # u‑blox LARA‑R6 / SARA‑R5 uses AT+CSIM
    # Convert binary MF to hex string for AT command
    HEX=$(xxd -p -c 64 "$PROFILE_BIN" | tr -d '\n')
    at_cmd "AT+CSIM=88,\"${HEX}\""   # placeholder length calculation required
    ;;
  quectel|qualcomm)
    # Qualcomm/Quectel: qmicli -d /dev/cdc-wdm0 --dms-download-profile
    if command -v qmicli &>/dev/null; then
      qmicli -d /dev/cdc-wdm0 --dms-download-profile="file=$PROFILE_BIN" || true
    else
      echo "ERROR: qmicli not installed for $MODEM_TYPE modem."
      exit 1
    fi
    ;;
  *)
    echo "ERROR: Modem type unknown or not supported yet."
    exit 1
    ;;
esac

# ── Step 5: Verification ───────────────────────────────────────────────────────
echo "[5/5] Verifying installation..."
# For u‑blox read EF.PRID via AT+CRSM
# For QMI: qmicli -d /dev/cdc-wdm0 --uim-get-card_status
echo "Profile installed. Please power‑cycle the device to attach network."

# Store metadata in NVS (to be implemented by node-zero firmware)
# nvs-set p31 esim_installed 1

echo "════════════════════════════════════════════════════════"
echo "  PROVISIONING COMPLETE"
echo "════════════════════════════════════════════════════════"
