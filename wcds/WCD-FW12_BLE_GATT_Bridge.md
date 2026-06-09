# WCD-FW12: BLE GATT Bridge (Node Zero ↔ Spaceship Earth)
## P31 Labs · Node Zero · Physical Cockpit Foundation
## Issued: March 20, 2026 · Classification: SOULSAFE · Agent: DeepSeek

---

## Objective

Establish the bidirectional data channel between Node Zero (firmware) and Spaceship Earth (web PWA). This is the nervous system connecting the physical and digital cockpits.

---

## Architecture

```
Node Zero (BLE Peripheral)          Spaceship Earth (BLE Central)
───────────────────────            ──────────────────────────────
GATT Server                         Web Bluetooth API
├── P31 Service (UUID: custom)      navigator.bluetooth.requestDevice()
│   ├── Coherence (notify)     ←──  Writes coherence value
│   ├── Spoons (notify)        ←──  Writes spoon level
│   ├── Room (notify)          ←──  Writes active room ID
│   ├── Theme (notify)         ←──  Writes skin enum
│   ├── IMU Data (notify)     ──→  Reads 6-axis data
│   ├── Battery (notify)       ──→  Reads AXP2101 level
│   ├── Haptic Cmd (write)     ←──  Triggers haptic effect
│   └── DID (read)             ──→  Ed25519 public key
```

---

## GATT Service Definition

**Custom P31 Service UUID**: `31500000-7033-314c-cafe-ca9504630000`
- Encodes: P31 Labs + Ca₉(PO₄)₆ + Posner molecule

**Direction**:
- Spaceship Earth WRITES to: coherence, spoons, room, theme, haptic_cmd
- Spaceship Earth READS from: imu, battery, did
- Node Zero NOTIFIES: imu (10Hz), battery (0.1Hz)

---

## Tasks

### FW12.1 — GATT Service Definition

**Action**: CREATE  
**File**: `firmware/maker-variant/main/ble_gatt_p31.cpp`

```c
#include <stdint.h>
#include <string.h>
#include "esp_log.h"
#include "esp_gatts_api.h"
#include "esp_gap_ble_api.h"
#include "esp_bt.h"
#include "esp_gatt_common.h"

static const char *TAG = "BLE_P31";

// P31 Service UUID: 31500000-P31L-4ABS-CAFE-CA9PO4630000
// (Encodes: P31 Labs + Ca₉(PO₄)₆ + Posner molecule)
#define P31_SERVICE_UUID        0x31500000, 0x7033, 0x314c, 0xcafe, 0xca9504630000

// Characteristic UUIDs
#define CHAR_COHERENCE_UUID     0x31500001, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // float32, notify
#define CHAR_SPOONS_UUID        0x31500002, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // uint8, notify
#define CHAR_ROOM_UUID          0x31500003, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // utf8 string, notify
#define CHAR_THEME_UUID         0x31500004, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // utf8 string, notify
#define CHAR_IMU_UUID           0x31500005, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // 12 bytes (6×int16), notify
#define CHAR_BATTERY_UUID       0x31500006, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // uint8 (0-100), notify
#define CHAR_HAPTIC_CMD_UUID    0x31500007, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // uint8 (effect ID), write
#define CHAR_DID_UUID           0x31500008, 0x7033, 0x314c, 0xcafe, 0xca9504630000  // 32 bytes (Ed25519 pubkey), read

// Service and characteristic handles
static uint16_t p31_service_handle = 0;
static uint16_t char_coherence_handle = 0;
static uint16_t char_spoons_handle = 0;
static uint16_t char_room_handle = 0;
static uint16_t char_theme_handle = 0;
static uint16_t char_imu_handle = 0;
static uint16_t char_battery_handle = 0;
static uint16_t char_haptic_cmd_handle = 0;
static uint16_t char_did_handle = 0;

// Current values
static float current_coherence = 0.0f;
static uint8_t current_spoons = 100;
static char current_room[32] = "observatory";
static char current_theme[32] = "default";
static uint8_t current_battery = 100;
static uint8_t ed25519_pubkey[32] = {0};  // Populated from SE050

// GATT event handler
static void gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, 
                                 esp_ble_gatts_cb_param_t *param) {
    switch (event) {
        case ESP_GATTS_REG_EVT:
            ESP_LOGI(TAG, "GATT server registered");
            break;
            
        case ESP_GATTS_CREATE_EVT:
            p31_service_handle = param->create.service_handle;
            ESP_LOGI(TAG, "Service created, handle: %d", p31_service_handle);
            // Add characteristics here
            break;
            
        case ESP_GATTS_CONNECT_EVT:
            ESP_LOGI(TAG, "Client connected, conn_id: %d", param->connect.conn_id);
            // Start advertising
            break;
            
        case ESP_GATTS_DISCONNECT_EVT:
            ESP_LOGI(TAG, "Client disconnected");
            // Restart advertising
            break;
            
        case ESP_GATTS_WRITE_EVT:
            // Handle characteristic writes from Spaceship Earth
            if (param->write.handle == char_haptic_cmd_handle) {
                uint8_t effect_id = param->write.value[0];
                haptic_trigger((haptic_effect_t)effect_id);
                ESP_LOGI(TAG, "Haptic command received: %d", effect_id);
            }
            break;
            
        default:
            break;
    }
}

// Initialize BLE GATT server with P31 service
esp_err_t ble_gatt_p31_init(void) {
    esp_err_t ret;
    
    // Initialize BLE controller
    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    ret = esp_bt_controller_init(&bt_cfg);
    if (ret) {
        ESP_LOGE(TAG, "BT controller init failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = esp_bt_controller_enable(ESP_BT_MODE_BLE);
    if (ret) {
        ESP_LOGE(TAG, "BT controller enable failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Initialize Bluedroid
    ret = esp_bluedroid_init();
    if (ret) {
        ESP_LOGE(TAG, "Bluedroid init failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = esp_bluedroid_enable();
    if (ret) {
        ESP_LOGE(TAG, "Bluedroid enable failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Register GATT callbacks
    ret = esp_ble_gatts_register_callback(gatts_event_handler);
    if (ret) {
        ESP_LOGE(TAG, "GATT callback register failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Register application
    ret = esp_ble_gatts_app_register(0);
    if (ret) {
        ESP_LOGE(TAG, "GATT app register failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ESP_LOGI(TAG, "BLE GATT P31 service initialized");
    return ESP_OK;
}
```

