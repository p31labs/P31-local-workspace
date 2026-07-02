# CWP-046: Node Zero Cognitive Passport Integration

## Mission

Extend the Node Zero firmware (`firmware/node-zero/`) with Cognitive Passport v4.1 support. The device must generate, store, display, and export a sovereign identity document that conforms to the locked schema at `software/packages/shared/src/schemas/passport.schema.json`.

## Canonical Data Contract

The machine-readable schema is the source of truth. Before writing any firmware code, read and validate against:

```
software/packages/shared/src/schemas/passport.schema.json
```

Key constraints:
- `schemaVersion`: `p31.cognitivePassport/4.1.0`
- Required top-level fields: `identity`, `accessibility`, `created`, `did`
- `did` must match pattern `^did:key:z[1-9A-HJ-NP-Za-km-z]+$`
- `accessibility` requires: `screenComfort` (0-100), `motionPreference`, `contrastPreference`, `fontSize` (8-32), `density` (0-100)
- All `enum` values are fixed strings — the UI must present exact dropdown options

## Hardware Platform

- **SoC**: ESP32-S3-WROOM-1 N16R8 (16MB flash, 8MB PSRAM)
- **Display**: AXS15231B QSPI, 320x480, sw_rotate=90° → logical 480x320
- **Touch**: AXS15231B integrated, I2C
- **Backlight**: GPIO 6, LEDC PWM
- **PSRAM**: Octal (OCT), 80MHz, double-buffered LVGL framebuffer
- **Connectivity**: WiFi STA, LoRa (SX1262), BLE (future GATT)

## Existing Codebase Structure

```
firmware/node-zero/
  main/
    main.cpp          — app_main, LVGL task, WiFi, LoRa monitor
    display.c/h       — AXS15231B QSPI init, LVGL display driver
    touch.c/h         — I2C touch driver
    p31_ui.c/h        — LVGL widgets (spoon arc, LoRa dot, RSSI bar, status)
    lora.c/h          — SX1262 driver interface
    p31_net.c/h       — Network telemetry task
    bus_mutex.c/h     — I2C shared bus mutex
    lv_conf.h         — LVGL 8.4 configuration
  docs/
    deepseek-boot-ref.md  — WARNING: contains GPIO errors, DO NOT USE
  sdkconfig.defaults  — ESP-IDF config (PSRAM OCT, LVGL, WiFi)
```

## Implementation Tasks

### Task 1: DID Key Generation (C, mbedTLS)

Create `main/did_key.c` and `main/did_key.h`:

1. On first boot (no NVS key), generate Ed25519 keypair using **mbedTLS** (`mbedtls_pk_setup()` with `MBEDTLS_PK_ECKEY`, curve `MBEDTLS_ECP_DP_CURVE25519`).
2. Export public key as raw 32 bytes.
3. Construct `did:key` DID string: `did:key:z` + base64url(public_key_raw).
4. Save private key PEM to NVS namespace `p31`, key `did_privkey`, encrypted flag `nvs_key_partition`.
5. Save `did` string to NVS, key `did_str`.
6. Boot path: load from NVS → if missing, generate → save → proceed.

**Validation rule**: Ed25519 scalar×G must complete in <3ms on ESP32-S3 @ 240MHz.

### Task 2: Passport NVS Storage

Create `main/passport_store.c` and `main/passport_store.h`:

1. Store complete passport JSON (excluding private key) in NVS namespace `p31`, key `passport_json`.
2. Maximum JSON size: 2048 bytes (enforced by NVS page size).
3. Update fields independently when possible; full rewrite on schema change.
4. Provide `passport_store_load()` / `passport_store_save()` API.

### Task 3: Passport-First Boot UI

Extend `p31_ui.c` with a new screen flow:

**Screens (LVGL objects created/destroyed dynamically):**

1. **Boot screen** (existing): Shows while subsystems initialize.
2. **Passport screen** (new — replaces generic "initializing" after boot):
   - Header: "Passport"  (uses existing `s_title_label`)
   - DID display: `lv_label` showing DID truncated to 40 chars + "..."
   - Name field: `lv_label` from `identity.displayName`
   - Role field: `lv_label` from `identity.role`
   - Spoon baseline: arc gauge using existing `s_spoon_arc`
   - Motion preference: text line
   - Contrast preference: text line with visual indicator

