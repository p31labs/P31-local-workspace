# Node Zero — RUNBOOK

> Physical Genesis Node firmware for P31 Sovereign Mesh.
> ESP-IDF v5.5.3 | ESP32-S3 N16R8 | ML-DSA-65 PQC

## Quick Start

```bash
# Build
cd firmware/node-zero
idf.py set-target esp32s3
idf.py build

# Flash + monitor
idf.py -p /dev/ttyUSB0 flash monitor

# Provision WiFi (one-time)
idf.py -p /dev/ttyUSB0 nvs-set p31 wifi_ssid STRING "YourSSID"
idf.py -p /dev/ttyUSB0 nvs-set p31 wifi_pass STRING "YourPassword"

# Provision ETH address (optional, for on-chain anchoring)
idf.py -p /dev/ttyUSB0 nvs-set p31_identity eth_addr STRING "0xYourAddress"
```

## Architecture

### Boot Sequence (`main.cpp`)

1. **NVS** — flash init (with corrupt-partition recovery)
2. **Bus mutex** — I2C0 shared bus (PMIC + codec + touch)
3. **Display** — AXS15231B QSPI + LVGL 8.4 init (sw_rotate 90°)
4. **Touch** — AXS15231B I2C touch (swap_xy for rotation)
5. **LVGL mutex** — 1ms tick timer + CPU1 task (8KB stack)
6. **WiFi** — STA mode, credentials from NVS namespace "p31"
7. **LoRa** — SX1262 915MHz Meshtastic LONG_FAST
8. **PQC Identity** — `mldsa_identity_init()` → Ed25519 + ML-DSA-65 keypair
9. **Net task** — DID display + periodic telemetry (5-min heartbeat)

### PQC Identity (`mldsa_identity.c`)

First boot generates and persists:
- **Ed25519** keypair (32-byte seed → mbedTLS)
- **ML-DSA-65** keypair (`mldsa_generate_keypair` → hardware RNG)
- **did:key** — base58btc(multicodec(0xed01 || ed25519_pub))
- **did:jwk** — SHA-256 thumbprint per RFC 9964 (AKP)

Stored in NVS namespace `p31_identity`:
| Key | Size | Description |
|-----|------|-------------|
| `ed_pub` | 32 B | Ed25519 public key |
| `ed_sec` | 32 B | Ed25519 secret (seed) |
| `mldsa65_pub` | 1,952 B | ML-DSA-65 public key |
| `mldsa65_sec` | 4,032 B | ML-DSA-65 secret key |
| `mldsa65_lvl` | 1 B | Security level (65) |
| `eth_addr` | 44 B | ETH address (EIP-55) |
| `did` | 8 B | Legacy 6-hex DID (deprecated) |

### Care Proof (`p31_care_proof.c`)

Canonical message format:
```
proof|<did:key>|<eth_addr>|<tProx_ms>|<qRes>|<tasks>|<entropyRoots>
```

Composite signature:
```
base64(ed25519_sig) . base64(mldsa65_sig)
```

POSTed to `https://ledger-bridge.trimtab-signal.workers.dev/care-proof`

### LoRa Mesh (`lora.c`)

- SX1262 SPI (defined in `config.h`)
- SF11 / BW250 / CR4/5
- Continuous RX, TX with poll
- Meshtastic-compatible LONG_FAST mode

### UI (`p31_ui.c`)

LVGL 8.4 widgets:
- Spoon arc (0–100%)
- LoRa status dot (green/red)
- RSSI bar
- Status label (DID, Q-score, or error)

## Hardware

| Component | Part | Interface |
|-----------|------|-----------|
| MCU | ESP32-S3 N16R8 | — |
| Display | AXS15231B 3.5" | QSPI |
| Touch | AXS15231B | I2C |
| LoRa | SX1262 | SPI |
| PMIC | AXP2101 | I2C |
| Audio | ES8311 | I2C |

## PQC Performance (ESP32-S3, 240 MHz)

| Operation | Time | Memory |
|-----------|------|--------|
| ML-DSA-65 keygen | ~320 ms | ~45 KB stack |
| ML-DSA-65 sign | ~180 ms | ~45 KB stack |
| ML-DSA-65 verify | ~210 ms | ~45 KB stack |
| Ed25519 sign | ~15 ms | ~8 KB stack |
| Composite proof | ~400 ms total | ~64 KB stack |

**Important:** ML-DSA-65 operations require a dedicated FreeRTOS task with
64 KB stack. Do NOT run on the LVGL task (8 KB stack).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| NVS corrupt on boot | Auto-erased + reinit (handled in `app_main`) |
| No WiFi | Run `provision.sh` or manual `nvs-set` |
| LoRa init failed | Check SPI pins in `config.h`, verify SX1262 wiring |
| Display blank | Check QSPI pins, verify AXS15231B power rail |
| Touch unresponsive | Check I2C address, verify swap_xy/mirror_x config |
| ML-DSA-65 sign fails | Ensure 64 KB stack on calling task |
| Care-proof POST fails | Check WiFi, verify ledger-bridge URL in `p31_care_proof.c` |

## Genesis Activation

1. Flash firmware to Node Zero hardware
2. Provision WiFi + ETH address
3. Device boots → generates PQC identity → displays did:key + did:jwk
4. Net task sends care-proof to ledger-bridge every 5 minutes
5. First successful POST → ledger-bridge anchors on-chain
6. `uplink.html` polls `/genesis/status` → Reunion Protocol unlocks

## Build Variants

```bash
# Production (ML-DSA-65 + LoRa + full UI)
idf.py build

# Minimal (no LoRa, no touch)
idf.py build -DOPTION_LORA=OFF -DOPTION_TOUCH=OFF

# Debug (verbose logging)
idf.py build -DLOG_DEFAULT_LEVEL=4
```

## Files

| File | Purpose |
|------|---------|
| `main.cpp` | Boot sequence + FreeRTOS task creation |
| `mldsa_identity.c/h` | PQC identity (Ed25519 + ML-DSA-65 + DIDs) |
| `p31_care_proof.c/h` | Composite care-proof signing + HTTPS POST |
| `p31_net.c/h` | Network telemetry (spoon reports, Q-score) |
| `p31_ui.c/h` | LVGL UI widgets |
| `lora.c/h` | SX1262 LoRa mesh driver |
| `display.c/h` | AXS15231B QSPI + LVGL init |
| `touch.c/h` | AXS15231B I2C touch |
| `bus_mutex.c/h` | I2C0 shared bus mutex |
| `components/mldsa-esp32/` | ML-DSA-65 component (FIPS 204) |
| `config.h` | GPIO pins, I2C addresses (board-specific) |
| `sdkconfig.defaults` | ESP-IDF build configuration |
