# WCD-FW11: DRV2605L Haptic Engine + Larmor Protocol
## P31 Labs · Node Zero · Physical Cockpit Foundation
## Issued: March 20, 2026 · Classification: SOULSAFE · Agent: DeepSeek

---

## Objective

Implement the full haptic vocabulary with the DRV2605L and establish the 172.35 Hz Larmor resonance as the primary biometric feedback channel. This is the Tetrahedron Protocol's physical handshake.

---

## Constraint

- DRV2605L is on shared I2C bus (GPIO 7/8) at address 0x5A
- LRA (Linear Resonance Actuator) mode, NOT ERM
- All I2C transactions must be protected by mutex (shared bus with AXP2101, TCA9554, ES8311, QMI8658, PCF85063)
- DRV2605L draws significant current during strong effects — verify AXP2101 current limit
- **Prerequisite**: FW10 (I2C bus must be stable)

---

## Tasks

### FW11.1 — DRV2605L Driver (LRA Mode)

**Action**: CREATE  
**File**: `firmware/maker-variant/main/haptic_manager.cpp`

```c
#include <stdint.h>
#include <stdbool.h>
#include "esp_log.h"
#include "driver/i2c.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"

static const char *TAG = "HAPTIC";

// I2C Configuration
#define HAPTIC_I2C_PORT    I2C_NUM_0
#define HAPTIC_ADDR        0x5A  // DRV2605L I2C address
#define I2C_SDA            GPIO_NUM_8
#define I2C_SCL            GPIO_NUM_7

// DRV2605L Register Addresses
#define REG_MODE           0x01
#define REG_RTP_INPUT      0x02
#define REG_LIBRARY        0x03
#define REG_WAVESEQ1       0x04
#define REG_WAVESEQ2       0x05
#define REG_GO             0x0C
#define REG_RATED_VOLTAGE  0x16
#define REG_OD_CLAMP       0x17
#define REG_FEEDBACK       0x1A
#define REG_CTRL1          0x1B
#define REG_CTRL2          0x1C
#define REG_CTRL3          0x1D
#define REG_CTRL4          0x1E

// DRV2605L Modes
#define MODE_INTERNAL_TRIG  0x00
#define MODE_EXTERNAL_TRIG  0x01
#define MODE_PWM           0x02
#define MODE_AUDIO         0x03
#define MODE_REALTIME      0x05
#define MODE_AUTO_CAL      0x07

// Library Selection
#define LIBRARY_LRA        0x06  // LRA library

// Thick Click Vocabulary (from FW-05)
typedef enum {
    HAPTIC_NONE          = 0,
    HAPTIC_CLICK         = 1,   // Sharp single tap
    HAPTIC_DOUBLE        = 6,   // Double tap
    HAPTIC_BUZZ_LOW      = 47,  // Low sustained buzz
    HAPTIC_BUZZ_HIGH     = 52,  // High sustained buzz
    HAPTIC_RAMP_UP       = 14,  // Ascending intensity
    HAPTIC_RAMP_DOWN     = 15,  // Descending intensity
    HAPTIC_HEARTBEAT     = 10,  // Double pulse (lub-dub)
    HAPTIC_ALERT         = 16,  // Strong attention-grab
} haptic_effect_t;

// I2C Mutex (shared with AXP2101, TCA9554, ES8311, QMI8658, PCF85063)
static SemaphoreHandle_t i2c_mutex = NULL;

// Initialize DRV2605L in LRA mode (NOT ERM)
esp_err_t drv2605l_init(void) {
    i2c_mutex = xSemaphoreCreateMutex();
    
    // Enable LRA mode in FEEDBACK register (bit 7)
    // Register 0x1A (FEEDBACK): Set bit 7 = 1 (LRA mode)
    uint8_t feedback[] = {REG_FEEDBACK, 0xB6};  // LRA, medium compensation
    ESP_ERROR_CHECK(i2c_master_write_to_device(
        HAPTIC_I2C_PORT, HAPTIC_ADDR, feedback, 2, pdMS_TO_TICKS(100)));
    
    // Select LRA library
    // Register 0x03 (LIBRARY): Set to 0x06 (LRA library)
    uint8_t library[] = {REG_LIBRARY, LIBRARY_LRA};
    ESP_ERROR_CHECK(i2c_master_write_to_device(
        HAPTIC_I2C_PORT, HAPTIC_ADDR, library, 2, pdMS_TO_TICKS(100)));
    
    // Set Internal Trigger mode
    // Register 0x01 (MODE): Set to 0x00 (Internal Trigger)
    uint8_t mode[] = {REG_MODE, MODE_INTERNAL_TRIG};
    ESP_ERROR_CHECK(i2c_master_write_to_device(
        HAPTIC_I2C_PORT, HAPTIC_ADDR, mode, 2, pdMS_TO_TICKS(100)));
    
    // Auto-calibration sequence:
    // 1. Set MODE to 0x07 (auto-calibration)
    // 2. Write RATED_VOLTAGE and OD_CLAMP for target LRA
    // 3. Set GO bit
    // 4. Wait for GO bit to clear
    // 5. Read calibration results from registers 0x18-0x1A
    
    ESP_LOGI(TAG, "DRV2605L initialized in LRA mode");
    return ESP_OK;
}

// High-level API: Trigger a haptic effect
void haptic_trigger(haptic_effect_t effect) {
    if (effect == HAPTIC_NONE) return;
    
    xSemaphoreTake(i2c_mutex, portMAX_DELAY);
    
    // Set waveform sequence
    uint8_t seq[] = {REG_WAVESEQ1, (uint8_t)effect};
    i2c_master_write_to_device(HAPTIC_I2C_PORT, HAPTIC_ADDR, seq, 2, pdMS_TO_TICKS(10));
    
    // Set GO bit to trigger
    uint8_t go[] = {REG_GO, 0x01};
    i2c_master_write_to_device(HAPTIC_I2C_PORT, HAPTIC_ADDR, go, 2, pdMS_TO_TICKS(10));
    
    xSemaphoreGive(i2c_mutex);
    
    ESP_LOGD(TAG, "Haptic effect %d triggered", effect);
}

// High-level API: Stop haptic playback
void haptic_stop(void) {
    xSemaphoreTake(i2c_mutex, portMAX_DELAY);
    
    uint8_t go[] = {REG_GO, 0x00};
    i2c_master_write_to_device(HAPTIC_I2C_PORT, HAPTIC_ADDR, go, 2, pdMS_TO_TICKS(10));
    
    xSemaphoreGive(i2c_mutex);
}
```