**Spoon-aware rendering rules:**
- `spoons >= 4` (Quantum/Bridge): show all fields, full animations
- `spoons == 3` (Bridge): show essential fields only (name, role, spoons), reduce text size
- `spoons <= 2` (Sanctuary/Crisis): minimalist — name only, high contrast, no animation

**Field presentation must validate against schema enums:**
- `motionPreference`: `off` / `reduced` / `full`
- `contrastPreference`: `high` / `standard` / `low`
- `learningPreference`: `visual` / `kinetic` / `text` / `audio` / `multimodal`

### Task 4: QR Export

Create `main/passport_qr.c` and `main/passport_qr.h`:

1. On touch event on DID label, generate QR code containing the full passport JSON (or just DID for minimal export).
2. Use `lv_qrcode_create()` (LVGL 8.4 built-in).
3. Display QR fullscreen for 10 seconds, then return to passport screen.
4. QR must be scannable by generic QR readers (max纠错级别 H).

### Task 5: BLE GATT Service (stub)

Create `main/passport_gatt.c` and `main/passport_gatt.h`:

1. Define BLE GATT service UUID: `0000cafe-0000-1000-8000-00805f9b34fb`.
2. Characteristic for DID (read-only, 64 bytes).
3. Characteristic for passport JSON chunk (read, notify, max 512 bytes).
4. Stub only — full implementation deferred to Track B.

### Task 6: Update p31_net.h

Add to `p31_net.h`:
```c
// Post DID and spoon baseline to PHOS backend when WiFi available
void p31_net_post_did(const char *did, uint8_t baseline_spoons);
```

### Task 7: Update main.cpp

In `app_main`, after `p31_ui_init(disp)`:
1. Call `did_key_init()` — generate or load DID.
2. Call `passport_store_load()` — fetch stored passport fields.
3. Call `p31_ui_update_spoons(passport.baselineSpoons * 20)` — map 0-5 spoons to 0-100%.
4. Call `p31_net_post_did(did, baseline_spoons)` if WiFi available.

## Memory Budget

| Component | Budget | Notes |
|-----------|--------|-------|
| LVGL framebuffer | 480×320×2 × 2 (double) = 614,400 bytes | PSRAM via `CONFIG_LVGL_BUFFER_ALLOC_PSRAM` |
| Passport JSON | ≤2048 bytes | NVS |
| Ed25519 keypair | 64 bytes pub + 32 bytes priv | NVS |
| QR buffer | ~256 bytes | Stack |
| Total heap (internal) | <16KB | Must fit in internal SRAM |

## Non-Functional Requirements

1. Boot to passport screen in <5 seconds from power-on.
2. Ed25519 key generation completes in <3 seconds (target: 2.5ms per scalar×G).
3. Zero telemetry — no data leaves device without explicit operator action.
4. All NVS reads/writes must check return codes; log ESP_ERROR_CHECK failures.
5. All `malloc` calls must check for NULL; integrate with existing `heap_caps_get_free_size()` logging in `main.cpp`.

## Deliverable Format

Return these files with complete implementations:

1. `firmware/node-zero/main/did_key.c`
2. `firmware/node-zero/main/did_key.h`
3. `firmware/node-zero/main/passport_store.c`
4. `firmware/node-zero/main/passport_store.h`
5. `firmware/node-zero/main/passport_qr.c`
6. `firmware/node-zero/main/passport_qr.h`
7. `firmware/node-zero/main/passport_gatt.c`
8. `firmware/node-zero/main/passport_gatt.h`
9. `firmware/node-zero/main/p31_ui.h` (updated)
10. `firmware/node-zero/main/p31_ui.c` (updated)
11. `firmware/node-zero/main/p31_net.h` (updated)
12. `firmware/node-zero/idf_component.yml` (updated with `lvgl` QR dependency if needed)

Do NOT modify `display.c`, `touch.c`, `lora.c`, `main.cpp` unless adding the three integration calls listed in Task 7.

## QA Gate

Before returning, verify:
1. All `#include` directives reference existing headers only.
2. All new APIs use the `p31_*` naming convention.
3. All NVS keys are defined as `#define` constants in the `.c` file.
4. All string copies use `strncpy` with explicit null termination.
5. All dynamic allocations check for NULL.
6. The DID pattern regex matches `passport.schema.json` `$schema` `did` field pattern.
