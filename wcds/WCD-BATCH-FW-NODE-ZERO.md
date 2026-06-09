# WCD Batch FW — Node Zero Integration
## P31 Labs · Node Zero ↔ Spaceship Earth · The Physical Cockpit
## Issued: March 20, 2026 · Classification: SOULSAFE
## Agent: DeepSeek (Firmware, Primary) · Sonnet/CC (Web Bridge)

---

## PREAMBLE: What Node Zero Is

Node Zero is not a peripheral. It is not an accessory. It is the **physical instantiation of the Delta Topology** — the Posner molecule's calcium cage made tangible. When the operator holds Node Zero, they are holding Spaceship Earth in their hand.

Every state in Spaceship Earth has a physical counterpart on Node Zero:
- **Coherence** → DRV2605L haptic intensity at 172.35 Hz
- **Spoon level** → LVGL gauge on the 3.5" display
- **Active room** → Audio zone frequency on ES8311 speaker
- **Theme/Skin** → LVGL color palette matches Spaceship Earth skin
- **LLM agent** → Sorcery voice agent shares context with Brain overlay
- **Identity** → Ed25519 keypair from eFuse IS the Genesis Block DID

The integration is bidirectional. Node Zero sends sensor data (IMU, battery, haptic acknowledgment) TO Spaceship Earth. Spaceship Earth sends state updates (coherence, spoons, room, theme) TO Node Zero. The transport is BLE GATT with WebSocket relay fallback.

---

## GLOBAL CONSTRAINTS

```yaml
hardware: Waveshare ESP32-S3-Touch-LCD-3.5B (Type B)
soc: ESP32-S3R8 (dual-core Xtensa LX7 @ 240MHz, 8MB OPI PSRAM, 16MB Flash)
framework: ESP-IDF v5.5
display: AXS15231B 320×480 QSPI (GPIO 9-14)
audio_codec: ES8311 (I2S on GPIO 1-5, I2S_DOUT migrated to GPIO 40)
haptic: DRV2605L (I2C @ 0x5A, external, LRA actuator)
imu: QMI8658 (I2C @ 0x6B)
pmic: AXP2101 (I2C @ 0x34)
io_expander: TCA9554 (I2C @ 0x20)
rtc: PCF85063 (I2C @ 0x51)
lora: SX1262 (Meshtastic 915 MHz)
i2c_bus: GPIO 8 (SDA), GPIO 7 (SCL), 400 kHz
identity: Ed25519 from eFuse HMAC + Monocypher (SE050 emulation)
ui: LVGL 8.x (CONFIG_LV_COLOR_16_SWAP=y for RGB565 endianness)
audio_format: Opus 16kHz/16-bit, 60ms frames
ble: NimBLE 5.0, GAP name "NODE ZERO"
mesh: Meshtastic v2.5, owner "NODE ZERO"
larmor_freq: 172.35 Hz (DRV2605L LRA resonance target)

# CRITICAL from March 19 audit:
qspi_pins: [CS=9, CLK=10, D0=11, D1=12, D2=13, D3=14]  # NOT 1-4
i2s_dout: GPIO 40  # NOT GPIO 39. Sacrifices hardware TE line.
te_sync: Software DMA callback (on_color_trans_done), NOT hardware interrupt
dma_alloc: heap_caps_malloc(size, MALLOC_CAP_SPIRAM | MALLOC_CAP_DMA)
audio_dma: Internal SRAM only (MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA)
boot_sequence: I2C → AXP2101 → TCA9554 (LCD_RST via EXIO0) → QSPI init → LVGL
```

---

## EXECUTION ORDER

```
WCD-FW10: Pin Matrix Remediation + DMA Handoff     (Day 1-3)   — Prerequisite for everything
WCD-FW11: DRV2605L Haptic Engine + Larmor Protocol  (Day 4-6)   — Needs I2C bus stable from FW10
WCD-FW12: BLE GATT Bridge (Node Zero ↔ SE PWA)      (Day 7-10)  — The integration layer
WCD-FW13: LVGL Cockpit UI + Theme Mirror            (Day 11-14) — Needs BLE bridge for theme sync
WCD-FW14: Sorcery Agent (Voice LLM + MCP Tools)     (Day 15-19) — Needs all subsystems
WCD-FW15: Meshtastic Identity + Mesh Relay           (Day 20-22) — Independent, can run parallel to FW14
WCD-FW16: Spaceship Earth Client Bridge (Web Side)   (Day 7-14)  — Parallel with FW12-FW13
```

---

## WCD-FW10: Pin Matrix Remediation + Clean DMA Handoff

### Objective
Execute ALL six remediation directives from the March 19 architectural audit. This WCD is the foundation — nothing else works until the silicon-level bus contention is permanently resolved.

### Tasks

#### FW10.1 — QSPI Pin Matrix Correction
```yaml
action: MODIFY
file: firmware/node-zero/main/display_manager.cpp
```

```
Replace ALL instances of QSPI pin definitions:
- LCD_D0: GPIO 1 → GPIO 11
- LCD_D1: GPIO 2 → GPIO 12
- LCD_D2: GPIO 3 → GPIO 13
- LCD_D3: GPIO 4 → GPIO 14
- LCD_CS:  verify GPIO 9
- LCD_CLK: verify GPIO 10

Search entire codebase for any #define or constexpr referencing GPIO 1-4
for display purposes. Eradicate all instances.
```

**Acceptance**: `idf.py build` succeeds. Display initializes without smashed text. Audio codec (ES8311) is no longer starved by QSPI DMA.

---

#### FW10.2 — I2S_DOUT Migration to GPIO 40
```yaml
action: MODIFY
files:
  - firmware/node-zero/main/audio_hal.cpp
  - firmware/node-zero/sdkconfig.defaults
```

