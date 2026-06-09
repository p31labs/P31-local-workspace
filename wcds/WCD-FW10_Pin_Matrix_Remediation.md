# WCD-FW10: Pin Matrix Remediation + Clean DMA Handoff
## P31 Labs · Node Zero · Physical Cockpit Foundation
## Issued: March 20, 2026 · Classification: SOULSAFE · Agent: DeepSeek

---

## Objective

Execute ALL six remediation directives from the March 19 architectural audit. This WCD is the foundation — nothing else works until the silicon-level bus contention is permanently resolved.

**CRITICAL**: The current firmware has QSPI pins mapped to GPIO 1-4 which conflicts with I2S audio. This must be fixed before any other subsystem can function.

---

## Global Hardware Constraints

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
```

---

## Tasks

### FW10.1 — QSPI Pin Matrix Correction

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/display_manager.cpp`

```c
// Replace ALL instances of QSPI pin definitions in display_manager.cpp:
// Current WRONG pins:
#define LCD_D0_PIN  GPIO_NUM_1  // WRONG - conflicts with I2S
#define LCD_D1_PIN  GPIO_NUM_2  // WRONG - conflicts with I2S
#define LCD_D2_PIN  GPIO_NUM_3  // WRONG - conflicts with I2S
#define LCD_D3_PIN  GPIO_NUM_4  // WRONG - conflicts with I2S

// CORRECT pins (GPIO 9-14):
#define LCD_CS_PIN   GPIO_NUM_9   // Verified schematic
#define LCD_CLK_PIN  GPIO_NUM_10  // Verified schematic
#define LCD_D0_PIN   GPIO_NUM_11  // CORRECTED - was GPIO 1
#define LCD_D1_PIN   GPIO_NUM_12  // CORRECTED - was GPIO 2
#define LCD_D2_PIN   GPIO_NUM_13  // CORRECTED - was GPIO 3
#define LCD_D3_PIN   GPIO_NUM_14  // CORRECTED - was GPIO 4

// Search entire codebase for any #define or constexpr referencing GPIO 1-4
// for display purposes. Eradicate all instances.
```

**Acceptance**: `idf.py build` succeeds. Display initializes without smashed text. Audio codec (ES8311) is no longer starved by QSPI DMA.

---

### FW10.2 — I2S_DOUT Migration to GPIO 40

**Action**: MODIFY  
**Files**:
- `firmware/maker-variant/main/audio_manager.cpp`
- `firmware/maker-variant/sdkconfig.defaults`

```c
// In audio_manager.cpp or audio_hal.cpp:
#define I2S_DOUT_PIN  GPIO_NUM_40  // CORRECTED - was GPIO_NUM_39
#define I2S_DIN_PIN   GPIO_NUM_2   // Verified schematic
#define I2S_BCLK_PIN  GPIO_NUM_3   // Verified schematic
#define I2S_LRCK_PIN  GPIO_NUM_4   // Verified schematic
#define I2S_MCLK_PIN  GPIO_NUM_5   // MUST be actively driven

// Use modern ESP-IDF v5.5 I2S API:
// i2s_channel_enable() — NOT deprecated legacy drivers
// DMA buffers in INTERNAL SRAM only:
#define DMA_BUF_SIZE  4096
// heap_caps_malloc(buf_size, MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA)
// NEVER place audio DMA buffers in PSRAM (cache miss → audible pops)
```

**Note**: GPIO 40 migration sacrifices the hardware Tearing Effect (TE) line. Display sync must use software DMA callbacks (FW10.3). Physical bodge wire may be required to bridge GPIO 40 pad to ES8311 DIN if the default GPIO 1 routing doesn't carry through the IO MUX remap.

**Acceptance**: Audio plays clean tone through ES8311. No pops, clicks, or distortion. No interference with display rendering.

---

### FW10.3 — Asynchronous DMA Handoff (Software TE Replacement)

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/display_manager.cpp`

```c
// CRITICAL ARCHITECTURE:
// 1. Allocate frame buffers in DMA-capable PSRAM:
static uint16_t *dma_buf1 = NULL;
static uint16_t *dma_buf2 = NULL;