---

### FW12.2 — Characteristic Handlers

**Action**: CREATE  
**File**: `firmware/maker-variant/main/ble_gatt_handlers.cpp`

```c
#include <stdint.h>
#include <string.h>
#include "esp_log.h"
#include "esp_gatts_api.h"

// External references
extern float current_coherence;
extern uint8_t current_spoons;
extern char current_room[32];
extern char current_theme[32];
extern uint8_t current_battery;

// Forward declarations
extern void haptic_set_coherence(float value);
extern void haptic_trigger(haptic_effect_t effect);
extern void lvgl_update_coherence(float value);
extern void lvgl_update_spoons(uint8_t value);
extern void lvgl_update_room(const char* room);
extern void lvgl_update_theme(const char* theme);

// On coherence write from Spaceship Earth:
void on_coherence_write(float value) {
    current_coherence = value;
    
    // Update haptic amplitude via FW11.2
    haptic_set_coherence(value);
    
    // Update LVGL coherence gauge (FW13)
    lvgl_update_coherence(value);
    
    ESP_LOGI(TAG, "Coherence updated: %.2f", value);
}

// On spoons write:
void on_spoons_write(uint8_t value) {
    current_spoons = value;
    
    // Update LVGL spoon gauge (FW13)
    lvgl_update_spoons(value);
    
    ESP_LOGI(TAG, "Spoons updated: %d", value);
}

// On room write:
void on_room_write(const char* room) {
    strncpy(current_room, room, sizeof(current_room) - 1);
    current_room[sizeof(current_room) - 1] = '\0';
    
    // Update LVGL room display (FW13)
    lvgl_update_room(room);
    
    ESP_LOGI(TAG, "Room updated: %s", room);
}

// On theme write:
void on_theme_write(const char* theme) {
    strncpy(current_theme, theme, sizeof(current_theme) - 1);
    current_theme[sizeof(current_theme) - 1] = '\0';
    
    // Update LVGL theme (FW13)
    lvgl_update_theme(theme);
    
    ESP_LOGI(TAG, "Theme updated: %s", theme);
}

// On haptic command write:
void on_haptic_cmd_write(uint8_t effect_id) {
    haptic_trigger((haptic_effect_t)effect_id);
    ESP_LOGI(TAG, "Haptic cmd: %d", effect_id);
}

// Send IMU notification to Spaceship Earth
void ble_send_imu_data(int16_t ax, int16_t ay, int16_t az, 
                        int16_t gx, int16_t gy, int16_t gz) {
    uint8_t imu_data[12];
    
    // Pack 6 int16 values
    imu_data[0] = (ax >> 0) & 0xFF;
    imu_data[1] = (ax >> 8) & 0xFF;
    imu_data[2] = (ay >> 0) & 0xFF;
    imu_data[3] = (ay >> 8) & 0xFF;
    imu_data[4] = (az >> 0) & 0xFF;
    imu_data[5] = (az >> 8) & 0xFF;
    imu_data[6] = (gx >> 0) & 0xFF;
    imu_data[7] = (gx >> 8) & 0xFF;
    imu_data[8] = (gy >> 0) & 0xFF;
    imu_data[9] = (gy >> 8) & 0xFF;
    imu_data[10] = (gz >> 0) & 0xFF;
    imu_data[11] = (gz >> 8) & 0xFF;
    
    // Send notification via GATT
    // esp_ble_gatts_send_indicate(..., char_imu_handle, 12, imu_data, false);
    ESP_LOGD(TAG, "IMU data sent: ax=%d, ay=%d, az=%d", ax, ay, az);
}

// Send battery notification to Spaceship Earth
void ble_send_battery_level(uint8_t level) {
    current_battery = level;
    // Send notification via GATT
    // esp_ble_gatts_send_indicate(..., char_battery_handle, 1, &level, false);
    ESP_LOGD(TAG, "Battery level sent: %d%%", level);
}

// Get DID (Ed25519 public key)
void ble_get_did(uint8_t* pubkey_out, size_t* len_out) {
    // Read from SE050 or eFuse
    // For now, use placeholder
    memset(pubkey_out, 0, 32);
    *len_out = 32;
    ESP_LOGI(TAG, "DID requested");
}
```

