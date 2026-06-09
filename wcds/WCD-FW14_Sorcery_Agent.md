# WCD-FW14: Sorcery Agent (Voice LLM + MCP Tools)
## P31 Labs · Node Zero · Physical Cockpit Foundation
## Issued: March 20, 2026 · Classification: SOULSAFE · Agent: DeepSeek

---

## Objective

Integrate the Sorcery AI agent on Node Zero. Voice input → LLM (cloud) → tool execution on BOTH Node Zero AND Spaceship Earth.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Node Zero                               │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │ Microphone  │───>│ Sorcery      │───>│ MCP Tool    │  │
│  │ (I2S/ES8311)│    │ WebSocket   │    │ Dispatcher │  │
│  └─────────────┘    └──────────────┘    └─────────────┘  │
│                           │                   │            │
│                           v                   v            │
│                    ┌──────────────┐    ┌─────────────┐    │
│                    │ Cloud LLM    │    │ Local Hapt/ │    │
│                    │ (API Call)   │    │ BLE Forward │    │
│                    └──────────────┘    └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                     WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Spaceship Earth                            │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │ WebSocket   │<───│ Sorcery      │<───│ MCP Tool    │  │
│  │ Server      │    │ Agent        │    │ Registry    │  │
│  └─────────────┘    └──────────────┘    └─────────────┘  │
│                           │                                 │
│                           v                                 │
│                    ┌──────────────┐                         │
│                    │ Theme/State  │                         │
│                    │ Update       │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tasks

### FW14.1 — Audio Input Pipeline

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/audio_manager.cpp`

```c
#include <driver/i2s.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#define I2S_WS_PIN      GPIO_NUM_4
#define I2S_SCK_PIN     GPIO_NUM_3
#define I2S_SD_PIN      GPIO_NUM_2
#define I2S_PORT        I2S_NUM_0
#define SAMPLE_RATE     16000
#define PCM_BUFFER_SIZE 1024

static const char *TAG = "AUDIO_IN";

// Audio buffer for microphone
static int16_t pcm_buffer[PCM_BUFFER_SIZE];
static QueueHandle_t audio_queue = NULL;

// I2S microphone initialization
esp_err_t audio_input_init(void) {
    i2s_config_t i2s_config = {
        .mode = I2S_MODE_MASTER | I2S_MODE_RX,
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 4,
        .dma_buf_len = 256,
        .use_apll = false,
        .tx_desc_auto_clear = false,
    };
    
    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK_PIN,
        .ws_io_num = I2S_WS_PIN,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_SD_PIN,
    };
    
    ESP_ERROR_CHECK(i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL));
    ESP_ERROR_CHECK(i2s_set_pin(I2S_PORT, &pin_config));
    
    // Create audio queue
    audio_queue = xQueueCreate(4, sizeof(pcm_buffer));
    
    ESP_LOGI(TAG, "Audio input initialized");
    return ESP_OK;
}

// Audio capture task
static void audio_capture_task(void *param) {
    size_t bytes_read = 0;
    
    while (1) {
        // Read PCM data from I2S
        i2s_read(I2S_PORT, pcm_buffer, sizeof(pcm_buffer), &bytes_read, portMAX_DELAY);
        
        if (bytes_read > 0 && audio_queue) {
            // Send to processing
            xQueueSend(audio_queue, pcm_buffer, 0);
        }
    }
}

// Start audio capture
void audio_input_start(void) {
    xTaskCreate(audio_capture_task, "audio_capture", 4096, NULL, 10, NULL);
    ESP_LOGI(TAG, "Audio capture started");
}
```

---

### FW14.2 — Sorcery WebSocket Protocol

**Action**: CREATE  
**File**: `firmware/maker-variant/main/sorcery_client.cpp`

```c
#include <string.h>
#include "esp_websocket_client.h"
#include "esp_log.h"
#include "esp_event.h"

static const char *TAG = "SORCERY";

// Sorcery endpoint (configurable)
#define SORCERY_WSS_URL "wss://api.phosphorus31.org/sorcery"

static esp_websocket_client_handle_t ws_client = NULL;
static bool connected = false;

// MCP tools exposed to Sorcery:
// - trigger_haptic(effect_id): Local DRV2605L
// - set_backlight(brightness): AXP2101 / TCA9554
// - forward_to_ble(topic, payload): Forward to Spaceship Earth
// - get_coherence(): Return current coherence
// - get_spoons(): Return current spoons
// - set_theme(theme_name): Change theme locally + forward to SE

typedef enum {
    MCP_TYPE_REQUEST,
    MCP_TYPE_RESPONSE,
    MCP_TYPE_NOTIFICATION
} mcp_message_type_t;

typedef struct {
    mcp_message_type_t type;
    char tool_name[64];
    char params[256];
    int id;
} mcp_message_t;