// In display_manager_init():
#define CHUNK_LINES 20
#define CHUNK_BYTES (LCD_H_RES * CHUNK_LINES * sizeof(uint16_t))
dma_buf1 = (uint16_t *)heap_caps_malloc(CHUNK_BYTES, MALLOC_CAP_DMA | MALLOC_CAP_SPIRAM);
dma_buf2 = (uint16_t *)heap_caps_malloc(CHUNK_BYTES, MALLOC_CAP_DMA | MALLOC_CAP_SPIRAM);

// If MALLOC_CAP_DMA omitted → ESP-IDF silently creates internal bounce
// buffer → CPU blocks → UI freezes → smashed text returns.

// 2. Register on_color_trans_done callback (NOT hardware TE):
static bool flush_complete_callback(
    esp_lcd_panel_io_handle_t panel_io,
    esp_lcd_panel_io_event_data_t *edata,
    void *user_ctx
) {
    lv_disp_drv_t *disp_drv = (lv_disp_drv_t *)user_ctx;
    lv_disp_flush_ready(disp_drv);
    return false; // No high-priority task woken
}

// In esp_lcd_panel_io_config_t:
.on_color_trans_done = flush_complete_callback,

// 3. In LVGL flush function:
static void disp_flush(lv_disp_drv_t *disp_drv, const lv_area_t *area, lv_color_t *color_p) {
    uint16_t *spiram_buf = (uint16_t *)color_p;
    bool use_buf1 = true;
    
    for (int y = area->y1; y <= area->y2; y += CHUNK_LINES) {
        int lines = (y + CHUNK_LINES <= area->y2 + 1) ? CHUNK_LINES : (area->y2 + 1 - y);
        uint16_t *current_dma_buf = use_buf1 ? dma_buf1 : dma_buf2;
        
        memcpy(current_dma_buf, spiram_buf, LCD_H_RES * lines * 2);
        esp_lcd_panel_draw_bitmap(panel_handle, 0, y, LCD_H_RES, y + lines, current_dma_buf);
        
        spiram_buf += (LCD_H_RES * lines);
        use_buf1 = !use_buf1;
        vTaskDelay(1); // Yield to allow DMA to run
    }
    // DO NOT call lv_disp_flush_ready() here
    // DO NOT block or wait
    // Return immediately — let DMA run autonomously
}

// 4. In flush_complete_callback (ISR context):
// This is the ONLY place flush_ready is called
// The DMA → QSPI transfer is complete, memory is safe to overwrite
```

**Acceptance**: Display renders at stable 30+ FPS. No tearing. No smashed text. CPU is free during DMA transfer (verified by measuring lv_timer_handler execution time < 5ms).

---

### FW10.4 — Color Endianness Fix

**Action**: MODIFY  
**File**: `firmware/maker-variant/sdkconfig.defaults`

```
# Already present - verify:
CONFIG_LV_COLOR_16_SWAP=y
```

**Acceptance**: Red renders as red. Blue renders as blue. P31 brand colors (#00FF88 Phosphor Green, #7A27FF Quantum Violet) display correctly on the physical screen.

---

### FW10.5 — Boot Sequence Enforcement

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/main.cpp`

```c
// STRICT temporal initialization order:
// Execute in this exact sequence - no parallelization, no reordering

void app_main(void) {
    ESP_LOGI(TAG, "Phenix Navigator: Initializing Sovereign Node Zero...");
    
    // Phase 1: I2C bus (MUST be first - all peripherals depend on it)
    i2c_master_init(GPIO_NUM_8, GPIO_NUM_7, 400000);  // SDA, SCL, freq
    
    // Phase 2: Power management (voltage rails stable before any peripheral)
    axp2101_init();  // AXP2101 PMIC - powers all rails
    
    // Phase 3: IO expander + LCD hardware reset
    tca9554_init(0x20);
    tca9554_set_direction(0x00, 0x07);  // P0-P2 output, P3-P7 input
    tca9554_write(0x00);     // LCD_RST LOW (P0)
    vTaskDelay(pdMS_TO_TICKS(100));  // Capacitor discharge
    tca9554_write(0x07);     // LCD_RST HIGH (P0) + backlight ON (P2)
    
    // Phase 4: Display (QSPI on GPIO 9-14) - AFTER reset sequence complete
    display_manager_init();  // Uses corrected GPIO 11-14 pins
    lvgl_init();
    
    // Phase 5: Audio (I2S on GPIO 1-5, DOUT on GPIO 40) - AFTER display
    audio_hal_init();
    es8311_init(0x18);  // ES8311 I2C address
    
    // Phase 6: Haptic (I2C) - AFTER audio, shares I2C bus
    drv2605l_init(0x5A);  // DRV2605L I2C address
    
    // Phase 7: Sensors (I2C) - AFTER haptic, shares I2C bus
    qmi8658_init(0x6B);  // QMI8658 I2C address
    
    // Phase 8: Identity - AFTER all peripherals initialized
    genesis_block_init();  // Ed25519 from eFuse
    
    // Phase 9: Connectivity - AFTER identity for secure channels
    wifi_init();
    ble_init("NODE ZERO");
    meshtastic_init("NODE ZERO");
    
    // Phase 10: Application - LAST, all infrastructure ready
    sorcery_agent_init();
    spaceship_bridge_init();
    
    // Main loop
    while (1) {
        uint32_t delay = lv_timer_handler();
        vTaskDelay(pdMS_TO_TICKS(delay > 0 ? delay : 1));
    }
}
```