---

### FW12.3 — BLE Advertising + Connection Management

**Action**: CREATE  
**File**: `firmware/maker-variant/main/ble_manager.cpp`

```c
#include <stdint.h>
#include "esp_log.h"
#include "esp_bt.h"
#include "esp_gap_ble_api.h"
#include "esp_gatt_common.h"

static const char *TAG = "BLE_MGR";

#define DEVICE_NAME "NODE ZERO"
#define MANUFACTURER_ID 0xP31L  // P31 Labs

static bool ble_connected = false;
static uint16_t ble_conn_id = 0;

// GAP event handler
static void gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {
    switch (event) {
        case ESP_GAP_BLE_ADV_DATA_SET_COMPLETE_EVT:
            ESP_LOGI(TAG, "Advertising data set complete");
            break;
            
        case ESP_GAP_BLE_SCAN_RSP_DATA_SET_COMPLETE_EVT:
            ESP_LOGI(TAG, "Scan response data set complete");
            break;
            
        case ESP_GAP_BLE_ADV_START_COMPLETE_EVT:
            if (param->adv_start_cmpl.status == ESP_BT_STATUS_SUCCESS) {
                ESP_LOGI(TAG, "Advertising started");
            } else {
                ESP_LOGE(TAG, "Advertising start failed");
            }
            break;
            
        case ESP_GAP_BLE_CONNECTION_UPDATE_COMPLETE_EVT:
            ESP_LOGI(TAG, "Connection updated");
            break;
            
        default:
            break;
    }
}

// Start BLE advertising
esp_err_t ble_start_advertising(void) {
    esp_err_t ret;
    
    // Configure advertising data
    esp_ble_adv_data_t adv_data = {
        .set_id = 0,
        .include_name = true,
        .include_txpower = true,
        .min_interval = 0x20,    // 20ms
        .max_interval = 0x40,    // 40ms
        .appearance = 0x00,
        .manufacturer_len = 2,
        .p_manufacturer_data = (uint8_t[]){0x31, 0x50},  // "P1"
        .service_data_len = 0,
        .p_service_data = NULL,
        .service_uuid_len = 16,
        .p_service_uuid = NULL,
        .flag = (ESP_BLE_ADV_FLAG_GEN_DISC | ESP_BLE_ADV_FLAG_DMT_CONTROLLER_SSP),
    };
    
    ret = esp_ble_gap_config_adv_data(&adv_data);
    if (ret) {
        ESP_LOGE(TAG, "Config adv data failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Set device name
    ret = esp_ble_gap_set_device_name(DEVICE_NAME);
    if (ret) {
        ESP_LOGE(TAG, "Set device name failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Set appearance (generic computer)
    ret = esp_ble_gap_set_appearance(0x80);  // 0x80 = Generic Computer
    if (ret) {
        ESP_LOGE(TAG, "Set appearance failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Register GAP callback
    ret = esp_ble_gap_register_callback(gap_event_handler);
    if (ret) {
        ESP_LOGE(TAG, "GAP callback register failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Start advertising
    esp_ble_adv_params_t adv_params = {
        .adv_int_min = 0x20,
        .adv_int_max = 0x40,
        .adv_type = ADV_TYPE_IND,
        .own_addr_type = BLE_ADDR_TYPE_PUBLIC,
        .peer_addr_type = BLE_ADDR_TYPE_PUBLIC,
        .peer_addr = {0},
        .channel_map = ADV_CHNL_ALL,
        .adv_filter_policy = ADV_FILTER_ALLOW_SCAN_ANY_CON_ANY,
    };
    
    ret = esp_ble_gap_start_advertising(&adv_params);
    if (ret) {
        ESP_LOGE(TAG, "Start advertising failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    return ESP_OK;
}

// Initialize BLE manager
esp_err_t ble_manager_init(void) {
    esp_err_t ret;
    
    // Initialize BLE controller (if not already done)
    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    ret = esp_bt_controller_init(&bt_cfg);
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "BT controller init failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = esp_bt_controller_enable(ESP_BT_MODE_BLE);
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "BT controller enable failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Initialize Bluedroid (if not already done)
    ret = esp_bluedroid_init();
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Bluedroid init failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = esp_bluedroid_enable();
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Bluedroid enable failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    // Start advertising
    ret = ble_start_advertising();
    if (ret) {
        ESP_LOGE(TAG, "Start advertising failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ESP_LOGI(TAG, "BLE manager initialized, advertising as '%s'", DEVICE_NAME);
    return ESP_OK;
}

// Check if connected
bool ble_is_connected(void) {
    return ble_connected;
}
```

