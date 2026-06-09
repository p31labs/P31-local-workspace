#!/usr/bin/env bash
# ── P31 Node Zero — Nuclear Flash Script ─────────────────────────────────────
# Performs full flash erase before programming to eliminate ghost firmware,
# corrupt NVS, and mismatched partition tables from previous OTA attempts.
#
# Usage:
#   ./flash.sh                    # auto-detect port
#   ./flash.sh /dev/ttyUSB0       # explicit port
#   ./flash.sh /dev/ttyUSB0 921600  # explicit port + baud
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PORT="${1:-}"
BAUD="${2:-460800}"
CHIP="esp32s3"

# ── Locate serial port ────────────────────────────────────────────────────────
if [ -z "$PORT" ]; then
  for candidate in /dev/ttyUSB0 /dev/ttyUSB1 /dev/ttyACM0 /dev/cu.usbserial-*; do
    if [ -e "$candidate" ]; then PORT="$candidate"; break; fi
  done
fi

if [ -z "$PORT" ]; then
  echo "ERROR: No serial port found. Pass port as first argument."
  exit 1
fi

echo "════════════════════════════════════════════════════════"
echo "  P31 NODE ZERO — NUCLEAR FLASH"
echo "  Port: $PORT @ ${BAUD} baud"
echo "════════════════════════════════════════════════════════"

# ── Step 1: Nuclear erase ─────────────────────────────────────────────────────
echo ""
echo "[1/3] Nuclear erase — writing 0xFF to all 16MB sectors..."
echo "      This destroys ghost firmware, corrupt NVS, and old partition tables."
python3 -m esptool --chip $CHIP --port "$PORT" --baud "$BAUD" erase_flash
echo "      Erase complete."

# ── Step 2: Build (if build dir missing) ─────────────────────────────────────
echo ""
if [ ! -f "build/p31-node-zero.bin" ]; then
  echo "[2/3] No build found — running idf.py build..."
  idf.py build
else
  echo "[2/3] Using existing build: build/p31-node-zero.bin"
fi

# ── Step 3: Flash ─────────────────────────────────────────────────────────────
echo ""
echo "[3/3] Flashing..."
idf.py -p "$PORT" -b "$BAUD" flash

echo ""
echo "════════════════════════════════════════════════════════"
echo "  FLASH COMPLETE — opening monitor"
echo "  Press Ctrl+] to exit monitor"
echo "════════════════════════════════════════════════════════"
idf.py -p "$PORT" monitor
