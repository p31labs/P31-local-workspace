# CWP-RNS-01: Reticulum Network Stack on ESP32-S3
# EXEC-10 / Gap F — Node One Firmware
# Agent: DeepSeek (firmware lane)
# Target: Phase 2 (Q4 2026)

## HARDWARE TARGET

- MCU: ESP32-S3 (N16R8: 16MB flash, 8MB PSRAM)
- Display: Waveshare 3.5" Touch LCD (800×480, LVGL 8.4)
- Radio: SX1262 LoRa (915 MHz, SPI interface)
- Framework: ESP-IDF 5.5.x + MicroPython or C port

## OBJECTIVE

Port Reticulum Network Stack (RNS) to Node One so it can:
1. Act as a LoRa mesh relay (receive + rebroadcast RNS packets)
2. Route identity-authenticated messages from @will:p31ca.org
3. Bridge to Meshtastic Phase 1 nodes via UART/serial adapter
4. Display mesh status on LVGL screen

## CONSTRAINTS (verified facts — do not contradict)

- SX1262 link budget: ~170 dB (not 178 dB — do not hallucinate)
- SE050 flash: 50KB — insufficient for PQC, use software Ed25519 only
- LVGL target: 8.4 (not 9.x — 30% RAM overhead in v9)
- GPIO kill zone (PSRAM): 26-37 (avoid these for SX1262 SPI)
- FDA: No classification claimed. General wellness only. Pre-market.

## IMPLEMENTATION PLAN

### Option A: MicroPython + RNS (recommended)

```
Flash layout (16MB):
  0x000000 - 0x1FFFFF: bootloader + MicroPython firmware (~2MB)
  0x200000 - 0x3FFFFF: RNS + application (~2MB)
  0x400000 - 0xFFFFFF: LittleFS filesystem (~12MB)
```

Steps:
1. Build MicroPython for ESP32-S3 with SX1262 driver (lora.py)
2. Port RNS to MicroPython (rns-micropython on GitHub — check fork status)
3. Implement SX1262 LoRa interface via machine.SPI
4. Test: 1 km range, 3 hops, latency measurement
5. Add LVGL C extension or use MicroPython framebuf for status display

### Option B: C port (faster, harder)

Port RNS cryptographic primitives to ESP-IDF C:
- Ed25519: use mbedTLS (already in ESP-IDF)
- Fernet: AES-CBC + HMAC-SHA256 (mbedTLS)
- Routing table: struct-based, heap-allocated
- Interface: esp_wifi + sx1262 SPI driver

## DELIVERABLES

1. `firmware/node-one/main.py` — MicroPython entry point
2. `firmware/node-one/rns_interface.py` — SX1262 LoRa RNS interface
3. `firmware/node-one/mesh_bridge.py` — Meshtastic/RNS bridge
4. `firmware/node-one/display.c` — LVGL mesh status screen
5. Performance report: latency (ms), power draw (mA), flash usage

## TEST CASES

```python
# Test 1: 3-hop relay
# Node A → Node Zero (relay) → Node One → Node B
# Expected: message delivered in <5 seconds, Ed25519 signature valid

# Test 2: Identity persistence across movement
# Move Node One 100m. Verify @will identity still resolves.

# Test 3: Meshtastic interop
# Send Meshtastic text from iPhone. Verify bridge creates RNS packet.

# Test 4: Power budget
# Idle: <50mA. TX burst: <150mA. Sleep: <5mA.
```

## REFERENCES

- RNS: https://unsigned.io/rns/ (Mark Qvist)
- MicroPython RNS: github.com/markqvist/Reticulum (check micropython/ branch)
- SX1262 MicroPython: github.com/martynwheelerNOAA/micropython-sx1262
- ESP-IDF SX1262: github.com/nopnop2002/esp-idf-sx126x