// WebSocket event handler
static void websocket_event_handler(void *handler_args, esp_event_base_t base, 
                                    int32_t event_id, void *event_data) {
    esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
    
    switch (event_id) {
        case WEBSOCKET_EVENT_CONNECTED:
            ESP_LOGI(TAG, "Connected to Sorcery");
            connected = true;
            break;
            
        case WEBSOCKET_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "Disconnected from Sorcery");
            connected = false;
            break;
            
        case WEBSOCKET_EVENT_DATA:
            // Handle incoming MCP response
            if (data->data_len > 0) {
                char *payload = (char *)malloc(data->data_len + 1);
                memcpy(payload, data->data_ptr, data->data_len);
                payload[data->data_len] = '\0';
                
                // Parse and execute MCP tool
                mcp_execute_tool(payload);
                
                free(payload);
            }
            break;
            
        default:
            break;
    }
}

// Initialize Sorcery WebSocket client
esp_err_t sorcery_init(const char *server_url) {
    esp_websocket_client_config_t ws_config = {
        .uri = server_url ? server_url : SORCERY_WSS_URL,
        .keep_alive_idle_timeout = 30,
    };
    
    ws_client = esp_websocket_client_init(&ws_config);
    ESP_ERROR_CHECK(esp_websocket_register_events(ws_client, WEBSOCKET_EVENT_ANY, 
                                                    websocket_event_handler, NULL));
    
    ESP_ERROR_CHECK(esp_websocket_client_start(ws_client));
    
    ESP_LOGI(TAG, "Sorcery client initialized");
    return ESP_OK;
}

// Send voice data to Sorcery
esp_err_t sorcery_send_audio(const uint8_t *audio_data, size_t len) {
    if (!connected || !ws_client) {
        return ESP_ERR_INVALID_STATE;
    }
    
    // Send binary audio frame
    return esp_websocket_client_send_bin(ws_client, (const char *)audio_data, len, portMAX_DELAY);
}

// MCP tool execution
void mcp_execute_tool(const char *json_payload) {
    // Parse JSON and execute tool
    // This is a simplified version - real implementation would use cJSON
    
    if (strstr(json_payload, "trigger_haptic")) {
        // Extract effect_id and trigger
        int effect_id = 1;  // Extract from JSON
        haptic_trigger((haptic_effect_t)effect_id);
        ESP_LOGI(TAG, "MCP: trigger_haptic(%d)", effect_id);
    }
    else if (strstr(json_payload, "set_backlight")) {
        // Extract brightness and set
        int brightness = 128;  // Extract from JSON
        // tca9554_set_backlight(brightness);
        ESP_LOGI(TAG, "MCP: set_backlight(%d)", brightness);
    }
    else if (strstr(json_payload, "forward_to_ble")) {
        // Forward to Spaceship Earth via BLE
        // This triggers theme changes on SE
        // ble_forward_notification(...);
        ESP_LOGI(TAG, "MCP: forward_to_ble");
    }
    else if (strstr(json_payload, "set_theme")) {
        // Extract theme name
        const char *theme = "default";  // Extract from JSON
        theme_apply(theme);
        // Forward to SE via BLE
        // ble_send_theme(theme);
        ESP_LOGI(TAG, "MCP: set_theme(%s)", theme);
    }
}

// Rate limiting (per WCD-31)
static int64_t last_tool_call = 0;
#define MCP_RATE_LIMIT_MS 2000  // 2 seconds

bool mcp_rate_limit_check(void) {
    int64_t now = esp_timer_get_time() / 1000;  // ms
    if (now - last_tool_call < MCP_RATE_LIMIT_MS) {
        return false;  // Rate limited
    }
    last_tool_call = now;
    return true;
}
```

---

### FW14.3 — MCP Tool Dispatcher

**Action**: CREATE  
**File**: `firmware/maker-variant/main/mcp_dispatcher.cpp`

```c
#include <string.h>
#include <ctype.h>

// MCP tool definitions
typedef enum {
    TOOL_TRIGGER_HAPTIC,
    TOOL_SET_BACKLIGHT,
    TOOL_FORWARD_TO_BLE,
    TOOL_GET_COHERENCE,
    TOOL_GET_SPOONS,
    TOOL_SET_THEME,
    TOOL_UNKNOWN
} mcp_tool_id_t;

// Tool name to ID mapping
static mcp_tool_id_t mcp_get_tool_id(const char *tool_name) {
    if (strcmp(tool_name, "trigger_haptic") == 0) return TOOL_TRIGGER_HAPTIC;
    if (strcmp(tool_name, "set_backlight") == 0) return TOOL_SET_BACKLIGHT;
    if (strcmp(tool_name, "forward_to_ble") == 0) return TOOL_FORWARD_TO_BLE;
    if (strcmp(tool_name, "get_coherence") == 0) return TOOL_GET_COHERENCE;
    if (strcmp(tool_name, "get_spoons") == 0) return TOOL_GET_SPOONS;
    if (strcmp(tool_name, "set_theme") == 0) return TOOL_SET_THEME;
    return TOOL_UNKNOWN;
}