---

## Deliverables

- [ ] Web Bluetooth discoverable and connectable
- [ ] Bidirectional state sync (coherence, spoons, room, theme → Node Zero; IMU, battery → SE)
- [ ] Haptic command execution via BLE write
- [ ] Ed25519 DID exposed via GATT read
- [ ] IMU data streaming at 10Hz
- [ ] Battery level updates at 0.1Hz
- [ ] Connection status indication
- [ ] `idf.py build` succeeds

---

## Dependencies

- **Prerequisites**: FW10 (boot sequence), FW11 (haptic driver)
- **Blocked by**: None
- **Blocks**: FW13 (LVGL UI shows sync status), FW14 (Sorcery MCP tools)

---

## Web Bluetooth Client

The Spaceship Earth side (FW16) will implement:
```javascript
// Web Bluetooth connection:
const P31_SERVICE_UUID = '31500000-7033-314c-cafe-ca9504630000';

// Request device
const device = await navigator.bluetooth.requestDevice({
    filters: [{ name: 'NODE ZERO' }],
    optionalServices: [P31_SERVICE_UUID]
});

// Connect
const server = await device.gatt.connect();

// Get service
const service = await server.getPrimaryService(P31_SERVICE_UUID);

// Subscribe to coherence notifications
const coherenceChar = await service.getCharacteristic('31500001-...');
await coherenceChar.startNotifications();
coherenceChar.addEventListener('characteristicvaluechanged', (e) => {
    const view = e.target.value;
    const coherence = view.getFloat32(0, true);
    updateCoherence(coherence);
});
```

---

## Agent Assignment

**Primary**: DeepSeek (ESP32 BLE GATT, NimBLE stack)  
**Support**: Sonnet/CC (Web Bluetooth client integration)  
**Verification**: Opus (GATT UUID verification)