**Acceptance**: Clean boot from cold power-on. No black screen. No initialization race conditions. All peripherals respond to I2C scan.

---

### FW10.6 — Device Identity Assertion

**Action**: MODIFY  
**Files**:
- `firmware/maker-variant/sdkconfig.defaults`
- `firmware/maker-variant/main/ble_manager.cpp` (create if missing)
- `firmware/maker-variant/main/main.cpp`

```c
// In sdkconfig.defaults:
CONFIG_LWIP_LOCAL_HOSTNAME="NODE-ZERO"

// In ble_manager.cpp (create if missing):
#include "esp_bt.h"
#include "esp_gap_ble_api.h"

void ble_init(const char* device_name) {
    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_bt_controller_init(&bt_cfg));
    ESP_ERROR_CHECK(esp_bt_controller_enable(ESP_BT_MODE_BLE));
    
    esp_ble_gap_set_device_name(device_name);
    // ... rest of BLE initialization
}

// In main.cpp (mDNS):
#include "mdns.h"

void mdns_init(void) {
    ESP_ERROR_CHECK(mdns_init());
    mdns_hostname_set("node-zero");
    mdns_service_add("NODE ZERO", "_phenix", "_tcp", 80, NULL, 0);
    mdns_service_add("NODE ZERO", "_p31", "_tcp", 80, NULL, 0);
}

// Meshtastic config (in lora_manager or meshtastic config):
// owner.long_name = "NODE ZERO";
// owner.short_name = "NZ";
```

**Acceptance**: `nmap -sP` shows "NODE-ZERO" on local network. BLE scan shows "NODE ZERO". Meshtastic mesh shows "NODE ZERO" / "NZ". mDNS resolves `node-zero.local`.

---

## Deliverables

- [ ] QSPI pins corrected to GPIO 9-14 (zero references to GPIO 1-4 for display)
- [ ] I2S_DOUT on GPIO 40 with MCLK actively driven on GPIO 5
- [ ] Async DMA handoff with on_color_trans_done callback
- [ ] CONFIG_LV_COLOR_16_SWAP=y (color endianness)
- [ ] Boot sequence enforced (I2C → PMIC → IO expander → display → audio → haptic → sensors → identity → connectivity)
- [ ] Device identity "NODE ZERO" across LwIP, BLE, mDNS, Meshtastic
- [ ] `idf.py build` succeeds with zero errors
- [ ] Physical verification: display clean, audio clean, no smashed text

---

## Dependencies

- **Prerequisites**: None (this is the foundation)
- **Blocked by**: None
- **Blocks**: FW11 (DRV2605L), FW12 (BLE), FW13 (LVGL UI), FW14 (Sorcery), FW15 (Meshtastic)

---

## Notes

- The QSPI pin conflict was discovered during the March 19 architectural audit
- GPIO 1-4 are used by I2S audio codec - using them for QSPI causes bus contention
- The software TE callback replaces the hardware TE line sacrificed by GPIO 40 migration
- This WCD must complete before any other firmware work can proceed

---

## Agent Assignment

**Primary**: DeepSeek (ESP32 C/C++, hardware registers, I2C/SPI protocols)  
**Support**: Sonnet/CC (review, integration testing)  
**Verification**: Opus (independent verification of pin mappings)