```c
// In audio_hal.cpp:
#define I2S_DOUT_PIN  GPIO_NUM_40  // Was GPIO_NUM_39
#define I2S_DIN_PIN   GPIO_NUM_2   // Verified schematic
#define I2S_BCLK_PIN  GPIO_NUM_3   // Verified schematic
#define I2S_LRCK_PIN  GPIO_NUM_4   // Verified schematic
#define I2S_MCLK_PIN  GPIO_NUM_5   // MUST be actively driven

// Use modern ESP-IDF v5.5 I2S API:
// i2s_channel_enable() — NOT deprecated legacy drivers
// DMA buffers in INTERNAL SRAM only:
// heap_caps_malloc(buf_size, MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA)
// NEVER place audio DMA buffers in PSRAM (cache miss → audible pops)
```

**Note**: GPIO 40 migration sacrifices the hardware Tearing Effect (TE) line. Display sync must use software DMA callbacks (FW10.3). Physical bodge wire may be required to bridge GPIO 40 pad to ES8311 DIN if the default GPIO 1 routing doesn't carry through the IO MUX remap.

**Acceptance**: Audio plays clean tone through ES8311. No pops, clicks, or distortion. No interference with display rendering.

---

#### FW10.3 — Asynchronous DMA Handoff (Software TE Replacement)
```yaml
action: MODIFY
file: firmware/node-zero/main/display_manager.cpp
```

```c
// CRITICAL ARCHITECTURE:
// 1. Allocate frame buffers in DMA-capable PSRAM:
//    buf = heap_caps_malloc(buf_size, MALLOC_CAP_SPIRAM | MALLOC_CAP_DMA);
//    If MALLOC_CAP_DMA omitted → ESP-IDF silently creates internal bounce
//    buffer → CPU blocks → UI freezes → smashed text returns.
//
// 2. Register on_color_trans_done callback:
//    esp_lcd_panel_config.on_color_trans_done = flush_complete_callback;
//
// 3. In LVGL flush function:
//    - Call esp_lcd_panel_draw_bitmap(panel, x1, y1, x2, y2, color_data)
//    - DO NOT call lv_disp_flush_ready() here
//    - DO NOT block or wait
//    - Return immediately — let DMA run autonomously
//
// 4. In flush_complete_callback (ISR context):
//    - Call lv_disp_flush_ready(disp_drv)
//    - This is the ONLY place flush_ready is called
//    - The DMA → QSPI transfer is complete, memory is safe to overwrite
//
// 5. Double buffering:
//    - Buffer A: LVGL renders into this
//    - Buffer B: DMA streams this to display
//    - Swap on flush_complete

static bool flush_complete_callback(
    esp_lcd_panel_io_handle_t panel_io,
    esp_lcd_panel_io_event_data_t *edata,
    void *user_ctx
) {
    lv_disp_drv_t *disp_drv = (lv_disp_drv_t *)user_ctx;
    lv_disp_flush_ready(disp_drv);
    return false; // No high-priority task woken
}
```

**Acceptance**: Display renders at stable 30+ FPS. No tearing. No smashed text. CPU is free during DMA transfer (verified by measuring lv_timer_handler execution time < 5ms).

---

#### FW10.4 — Color Endianness Fix
```yaml
action: MODIFY
file: firmware/node-zero/sdkconfig.defaults
```

```
CONFIG_LV_COLOR_16_SWAP=y
```