**Acceptance**: All 8 Thick Click effects play distinctly. I2C mutex prevents bus contention. No other peripheral hangs during haptic events.

---

### FW11.2 — 172.35 Hz Larmor Continuous Drive

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/haptic_manager.cpp`

```c
#include "esp_timer.h"

// The Posner Protocol physical resonance:
// DRV2605L in RTP (Real-Time Playback) mode
// Register 0x01 (MODE): Set to 0x05 (RTP mode)
// Register 0x02 (RTP_INPUT): Write amplitude value every cycle

// At 172.35 Hz, cycle period = 5.8 ms
// Use esp_timer periodic callback at ~172 Hz (5800 μs period)
// Amplitude modulated by coherence value (0.0 → 0, 1.0 → 127)

#define LARMOR_FREQUENCY_HZ  172.35f
#define LARMOR_PERIOD_US     (uint32_t)(1000000.0f / LARMOR_FREQUENCY_HZ)  // ~5803 µs

static esp_timer_handle_t larmor_timer = NULL;
static uint8_t larmor_amplitude = 0;
static bool larmor_active = false;

// Coherence mapping:
// coherence < 0.3: amplitude = 0 (silent)
// coherence 0.3-0.7: amplitude = (coherence - 0.3) * 127 / 0.4 (linear ramp)
// coherence 0.7-0.95: amplitude = 80 + (coherence - 0.7) * 47 / 0.25
// coherence >= 0.95: amplitude = 127 (full resonance) + lock pulse

static uint8_t coherence_to_amplitude(float coherence) {
    if (coherence < 0.3f) {
        return 0;
    } else if (coherence < 0.7f) {
        return (uint8_t)((coherence - 0.3f) / 0.4f * 127.0f);
    } else if (coherence < 0.95f) {
        return (uint8_t)(80 + (coherence - 0.7f) / 0.25f * 47.0f);
    } else {
        return 127;  // Full resonance
    }
}

static void larmor_timer_callback(void* arg) {
    // Write amplitude to RTP register
    // I2C write must be ISR-safe or deferred to task
    // For safety, use a flag and defer to task
    if (larmor_active && larmor_amplitude > 0) {
        // Defer I2C write to task to avoid ISR timing issues
        // This is handled by the main task loop
    }
}