// MCP dispatcher with validation
esp_err_t mcp_dispatch(const char *tool_name, const char *params_json) {
    // Rate limit check
    if (!mcp_rate_limit_check()) {
        ESP_LOGW(TAG, "MCP rate limit exceeded");
        return ESP_ERR_INVALID_STATE;
    }
    
    // Validate tool name
    mcp_tool_id_t tool_id = mcp_get_tool_id(tool_name);
    if (tool_id == TOOL_UNKNOWN) {
        ESP_LOGE(TAG, "Unknown tool: %s", tool_name);
        return ESP_ERR_NOT_FOUND;
    }
    
    // Validate parameters and execute
    switch (tool_id) {
        case TOOL_TRIGGER_HAPTIC: {
            // Validate effect_id: 0-123 (DRV2605L library range)
            int effect_id = atoi(params_json);
            if (effect_id < 0 || effect_id > 123) {
                ESP_LOGE(TAG, "Invalid effect_id: %d", effect_id);
                return ESP_ERR_INVALID_ARG;
            }
            haptic_trigger((haptic_effect_t)effect_id);
            break;
        }
        
        case TOOL_SET_BACKLIGHT: {
            // Validate brightness: 0-255
            int brightness = atoi(params_json);
            if (brightness < 0 || brightness > 255) {
                ESP_LOGE(TAG, "Invalid brightness: %d", brightness);
                return ESP_ERR_INVALID_ARG;
            }
            // tca9554_set_backlight(brightness);
            break;
        }
        
        case TOOL_FORWARD_TO_BLE: {
            // Forward to Spaceship Earth via BLE notification
            // ble_forward_notification(params_json);
            break;
        }
        
        case TOOL_GET_COHERENCE: {
            // Return current coherence value
            char response[32];
            snprintf(response, sizeof(response), "{\"coherence\":%.2f}", current_coherence);
            // Send response back via WebSocket
            break;
        }
        
        case TOOL_GET_SPOONS: {
            // Return current spoons value
            char response[32];
            snprintf(response, sizeof(response), "{\"spoons\":%d}", current_spoons);
            // Send response back via WebSocket
            break;
        }
        
        case TOOL_SET_THEME: {
            // Validate theme name
            const char *valid_themes[] = {"default", "quantum", "gray_rock", "solar", "ocean", "kids"};
            bool valid = false;
            for (size_t i = 0; i < sizeof(valid_themes)/sizeof(valid_themes[0]); i++) {
                if (strcmp(params_json, valid_themes[i]) == 0) {
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                ESP_LOGE(TAG, "Invalid theme: %s", params_json);
                return ESP_ERR_INVALID_ARG;
            }
            
            // Apply locally
            theme_apply(params_json);
            
            // Forward to Spaceship Earth via BLE
            // ble_send_theme(params_json);
            break;
        }
        
        default:
            return ESP_ERR_NOT_FOUND;
    }
    
    ESP_LOGI(TAG, "MCP tool executed: %s(%s)", tool_name, params_json);
    return ESP_OK;
}
```

---

### FW14.4 — Voice Wake Word (Optional)

**Action**: DOCUMENT  
**File**: `firmware/maker-variant/README_SORCERY.md`

```c
// Wake word: "Hey Sorcery" or configurable
// Use ESP-SR MultiNet for local wake word detection

// Note: ESP-SR is resource-intensive on ESP32-S3
// Alternative: Hardware button to activate voice input

// For MVP: Use physical button (GPIO) to trigger voice input
// Button press -> Start I2S capture -> Stream to Sorcery -> Wait for response
```

---

## Deliverables

- [ ] Audio input pipeline (I2S microphone → PCM buffer)
- [ ] Sorcery WebSocket client (connect, stream audio, receive JSON)
- [ ] MCP tool dispatcher with input validation + 2s rate limit
- [ ] Tool implementations: haptic, backlight, theme, coherence query
- [ ] BLE forward capability (trigger theme change on Spaceship Earth)
- [ ] `idf.py build` succeeds

---

## Dependencies

- **Prerequisites**: FW10 (audio works), FW11 (haptic), FW12 (BLE)
- **Blocked by**: None
- **Blocks**: None (final firmware integration)

---

## Voice Command Examples

| Voice Command | Action |
|---------------|--------|
| "make it vibrate" | Sorcery → MCP → DRV2605L fires |
| "switch to kids mode" | Theme change on BOTH Node Zero AND Spaceship Earth |
| "what's my coherence" | Return coherence value via WebSocket |
| "turn up the backlight" | Increase display brightness |

---

## Acceptance Criteria

1. Voice command "make it vibrate" → Sorcery agent → MCP call → DRV2605L fires
2. Voice command "switch to kids mode" → theme change on BOTH Node Zero AND Spaceship Earth (via BLE forward)
3. Rate limiting prevents tool spam (2 second cooldown)
4. Invalid parameters are rejected with error message
5. All MCP tools work locally and forward to SE appropriately

---

## Agent Assignment

**Primary**: DeepSeek (ESP32 audio, WebSocket, MCP)  
**Support**: Sonnet/CC (integration testing)  
**Verification**: Opus (validation of tool parameters)