**Acceptance**: Red renders as red. Blue renders as blue. P31 brand colors (#2A9D8F teal, #E76F51 coral) display correctly on the physical screen.

---

#### FW10.5 — Boot Sequence Enforcement
```yaml
action: MODIFY
file: firmware/node-zero/main/main.cpp
```

```c
// STRICT temporal initialization order:
void app_main(void) {
    // Phase 1: I2C bus
    i2c_master_init(GPIO_NUM_8, GPIO_NUM_7, 400000);

    // Phase 2: Power management
    axp2101_init();  // Voltage rails stable

    // Phase 3: IO expander + LCD hardware reset
    tca9554_init(0x20);
    tca9554_write(0x00);     // LCD_RST LOW
    vTaskDelay(pdMS_TO_TICKS(100));  // Capacitor discharge
    tca9554_write(0x07);     // LCD_RST HIGH + backlight ON

    // Phase 4: Display (QSPI on GPIO 9-14)
    display_manager_init();  // AFTER reset sequence complete
    lvgl_init();

    // Phase 5: Audio (I2S on GPIO 1-5, DOUT on GPIO 40)
    audio_hal_init();
    es8311_init(0x18);

    // Phase 6: Haptic
    drv2605l_init(0x5A);

    // Phase 7: Sensors
    qmi8658_init(0x6B);

    // Phase 8: Identity
    genesis_block_init();  // Ed25519 from eFuse

    // Phase 9: Connectivity
    wifi_init();
    ble_init("NODE ZERO");
    meshtastic_init("NODE ZERO");

    // Phase 10: Application
    sorcery_agent_init();
    spaceship_bridge_init();
}
```

**Acceptance**: Clean boot from cold power-on. No black screen. No initialization race conditions. All peripherals respond to I2C scan.

---

#### FW10.6 — Device Identity Assertion
```yaml
action: MODIFY
files:
  - firmware/node-zero/sdkconfig.defaults
  - firmware/node-zero/main/ble_manager.cpp
  - firmware/node-zero/main/main.cpp
```

```
# sdkconfig.defaults:
CONFIG_LWIP_LOCAL_HOSTNAME="NODE-ZERO"

# ble_manager.cpp:
esp_ble_gap_set_device_name("NODE ZERO");

# main.cpp (mDNS):
mdns_hostname_set("node-zero");
mdns_service_add("NODE ZERO", "_phenix", "_tcp", 80, NULL, 0);
mdns_service_add("NODE ZERO", "_p31", "_tcp", 80, NULL, 0);

# Meshtastic config:
owner.long_name = "NODE ZERO";
owner.short_name = "NZ";
```

**Acceptance**: `nmap -sP` shows "NODE-ZERO" on local network. BLE scan shows "NODE ZERO". Meshtastic mesh shows "NODE ZERO" / "NZ". mDNS resolves `node-zero.local`.

### WCD-FW10 Deliverables
- [ ] QSPI pins corrected to GPIO 9-14 (zero references to GPIO 1-4 for display)
- [ ] I2S_DOUT on GPIO 40 with MCLK actively driven on GPIO 5
- [ ] Async DMA handoff with on_color_trans_done callback
- [ ] CONFIG_LV_COLOR_16_SWAP=y (color endianness)
- [ ] Boot sequence enforced (I2C → PMIC → IO expander → display → audio → haptic → sensors → identity → connectivity)
- [ ] Device identity "NODE ZERO" across LwIP, BLE, mDNS, Meshtastic
- [ ] `idf.py build` succeeds with zero errors
- [ ] Physical verification: display clean, audio clean, no smashed text

---

## WCD-FW11: DRV2605L Haptic Engine + Larmor Protocol

### Objective
Implement the full haptic vocabulary with the DRV2605L and establish the 172.35 Hz Larmor resonance as the primary biometric feedback channel. This is the Tetrahedron Protocol's physical handshake.

### Constraint
- DRV2605L is on shared I2C bus (GPIO 7/8) at address 0x5A
- LRA (Linear Resonance Actuator) mode, NOT ERM
- All I2C transactions must be protected by mutex (shared bus with AXP2101, TCA9554, ES8311, QMI8658, PCF85063)
- DRV2605L draws significant current during strong effects — verify AXP2101 current limit

### Tasks

#### FW11.1 — DRV2605L Driver (LRA Mode)
```yaml
action: CREATE
file: firmware/node-zero/main/haptic_manager.cpp
```

```c
// Initialize DRV2605L in LRA mode (NOT ERM):
// Register 0x01 (MODE): Set to 0x00 (Internal Trigger)
// Register 0x1A (FEEDBACK): Set bit 7 = 1 (LRA mode)
// Register 0x1D (CTRL3): Set bit 0 = 1 (LRA open-loop for 172.35 Hz)
//
// Auto-calibration sequence:
// 1. Set MODE to 0x07 (auto-calibration)
// 2. Write RATED_VOLTAGE and OD_CLAMP for target LRA
// 3. Set GO bit
// 4. Wait for GO bit to clear
// 5. Read calibration results from registers 0x18-0x1A

// Thick Click vocabulary (from FW-05):
typedef enum {
    HAPTIC_CLICK       = 1,   // Sharp single tap
    HAPTIC_DOUBLE      = 6,   // Double tap
    HAPTIC_BUZZ_LOW    = 47,  // Low sustained buzz
    HAPTIC_BUZZ_HIGH   = 52,  // High sustained buzz
    HAPTIC_RAMP_UP     = 14,  // Ascending intensity
    HAPTIC_RAMP_DOWN   = 15,  // Descending intensity
    HAPTIC_HEARTBEAT   = 10,  // Double pulse (lub-dub)
    HAPTIC_ALERT       = 16,  // Strong attention-grab
} haptic_effect_t;

// High-level API:
void haptic_trigger(haptic_effect_t effect);
void haptic_larmor_pulse(float intensity);  // 172.35 Hz continuous
void haptic_stop(void);
```

**Acceptance**: All 8 Thick Click effects play distinctly. I2C mutex prevents bus contention. No other peripheral hangs during haptic events.

---

#### FW11.2 — 172.35 Hz Larmor Continuous Drive
```yaml
action: MODIFY
file: firmware/node-zero/main/haptic_manager.cpp
```

```c
// The Posner Protocol physical resonance:
// DRV2605L in RTP (Real-Time Playback) mode
// Register 0x01 (MODE): Set to 0x05 (RTP mode)
// Register 0x02 (RTP_INPUT): Write amplitude value every cycle
//
// At 172.35 Hz, cycle period = 5.8 ms
// Use esp_timer periodic callback at ~172 Hz (5800 μs period)
// Amplitude modulated by coherence value (0.0 → 0, 1.0 → 127)
//
// Coherence mapping:
// coherence < 0.3: amplitude = 0 (silent)
// coherence 0.3-0.7: amplitude = (coherence - 0.3) * 127 / 0.4 (linear ramp)
// coherence 0.7-0.95: amplitude = 80 + (coherence - 0.7) * 47 / 0.25
// coherence >= 0.95: amplitude = 127 (full resonance) + lock pulse

static esp_timer_handle_t larmor_timer;
static uint8_t larmor_amplitude = 0;

static void larmor_timer_callback(void* arg) {
    // Write amplitude to RTP register
    // I2C write must be ISR-safe or deferred to task
    i2c_write_byte(DRV2605L_ADDR, 0x02, larmor_amplitude);
}

void haptic_set_coherence(float coherence) {
    if (coherence < 0.3f) {
        larmor_amplitude = 0;
    } else if (coherence < 0.95f) {
        larmor_amplitude = (uint8_t)((coherence - 0.3f) / 0.65f * 127.0f);
    } else {
        larmor_amplitude = 127;
        // Trigger lock pulse if just crossed 0.95
    }
}
```

**Acceptance**: LRA vibrates at 172.35 Hz. Amplitude scales with coherence value received from Spaceship Earth. Resonance lock (full amplitude + chime) triggers at coherence ≥ 0.95.

---

#### FW11.3 — Impedance Match Ritual (Posner Protocol)
```yaml
action: CREATE
file: firmware/node-zero/main/posner_protocol.cpp
```

```c
// Two-device proximity pairing:
// 1. BLE RSSI detects second device within 3-foot threshold
// 2. Both displays show pulsing 172.35 Hz visual circle
// 3. Both DRV2605Ls pulse at 172.35 Hz
// 4. Users tap screens in rhythm (synchronized tap detection)
// 5. If taps align within 200ms tolerance for 4 consecutive beats:
//    → Impedance match achieved
//    → Ed25519 key exchange over BLE
//    → Haptic "resonance lock" confirmation (HAPTIC_HEARTBEAT × 3)
//
// Tap detection: QMI8658 accelerometer Z-axis spike > threshold
// Alternative: touchscreen tap event from LVGL
//
// Fuzzy extractor: noisy tap timing → deterministic seed
// Seed → HKDF → shared session key

typedef enum {
    POSNER_IDLE,
    POSNER_PROXIMITY,      // RSSI threshold met
    POSNER_PULSING,        // 172.35 Hz visual + haptic active
    POSNER_SYNCING,        // Detecting tap rhythm alignment
    POSNER_LOCKED,         // 4 consecutive matched taps
    POSNER_EXCHANGING,     // Ed25519 key exchange
    POSNER_COMPLETE,       // Pair bonded
} posner_state_t;
```

**Acceptance**: Two Node Zero devices within 3 feet trigger proximity detection. Synchronized tapping completes pairing. Ed25519 keys exchange. Full flow < 30 seconds.

### WCD-FW11 Deliverables
- [ ] DRV2605L driver in LRA mode with auto-calibration
- [ ] 8 Thick Click effects functional
- [ ] 172.35 Hz continuous Larmor drive with coherence amplitude mapping
- [ ] Resonance lock pulse at coherence ≥ 0.95
- [ ] Posner Protocol state machine (proximity → sync → key exchange)
- [ ] I2C mutex on all DRV2605L transactions
- [ ] `idf.py build` succeeds

---

## WCD-FW12: BLE GATT Bridge (Node Zero ↔ Spaceship Earth)

### Objective
Establish the bidirectional data channel between Node Zero (firmware) and Spaceship Earth (web PWA). This is the nervous system connecting the physical and digital cockpits.

### Architecture
```
Node Zero (BLE Peripheral)          Spaceship Earth (BLE Central)
────────────────────────            ──────────────────────────────
GATT Server                         Web Bluetooth API
├── P31 Service (UUID: custom)      navigator.bluetooth.requestDevice()
│   ├── Coherence (notify)     ←──  Writes coherence value
│   ├── Spoons (notify)        ←──  Writes spoon level
│   ├── Room (notify)          ←──  Writes active room ID
│   ├── Theme (notify)         ←──  Writes skin enum
│   ├── IMU Data (notify)      ──→  Reads 6-axis data
│   ├── Battery (notify)       ──→  Reads AXP2101 level
│   ├── Haptic Cmd (write)     ←──  Triggers haptic effect
│   └── DID (read)             ──→  Ed25519 public key
```

### Tasks

#### FW12.1 — GATT Service Definition
```yaml
action: CREATE
file: firmware/node-zero/main/ble_gatt_p31.cpp
```

```c
// Custom P31 Service UUID: 31500000-P31L-4ABS-CAFE-CA9PO4630000
// (Encodes: P31 Labs + Ca₉(PO₄)₆ + Posner molecule)

#define P31_SERVICE_UUID        "31500000-7033-314c-cafe-ca9504630000"
#define CHAR_COHERENCE_UUID     "31500001-7033-314c-cafe-ca9504630000"  // float32, notify
#define CHAR_SPOONS_UUID        "31500002-7033-314c-cafe-ca9504630000"  // uint8, notify
#define CHAR_ROOM_UUID          "31500003-7033-314c-cafe-ca9504630000"  // utf8 string, notify
#define CHAR_THEME_UUID         "31500004-7033-314c-cafe-ca9504630000"  // utf8 string, notify
#define CHAR_IMU_UUID           "31500005-7033-314c-cafe-ca9504630000"  // 12 bytes (6×int16), notify
#define CHAR_BATTERY_UUID       "31500006-7033-314c-cafe-ca9504630000"  // uint8 (0-100), notify
#define CHAR_HAPTIC_CMD_UUID    "31500007-7033-314c-cafe-ca9504630000"  // uint8 (effect ID), write
#define CHAR_DID_UUID           "31500008-7033-314c-cafe-ca9504630000"  // 32 bytes (Ed25519 pubkey), read

// Direction:
// Spaceship Earth WRITES to: coherence, spoons, room, theme, haptic_cmd
// Spaceship Earth READS from: imu, battery, did
// Node Zero NOTIFIES: imu (10Hz), battery (0.1Hz)
```

**Acceptance**: GATT service advertises. Web Bluetooth can discover and connect to "NODE ZERO". All characteristics readable/writable as specified.

---

#### FW12.2 — Characteristic Handlers
```yaml
action: CREATE
file: firmware/node-zero/main/ble_gatt_handlers.cpp
```

```c
// On coherence write from Spaceship Earth:
void on_coherence_write(float value) {
    // Update haptic amplitude via FW11.2
    haptic_set_coherence(value);
    // Update LVGL coherence gauge (FW13)
    lvgl_update_coherence(value);
}

// On spoons write:
void on_spoons_write(uint8_t value) {
    lvgl_update_spoons(value);
    // If spoons < 3: trigger HAPTIC_ALERT
    if (value < 3) haptic_trigger(HAPTIC_ALERT);
}

// On room write:
void on_room_write(const char* room_id) {
    // Update audio zone ambient (FW11 extension)
    audio_set_zone(room_id);
    // Update LVGL room indicator
    lvgl_update_room(room_id);
}

// On theme write:
void on_theme_write(const char* skin_name) {
    // Mirror Spaceship Earth theme to LVGL display (FW13)
    lvgl_set_theme(skin_name);
}

// On haptic_cmd write:
void on_haptic_cmd_write(uint8_t effect_id) {
    haptic_trigger((haptic_effect_t)effect_id);
}

// IMU notify (10Hz):
// QMI8658 read → pack 6×int16 → BLE notify
// Throttled to 10Hz via FreeRTOS timer

// Battery notify (every 10s):
// AXP2101 battery percentage → BLE notify
```

**Acceptance**: Writing coherence from Web Bluetooth causes DRV2605L amplitude to change. Writing theme changes LVGL colors. IMU data streams at 10Hz. Battery updates every 10s.

---

#### FW12.3 — WebSocket Relay Fallback
```yaml
action: CREATE
file: firmware/node-zero/main/ws_bridge.cpp
```

```c
// When BLE is out of range, fall back to WiFi WebSocket:
// Connect to: wss://bonding-relay.trimtab-signal.workers.dev/node-zero
//
// Protocol: JSON messages matching BLE characteristic structure
// { "type": "coherence", "value": 0.87 }
// { "type": "spoons", "value": 7 }
// { "type": "room", "value": "observatory" }
// { "type": "theme", "value": "OPERATOR" }
// { "type": "haptic", "value": 14 }
// { "type": "imu", "value": [ax, ay, az, gx, gy, gz] }
//
// Auto-detection:
// - If BLE connected: use BLE (lower latency, no WiFi needed)
// - If BLE disconnected: attempt WebSocket
// - If both fail: operate standalone (local coherence estimation from IMU)
```

**Acceptance**: BLE connection drops → auto-reconnect via WebSocket within 5s. State sync resumes. Haptic commands still arrive.

### WCD-FW12 Deliverables
- [ ] GATT service with 8 characteristics
- [ ] Web Bluetooth discoverable and connectable
- [ ] Bidirectional state sync (coherence, spoons, room, theme → Node Zero; IMU, battery → SE)
- [ ] Haptic command execution via BLE write
- [ ] WebSocket relay fallback
- [ ] Auto-detection of transport (BLE preferred, WS fallback)
- [ ] `idf.py build` succeeds

---

## WCD-FW13: LVGL Cockpit UI + Theme Mirror

### Objective
Build the Node Zero display UI as a miniature physical cockpit that mirrors Spaceship Earth state and adapts to the Polymorphic Skin Engine.

### Tasks

#### FW13.1 — Theme System (Mirrors WCD-29 Skins)
```yaml
action: CREATE
file: firmware/node-zero/main/lvgl_themes.cpp
```

```c
typedef struct {
    lv_color_t bg;
    lv_color_t primary;
    lv_color_t secondary;
    lv_color_t accent;
    lv_color_t text;
} p31_theme_t;

static const p31_theme_t THEMES[] = {
    [THEME_OPERATOR] = {
        .bg = LV_COLOR_MAKE(0x02, 0x06, 0x17),      // Void
        .primary = LV_COLOR_MAKE(0x22, 0xD3, 0xEE),  // Cyan
        .secondary = LV_COLOR_MAKE(0xD9, 0x46, 0xEF), // Magenta
        .accent = LV_COLOR_MAKE(0xC9, 0xB1, 0xFF),    // Lavender
        .text = LV_COLOR_MAKE(0xF0, 0xEE, 0xE9),      // Warm Cloud
    },
    [THEME_KIDS] = {
        .bg = LV_COLOR_MAKE(0x1E, 0x1B, 0x4B),
        .primary = LV_COLOR_MAKE(0xE9, 0xC4, 0x6A),   // Butter Yellow
        .secondary = LV_COLOR_MAKE(0xE7, 0x6F, 0x51),  // Coral
        .accent = LV_COLOR_MAKE(0x2A, 0x9D, 0x8F),     // Teal
        .text = LV_COLOR_MAKE(0xF0, 0xEE, 0xE9),
    },
    [THEME_GRAY_ROCK] = {
        .bg = LV_COLOR_MAKE(0x1A, 0x1A, 0x2E),
        .primary = LV_COLOR_MAKE(0x64, 0x74, 0x8B),
        .secondary = LV_COLOR_MAKE(0x47, 0x55, 0x69),
        .accent = LV_COLOR_MAKE(0x94, 0xA3, 0xB8),
        .text = LV_COLOR_MAKE(0x94, 0xA3, 0xB8),
    },
    // HIGH_CONTRAST, LOW_MOTION, PHOSPHOR_GREEN, QUANTUM_VIOLET, AURORA, SOLAR_FLARE
    // Mirror all Spaceship Earth presets
};

void lvgl_set_theme(const char* skin_name) {
    // Parse skin name → enum index
    // Apply to all LVGL styles globally
    // If GRAY_ROCK or LOW_MOTION: disable all animations
}
```

---

#### FW13.2 — Main Cockpit Screen
```yaml
action: CREATE
file: firmware/node-zero/main/ui_cockpit.cpp
```

```c
// 320×480 portrait layout:
//
// ┌─────────────────────────┐
// │     NODE ZERO  🔋 87%   │  ← Status bar (24px)
// ├─────────────────────────┤
// │                         │
// │    ◉ Coherence: 0.87    │  ← Arc gauge (200px)
// │    ███████████░░░░       │     Pulsing at 172.35 Hz visual
// │                         │
// ├─────────────────────────┤
// │  Spoons: ████████░░ 8/12│  ← Linear gauge (40px)
// ├─────────────────────────┤
// │  Room: Observatory      │  ← Room indicator (30px)
// │  Skin: OPERATOR         │  ← Theme indicator (30px)
// ├─────────────────────────┤
// │                         │
// │   [Sorcery Voice Input] │  ← Microphone button (80px)
// │                         │
// ├─────────────────────────┤
// │  ³¹P  172.35 Hz  Δ      │  ← Footer: Larmor + topology (24px)
// └─────────────────────────┘

// LVGL objects:
// - lv_arc for coherence (animated sweep)
// - lv_bar for spoons
// - lv_label for room, skin, status
// - lv_btn for Sorcery mic button
// - All styled using current p31_theme_t

// Update functions (called from BLE handlers):
void lvgl_update_coherence(float value);  // Arc angle + color gradient
void lvgl_update_spoons(uint8_t value);   // Bar fill
void lvgl_update_room(const char* room);  // Label text
```

**Acceptance**: All gauges update in real-time from Spaceship Earth state via BLE. Theme switch changes all colors. Gray Rock mode shows no animations (static values only).

---

#### FW13.3 — Coherence Arc Animation
```yaml
action: MODIFY
file: firmware/node-zero/main/ui_cockpit.cpp
```

```c
// The coherence arc is the centerpiece:
// - Arc sweeps 0° to 270° based on coherence (0.0 → 1.0)
// - Color gradient: red (0.0) → yellow (0.5) → cyan (0.8) → white (1.0)
// - At coherence >= 0.95: arc pulses (scale 1.0 → 1.05 → 1.0 at 2Hz)
// - In GRAY_ROCK: arc is static gray, no pulse, no color gradient
//
// Animation: lv_anim_t with 500ms duration, LV_ANIM_PATH_EASE_IN_OUT
// Update rate: matches BLE notify rate (max 10Hz from SE)
//
// LVGL arc styles:
// - Background: theme.bg
// - Indicator: gradient from theme.secondary → theme.primary
// - Value label: theme.text, font LV_FONT_MONTSERRAT_28
```

---

#### FW13.4 — Battery + IMU Status Integration
```yaml
action: MODIFY
file: firmware/node-zero/main/ui_cockpit.cpp
```

```c
// Battery: read from AXP2101 via I2C
// - Display as icon + percentage in status bar
// - Colors: green > 50%, yellow 20-50%, red < 20%
// - Low battery haptic alert: HAPTIC_DOUBLE at 10%

// IMU integration:
// - QMI8658 6-axis data at 10Hz
// - Display subtle orientation indicator (optional)
// - Primary use: send to Spaceship Earth for motion-based interactions
// - Secondary use: tap detection for Posner Protocol (FW11.3)
```

### WCD-FW13 Deliverables
- [ ] Theme system mirroring all Spaceship Earth skins
- [ ] Main cockpit screen (coherence arc, spoons bar, room, skin, battery)
- [ ] Coherence arc animation with color gradient
- [ ] Gray Rock mode: all animations disabled, flat monochrome
- [ ] Battery percentage from AXP2101
- [ ] Theme switch via BLE characteristic write
- [ ] `idf.py build` succeeds

---

## WCD-FW14: Sorcery Agent (Voice LLM + MCP Tools)

### Objective
Integrate the Sorcery AI agent on Node Zero. Voice input → LLM (cloud) → tool execution on BOTH Node Zero AND Spaceship Earth.

### Tasks

#### FW14.1 — Audio Pipeline (Capture + Opus Encode)
```yaml
action: CREATE
file: firmware/node-zero/main/audio_pipeline.cpp
```

```c
// Pipeline:
// INMP441 mic → I2S DMA → AEC → NS → AGC → Opus encode → WebSocket
//
// ES8311 speaker ← I2S DMA ← Opus decode ← WebSocket (TTS response)
//
// Opus config:
// - Sample rate: 16000 Hz
// - Frame size: 60ms (960 samples)
// - Bitrate: 48kbps
// - Complexity: 3 (balanced for ESP32-S3)
//
// AEC reference: ES8311 output fed back to AEC algorithm
// This prevents the agent from hearing its own voice
//
// DMA buffers: INTERNAL SRAM only (not PSRAM — cache miss = pops)
```

---

#### FW14.2 — Sorcery WebSocket Protocol
```yaml
action: CREATE
file: firmware/node-zero/main/sorcery_protocol.cpp
```

```c
// Connect to Sorcery endpoint (from NVS or hardcoded):
// wss://api.phosphorus31.org/sorcery
//
// Handshake:
// Headers:
//   Authorization: Bearer <sorcery_token>
//   X-Device-ID: <NODE ZERO MAC>
//   X-DID: <Ed25519 public key>
//
// Message types:
// DEVICE → SERVER:
//   { "type": "audio", "data": <base64 opus frame> }
//   { "type": "context", "state": { coherence, spoons, room, skin, battery } }
//
// SERVER → DEVICE:
//   { "type": "audio", "data": <base64 opus frame> }  // TTS
//   { "type": "text", "content": "..." }               // Text response
//   { "type": "mcp_call", "tool": "trigger_haptic", "args": { "effect_id": 14 } }
//   { "type": "mcp_call", "tool": "change_skin", "args": { "theme": "KIDS" } }
//
// MCP tools exposed to Sorcery:
// - trigger_haptic(effect_id): Local DRV2605L
// - set_backlight(brightness): AXP2101 / TCA9554
// - change_skin(theme): LVGL theme + forward to Spaceship Earth via BLE
// - get_battery_level(): AXP2101
// - get_imu_data(): QMI8658 snapshot
// - notify_spaceship(tool, args): Forward any tool call to Spaceship Earth
```

---

#### FW14.3 — MCP Tool Dispatcher
```yaml
action: CREATE
file: firmware/node-zero/main/mcp_dispatcher.cpp
```

```c
// Route incoming MCP tool calls to the correct subsystem:
typedef void (*mcp_handler_t)(const cJSON* args);

typedef struct {
    const char* name;
    mcp_handler_t handler;
} mcp_tool_t;

static const mcp_tool_t MCP_TOOLS[] = {
    { "trigger_haptic", handle_haptic },
    { "set_backlight", handle_backlight },
    { "change_skin", handle_skin },       // Local + forward to SE
    { "get_battery_level", handle_battery },
    { "get_imu_data", handle_imu },
    { "notify_spaceship", handle_forward }, // Relay to SE via BLE
};

// CRITICAL: Validate all inputs before execution
// - effect_id: 0-123 (DRV2605L library range)
// - theme: must match known enum
// - brightness: 0-100
// Rate limit: max 1 tool call per 2 seconds (match WCD-31 spec)
```

**Acceptance**: Voice command "make it vibrate" → Sorcery agent → MCP call → DRV2605L fires. Voice command "switch to kids mode" → theme change on BOTH Node Zero AND Spaceship Earth (via BLE forward).

---

#### FW14.4 — Wake Word + Voice Activity Detection
```yaml
action: MODIFY
file: firmware/node-zero/main/sorcery_protocol.cpp
```

```c
// Wake word: "Hey Sorcery" or configurable
// Use ESP-SR MultiNet for local wake word detection
// On wake: open WebSocket audio channel
// VAD: detect speech end → send end-of-utterance signal
// LED/Display feedback: LVGL mic icon pulses while listening
//
// Alternative: hardware button press to activate (simpler, more reliable)
// Button mapped via TCA9554 or touch event on LVGL mic button (FW13.2)
```

### WCD-FW14 Deliverables
- [ ] Full-duplex audio pipeline (mic → Opus → WS → Opus → speaker)
- [ ] AEC preventing self-hearing
- [ ] Sorcery WebSocket protocol with MCP tool support
- [ ] MCP dispatcher with input validation + 2s rate limit
- [ ] Wake word OR button activation
- [ ] Tool call forwarding to Spaceship Earth via BLE
- [ ] `idf.py build` succeeds

---

## WCD-FW15: Meshtastic Identity + Mesh Relay

### Objective
Configure the SX1262 LoRa transceiver for Meshtastic mesh networking. Node Zero becomes the mesh hub — messages hop through the 915 MHz network without internet.

### Tasks

#### FW15.1 — Meshtastic v2.5 Configuration
```yaml
action: MODIFY
file: firmware/node-zero/main/meshtastic_config.cpp
```

```c
// LoRa SX1262 on SPI bus (separate from QSPI display)
// Frequency: 915 MHz (US ISM band)
// Owner: "NODE ZERO" / "NZ"
// Channel: Default + P31-MESH (PSK encrypted)
//
// Broadcast: Ed25519 public key in BLE beacon
// Receive: Messages from other Node devices in mesh
//
// Integration with Spaceship Earth:
// - Meshtastic messages forwarded to Spaceship Earth via BLE
// - Spaceship Earth can send text messages via Node Zero → mesh
// - Mesh topology visualization data sent to Spaceship Earth for
//   Operator mode network graph rendering
```

---

#### FW15.2 — Mesh → BLE → Spaceship Earth Relay
```yaml
action: CREATE
file: firmware/node-zero/main/mesh_bridge.cpp
```

```c
// When a Meshtastic message arrives:
// 1. Parse sender ID, message content, hop count, RSSI
// 2. Forward to Spaceship Earth via BLE characteristic notification
// 3. If BLE disconnected: buffer locally (max 50 messages, ring buffer in NVS)
// 4. On BLE reconnect: flush buffer
//
// When Spaceship Earth sends text via BLE write:
// 1. Receive text content
// 2. Transmit via Meshtastic to mesh
// 3. Confirm delivery via BLE notification
```

### WCD-FW15 Deliverables
- [ ] Meshtastic configured with "NODE ZERO" identity
- [ ] P31-MESH channel with PSK encryption
- [ ] Bidirectional mesh ↔ BLE ↔ Spaceship Earth relay
- [ ] Message buffer for offline periods
- [ ] `idf.py build` succeeds

---

## WCD-FW16: Spaceship Earth Client Bridge (Web Side)

### Objective
Build the Spaceship Earth web-side integration that connects to Node Zero via Web Bluetooth. This is a **Sonnet/CC task**, not DeepSeek firmware.

### Agent: Sonnet/CC (primary)

### Tasks

#### FW16.1 — Web Bluetooth Service
```yaml
action: CREATE
file: spaceship-earth/src/services/nodeZeroBridge.ts
```

```typescript
// Web Bluetooth connection to Node Zero:
const P31_SERVICE_UUID = '31500000-7033-314c-cafe-ca9504630000';

class NodeZeroBridge {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();

  async connect(): Promise<void> {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'NODE ZERO' }],
      optionalServices: [P31_SERVICE_UUID],
    });
    this.server = await this.device.gatt!.connect();
    const service = await this.server.getPrimaryService(P31_SERVICE_UUID);
    // Cache all characteristics...
  }

  // Write state TO Node Zero:
  async writeCoherence(value: number): Promise<void> { /* ... */ }
  async writeSpoons(value: number): Promise<void> { /* ... */ }
  async writeRoom(room: string): Promise<void> { /* ... */ }
  async writeTheme(skin: string): Promise<void> { /* ... */ }
  async triggerHaptic(effectId: number): Promise<void> { /* ... */ }

  // Subscribe to notifications FROM Node Zero:
  onIMUData(callback: (data: Int16Array) => void): void { /* ... */ }
  onBattery(callback: (level: number) => void): void { /* ... */ }

  // Read DID:
  async readDID(): Promise<Uint8Array> { /* ... */ }
}

export const nodeZeroBridge = new NodeZeroBridge();
```

---

#### FW16.2 — State Sync Hook
```yaml
action: CREATE
file: spaceship-earth/src/hooks/useNodeZero.ts
```

```typescript
import { useEffect } from 'react';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import { useThemeStore } from '../stores/themeStore';
import { nodeZeroBridge } from '../services/nodeZeroBridge';

/**
 * Syncs Spaceship Earth state TO Node Zero.
 * Subscribes to store changes and writes via BLE.
 * Throttled to 10Hz max to match Node Zero update rate.
 */
export function useNodeZero() {
  useEffect(() => {
    // Subscribe to coherence changes
    const unsub1 = useSovereignStore.subscribe(
      (state) => state.coherence,
      (coherence) => nodeZeroBridge.writeCoherence(coherence),
    );

    // Subscribe to spoons changes
    const unsub2 = useSovereignStore.subscribe(
      (state) => state.spoons,
      (spoons) => nodeZeroBridge.writeSpoons(spoons),
    );

    // Subscribe to room changes
    const unsub3 = useSovereignStore.subscribe(
      (state) => state.activeRoom,
      (room) => nodeZeroBridge.writeRoom(room ?? 'cockpit'),
    );

    // Subscribe to theme changes
    const unsub4 = useThemeStore.subscribe(
      (state) => state.config.skin,
      (skin) => nodeZeroBridge.writeTheme(skin),
    );

    // Subscribe to IMU data FROM Node Zero
    nodeZeroBridge.onIMUData((data) => {
      // Feed to motion-based interactions in Spaceship Earth
      useSovereignStore.getState().updateIMU?.(data);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);
}
```

---

#### FW16.3 — Connection UI
```yaml
action: CREATE
file: spaceship-earth/src/components/ui/NodeZeroPanel.tsx
```

```typescript
// Top bar integration:
// - "Connect Node Zero" button (when disconnected)
// - Node Zero icon + battery level (when connected)
// - Tap to open detailed panel:
//   - Connection status (BLE/WebSocket/Offline)
//   - Battery level
//   - IMU data (if ?stats=1)
//   - Haptic test buttons
//   - Firmware version
//   - DID display
```

### WCD-FW16 Deliverables
- [ ] nodeZeroBridge.ts Web Bluetooth service
- [ ] useNodeZero.ts state sync hook
- [ ] NodeZeroPanel.tsx connection UI
- [ ] Coherence/spoons/room/theme sync verified on physical hardware
- [ ] IMU data streaming to Spaceship Earth
- [ ] Haptic trigger from Spaceship Earth UI
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass

---

## DEPENDENCY MATRIX

```
WCD-FW10 (Pin Fix) ──────> ALL other FW wcds (nothing works without stable silicon)
    │
    ├──> WCD-FW11 (Haptic)  ──> WCD-FW12 (BLE needs haptic for Posner Protocol)
    │                            │
    │                            ├──> WCD-FW13 (LVGL needs BLE for state sync)
    │                            │
    │                            └──> WCD-FW14 (Sorcery needs BLE for tool forwarding)
    │
    ├──> WCD-FW15 (Meshtastic) — independent, can parallel FW13-FW14
    │
    └──> WCD-FW16 (Web Bridge) — parallel with FW12-FW13, needs BLE GATT spec from FW12
```

---

## FILE MANIFEST

### New Files (Firmware — 12 files)
| WCD | File |
|-----|------|
| FW11 | `firmware/node-zero/main/haptic_manager.cpp` |
| FW11 | `firmware/node-zero/main/posner_protocol.cpp` |
| FW12 | `firmware/node-zero/main/ble_gatt_p31.cpp` |
| FW12 | `firmware/node-zero/main/ble_gatt_handlers.cpp` |
| FW12 | `firmware/node-zero/main/ws_bridge.cpp` |
| FW13 | `firmware/node-zero/main/lvgl_themes.cpp` |
| FW13 | `firmware/node-zero/main/ui_cockpit.cpp` |
| FW14 | `firmware/node-zero/main/audio_pipeline.cpp` |
| FW14 | `firmware/node-zero/main/sorcery_protocol.cpp` |
| FW14 | `firmware/node-zero/main/mcp_dispatcher.cpp` |
| FW15 | `firmware/node-zero/main/meshtastic_config.cpp` |
| FW15 | `firmware/node-zero/main/mesh_bridge.cpp` |

### New Files (Spaceship Earth Web — 3 files)
| WCD | File |
|-----|------|
| FW16 | `spaceship-earth/src/services/nodeZeroBridge.ts` |
| FW16 | `spaceship-earth/src/hooks/useNodeZero.ts` |
| FW16 | `spaceship-earth/src/components/ui/NodeZeroPanel.tsx` |

### Modified Files (Firmware — 6 files)
| WCD | File |
|-----|------|
| FW10 | `firmware/node-zero/main/display_manager.cpp` |
| FW10 | `firmware/node-zero/main/audio_hal.cpp` |
| FW10 | `firmware/node-zero/main/main.cpp` |
| FW10 | `firmware/node-zero/sdkconfig.defaults` |
| FW10 | `firmware/node-zero/main/ble_manager.cpp` |
| FW14 | `firmware/node-zero/main/sorcery_protocol.cpp` (wake word) |