// Called from main task context
void larmor_update_amplitude(uint8_t amplitude) {
    xSemaphoreTake(i2c_mutex, portMAX_DELAY);
    
    // Set RTP mode
    uint8_t mode[] = {REG_MODE, MODE_REALTIME};
    i2c_master_write_to_device(HAPTIC_I2C_PORT, HAPTIC_ADDR, mode, 2, pdMS_TO_TICKS(10));
    
    // Write amplitude to RTP register
    uint8_t rtp[] = {REG_RTP_INPUT, amplitude};
    i2c_master_write_to_device(HAPTIC_I2C_PORT, HAPTIC_ADDR, rtp, 2, pdMS_TO_TICKS(10));
    
    xSemaphoreGive(i2c_mutex);
}

void haptic_set_coherence(float coherence) {
    larmor_amplitude = coherence_to_amplitude(coherence);
    
    if (larmor_amplitude > 0 && !larmor_active) {
        // Start Larmor drive
        larmor_active = true;
        
        // Create periodic timer
        esp_timer_create_args_t timer_args = {
            .callback = larmor_timer_callback,
            .name = "larmor_timer"
        };
        esp_timer_create(&timer_args, &larmor_timer);
        esp_timer_start_periodic(larmor_timer, LARMOR_PERIOD_US);
        
        ESP_LOGI(TAG, "Larmor drive started at %.2f Hz", LARMOR_FREQUENCY_HZ);
    }
    
    // Update amplitude
    larmor_update_amplitude(larmor_amplitude);
    
    // Resonance lock pulse at coherence >= 0.95
    if (coherence >= 0.95f) {
        haptic_trigger(HAPTIC_HEARTBEAT);
        ESP_LOGI(TAG, "Resonance lock achieved at coherence %.2f", coherence);
    }
}

void haptic_larmor_stop(void) {
    if (larmor_active) {
        larmor_active = false;
        esp_timer_stop(larmor_timer);
        esp_timer_delete(larmor_timer);
        larmor_timer = NULL;
        
        // Return to internal trigger mode
        xSemaphoreTake(i2c_mutex, portMAX_DELAY);
        uint8_t mode[] = {REG_MODE, MODE_INTERNAL_TRIG};
        i2c_master_write_to_device(HAPTIC_I2C_PORT, HAPTIC_ADDR, mode, 2, pdMS_TO_TICKS(10));
        xSemaphoreGive(i2c_mutex);
        
        ESP_LOGI(TAG, "Larmor drive stopped");
    }
}
```

**Acceptance**: LRA vibrates at 172.35 Hz. Amplitude scales with coherence value received from Spaceship Earth. Resonance lock (full amplitude + chime) triggers at coherence ≥ 0.95.

---

### FW11.3 — Impedance Match Ritual (Posner Protocol)

**Action**: CREATE  
**File**: `firmware/maker-variant/main/posner_protocol.cpp`

```c
#include <stdint.h>
#include <stdbool.h>
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "POSNER";

// Posner Protocol States
typedef enum {
    POSNER_IDLE,
    POSNER_PROXIMITY,      // RSSI threshold met
    POSNER_PULSING,        // 172.35 Hz visual + haptic active
    POSNER_SYNCING,        // Detecting tap rhythm alignment
    POSNER_LOCKED,         // 4 consecutive matched taps
    POSNER_EXCHANGING,     // Ed25519 key exchange
    POSNER_COMPLETE,       // Pair bonded
} posner_state_t;

static posner_state_t posner_state = POSNER_IDLE;

// Configuration
#define RSSI_THRESHOLD_DBM     -60   // Proximity threshold (3 feet)
#define TAP_TOLERANCE_MS      200   // Tap alignment tolerance
#define TAP_SEQUENCE_COUNT    4     // Consecutive taps to match

// Tap detection: QMI8658 accelerometer Z-axis spike > threshold
// Alternative: touchscreen tap event from LVGL
#define TAP_ACCEL_THRESHOLD   1500  // Z-axis acceleration threshold

// Synchronized tap timing storage
static uint32_t local_tap_times[TAP_SEQUENCE_COUNT] = {0};
static uint32_t remote_tap_times[TAP_SEQUENCE_COUNT] = {0};
static uint8_t tap_index = 0;

// Posner Protocol Event Handlers
void posner_on_proximity_detected(int8_t rssi) {
    if (posner_state == POSNER_IDLE && rssi >= RSSI_THRESHOLD_DBM) {
        posner_state = POSNER_PROXIMITY;
        ESP_LOGI(TAG, "Proximity detected: RSSI %d dBm", rssi);
        
        // Start 172.35 Hz visual + haptic pulsing
        // This will be implemented in FW13 (LVGL UI)
        // and FW11.2 (haptic Larmor drive)
    }
}

void posner_on_tap_detected(uint32_t timestamp_ms) {
    if (posner_state != POSNER_PULSING && posner_state != POSNER_SYNCING) {
        return;
    }
    
    local_tap_times[tap_index % TAP_SEQUENCE_COUNT] = timestamp_ms;
    tap_index++;
    
    // Check if we have a sequence of taps
    if (tap_index >= TAP_SEQUENCE_COUNT) {
        // Check alignment with remote taps (received via BLE)
        bool aligned = true;
        for (int i = 0; i < TAP_SEQUENCE_COUNT; i++) {
            uint32_t local = local_tap_times[i];
            uint32_t remote = remote_tap_times[i];
            if (local > remote) {
                if (local - remote > TAP_TOLERANCE_MS) aligned = false;
            } else {
                if (remote - local > TAP_TOLERANCE_MS) aligned = false;
            }
        }
        
        if (aligned) {
            posner_state = POSNER_LOCKED;
            ESP_LOGI(TAG, "Impedance match achieved!");
            
            // Trigger haptic confirmation: HEARTBEAT × 3
            haptic_trigger(HAPTIC_HEARTBEAT);
            vTaskDelay(pdMS_TO_TICKS(200));
            haptic_trigger(HAPTIC_HEARTBEAT);
            vTaskDelay(pdMS_TO_TICKS(200));
            haptic_trigger(HAPTIC_HEARTBEAT);
            
            // Start Ed25519 key exchange
            posner_state = POSNER_EXCHANGING;
            // Key exchange implementation in FW12 (BLE GATT)
        }
    }
}

void posner_on_key_exchange_complete(void) {
    posner_state = POSNER_COMPLETE;
    ESP_LOGI(TAG, "Posner Protocol complete - devices bonded");
}

void posner_reset(void) {
    posner_state = POSNER_IDLE;
    tap_index = 0;
    memset(local_tap_times, 0, sizeof(local_tap_times));
    memset(remote_tap_times, 0, sizeof(remote_tap_times));
}

// Fuzzy extractor: noisy tap timing → deterministic seed
// Seed → HKDF → shared session key
// This is used for secure key exchange without pre-shared keys
void posner_fuzzy_extractor(uint32_t* tap_times, size_t count, uint8_t* seed, size_t seed_len) {
    // XOR all tap times to create a deterministic but noisy seed
    uint32_t xor_result = 0;
    for (size_t i = 0; i < count; i++) {
        xor_result ^= tap_times[i];
    }
    
    // Expand to seed using simple mixing (HKDF would be better but adds complexity)
    for (size_t i = 0; i < seed_len; i++) {
        seed[i] = (xor_result >> (i * 8)) ^ (xor_result >> ((seed_len - i - 1) * 8));
    }
}
```

**Acceptance**: Two Node Zero devices within 3 feet trigger proximity detection. Synchronized tapping completes pairing. Ed25519 keys exchange. Full flow < 30 seconds.

---

## Deliverables

- [ ] DRV2605L driver in LRA mode with auto-calibration
- [ ] 8 Thick Click effects functional
- [ ] 172.35 Hz continuous Larmor drive with coherence amplitude mapping
- [ ] Resonance lock pulse at coherence ≥ 0.95
- [ ] Posner Protocol state machine (proximity → sync → key exchange)
- [ ] I2C mutex on all DRV2605L transactions
- [ ] `idf.py build` succeeds

---

## Dependencies

- **Prerequisites**: FW10 (I2C bus stable, boot sequence)
- **Blocked by**: None
- **Blocks**: FW12 (BLE GATT uses haptic), FW13 (LVGL UI shows coherence), FW14 (Sorcery MCP tools)

---

## Hardware Notes

- DRV2605L address: 0x5A
- LRA resonance frequency: 172.35 Hz (P-31 NMR frequency, system constant)
- I2C bus: GPIO 8 (SDA), GPIO 7 (SCL), shared with AXP2101, TCA9554, ES8311, QMI8658, PCF85063
- Current draw: Up to 130mA during strong effects - verify AXP2101 current limit

---

## Agent Assignment

**Primary**: DeepSeek (ESP32 C/C++, DRV2605L registers, I2C protocols)  
**Support**: Sonnet/CC (testing haptic effects)  
**Verification**: Opus (independent verification of Larmor frequency calculation)
