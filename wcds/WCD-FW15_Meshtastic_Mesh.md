# WCD-FW15: Meshtastic Identity + Mesh Relay
## P31 Labs · Node Zero · Physical Cockpit Foundation
## Issued: March 20, 2026 · Classification: SOULSAFE · Agent: DeepSeek

---

## Objective

Configure the SX1262 LoRa transceiver for Meshtastic mesh networking. Node Zero becomes the mesh hub — messages hop through the 915 MHz network without internet.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mesh Network                             │
│                                                             │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐          │
│   │ Node A  │─────>│Node Zero│─────>│ Node B  │          │
│   │ (hand)  │      │ (hub)   │      │ (tablet)│          │
│   └─────────┘      └─────────┘      └─────────┘          │
│       │                  │                  │              │
│       v                  v                  v              │
│   BLE to SE         BLE to SE          BLE to SE         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Meshtastic: 915 MHz, no internet required
BLE: Local device to Spaceship Earth
```

---

## Hardware Configuration

- **LoRa chip**: Semtech SX1262
- **Frequency**: 915 MHz (US ISM band)
- **Power**: Up to 30 dBm
- **Antenna**: U.FL connector
- **SPI bus**: Dedicated SPI (separate from QSPI display)

---

## Tasks

### FW15.1 — Meshtastic Integration

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/lora_manager.cpp`

```c
#include "esp_log.h"
#include "RadioLib.h"

static const char *TAG = "MESHTASTIC";

// SX1262 pins (verify against hardware schematic)
#define LORA_CS_PIN     GPIO_NUM_5
#define LORA_DIO1_PIN   GPIO_NUM_2
#define LORA_BUSY_PIN   GPIO_NUM_4
#define LORA_RST_PIN    GPIO_NUM_12

// Meshtastic configuration
#define MESHTASTIC_FREQ 915.0f    // MHz (US band)
#define MESHTASTIC_BW   125.0f   // kHz
#define MESHTASTIC_SF   7         // Spreading factor
#define MESHTASTIC_CR   5         // Coding rate
#define MESHTASTIC_PWR  30        // dBm

// Node identity
static char mesh_node_name[32] = "NODE ZERO";
static char mesh_short_name[8] = "NZ";

// Mesh packet types
#define PORTNUM_TEXT_MESSAGE_APP 1
#define PORTNUM_NODEINFO_APP 2
#define PORTNUM_P31_STATE 100     // Custom P31 state sync

// Initialize SX1262 for Meshtastic
esp_err_t meshtastic_init(const char *owner_name) {
    // Copy owner name
    strncpy(mesh_node_name, owner_name ? owner_name : "NODE ZERO", sizeof(mesh_node_name) - 1);
    mesh_short_name[0] = 'N';
    mesh_short_name[1] = 'Z';
    mesh_short_name[2] = '\0';
    
    // Initialize RadioLib SX1262
    // Note: This is a simplified version - full Meshtastic integration
    // would use the Meshtastic ESP32 Arduino library
    
    // Set frequency
    // sx1262.setFrequency(MESHTASTIC_FREQ);
    
    // Set bandwidth
    // sx1262.setBandwidth(MESHTASTIC_BW);
    
    // Set spreading factor
    // sx1262.setSpreadingFactor(MESHTASTIC_SF);
    
    // Set coding rate
    // sx1262.setCodingRate(MESHTASTIC_CR);
    
    // Set output power
    // sx1262.setOutputPower(MESHTASTIC_PWR);
    
    ESP_LOGI(TAG, "Meshtastic initialized: %s (%s)", mesh_node_name, mesh_short_name);
    return ESP_OK;
}
```

---

### FW15.2 — Mesh Message Relay

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/mesh_relay.cpp`

```c
#include <string.h>
#include "esp_log.h"

static const char *TAG = "MESH_RELAY";

// Mesh message queue
#define MESH_QUEUE_SIZE 16

typedef struct {
    uint8_t port;
    uint8_t data[256];
    size_t len;
    int64_t timestamp;
} mesh_message_t;

static QueueHandle_t mesh_tx_queue = NULL;
static QueueHandle_t mesh_rx_queue = NULL;

// Send message to mesh
esp_err_t mesh_send(uint8_t port, const uint8_t *data, size_t len) {
    if (len > 256) {
        return ESP_ERR_INVALID_SIZE;
    }
    
    mesh_message_t msg = {
        .port = port,
        .len = len,
        .timestamp = esp_timer_get_time() / 1000
    };
    memcpy(msg.data, data, len);
    
    if (mesh_tx_queue) {
        xQueueSend(mesh_tx_queue, &msg, 0);
    }
    
    ESP_LOGI(TAG, "Mesh TX: port=%d, len=%d", port, len);
    return ESP_OK;
}

// Receive message from mesh (callback)
void mesh_on_receive(uint8_t *payload, size_t len, int rssi) {
    if (len < 1) return;
    
    uint8_t port = payload[0];
    
    mesh_message_t msg = {
        .port = port,
        .len = len - 1,
        .timestamp = esp_timer_get_time() / 1000
    };
    memcpy(msg.data, payload + 1, msg.len);
    
    if (mesh_rx_queue) {
        xQueueSend(mesh_rx_queue, &msg, 0);
    }
    
    ESP_LOGI(TAG, "Mesh RX: port=%d, len=%d, rssi=%d", port, msg.len, rssi);
    
    // Forward P31 state messages to BLE/Spaceship Earth
    if (port == PORTNUM_P31_STATE) {
        // ble_forward_notification(msg.data, msg.len);
    }
}

// Relay messages between mesh and BLE
static void mesh_relay_task(void *param) {
    mesh_message_t msg;
    
    while (1) {
        // Check for incoming mesh messages
        if (mesh_rx_queue && xQueueReceive(mesh_rx_queue, &msg, pdMS_TO_TICKS(100)) == pdTRUE) {
            // Forward to BLE/Spaceship Earth
            if (msg.port == PORTNUM_P31_STATE) {
                // Forward P31 state sync
                // ble_send_p31_state(msg.data, msg.len);
            }
        }
        
        // Check for outgoing BLE messages to relay to mesh
        if (mesh_tx_queue && xQueueReceive(mesh_tx_queue, &msg, pdMS_TO_TICKS(100)) == pdTRUE) {
            // Send to mesh
            // sx1262.transmit(msg.data, msg.len);
        }
    }
}

void mesh_relay_init(void) {
    mesh_tx_queue = xQueueCreate(MESH_QUEUE_SIZE, sizeof(mesh_message_t));
    mesh_rx_queue = xQueueCreate(MESH_QUEUE_SIZE, sizeof(mesh_message_t));
    
    xTaskCreate(mesh_relay_task, "mesh_relay", 4096, NULL, 5, NULL);
    
    ESP_LOGI(TAG, "Mesh relay initialized");
}
```

---

### FW15.3 — P31 State Sync Protocol

**Action**: CREATE  
**File**: `firmware/maker-variant/main/p31_mesh_protocol.cpp`

```c
#include <string.h>

// P31 state sync over mesh
#define P31_STATE_VERSION 1

typedef struct {
    uint8_t version;
    float coherence;
    uint8_t spoons;
    char room[32];
    char theme[32];
    int64_t timestamp;
} p31_state_t;

// Pack state for mesh transmission
esp_err_t p31_state_pack(const p31_state_t *state, uint8_t *buffer, size_t *len) {
    if (*len < sizeof(p31_state_t)) {
        return ESP_ERR_INVALID_SIZE;
    }
    
    buffer[0] = state->version;
    
    // Pack coherence (float)
    memcpy(&buffer[1], &state->coherence, 4);
    
    // Pack spoons
    buffer[5] = state->spoons;
    
    // Pack room (32 bytes)
    memcpy(&buffer[6], state->room, 32);
    
    // Pack theme (32 bytes)
    memcpy(&buffer[38], state->theme, 32);
    
    // Pack timestamp (8 bytes)
    memcpy(&buffer[70], &state->timestamp, 8);
    
    *len = sizeof(p31_state_t);
    return ESP_OK;
}

// Unpack state from mesh reception
esp_err_t p31_state_unpack(const uint8_t *buffer, size_t len, p31_state_t *state) {
    if (len < sizeof(p31_state_t)) {
        return ESP_ERR_INVALID_SIZE;
    }
    
    state->version = buffer[0];
    memcpy(&state->coherence, &buffer[1], 4);
    state->spoons = buffer[5];
    memcpy(state->room, &buffer[6], 32);
    memcpy(state->theme, &buffer[38], 32);
    memcpy(&state->timestamp, &buffer[70], 8);
    
    return ESP_OK;
}

// Broadcast current state to mesh
void p31_state_broadcast(void) {
    p31_state_t state = {
        .version = P31_STATE_VERSION,
        .coherence = current_coherence,
        .spoons = current_spoons,
    };
    strncpy(state.room, current_room, sizeof(state.room) - 1);
    strncpy(state.theme, current_theme, sizeof(state.theme) - 1);
    state.timestamp = esp_timer_get_time() / 1000;
    
    uint8_t buffer[256];
    size_t len = sizeof(buffer);
    p31_state_pack(&state, buffer, &len);
    
    mesh_send(PORTNUM_P31_STATE, buffer, len);
    
    ESP_LOGI(TAG, "P31 state broadcast: coherence=%.2f, spoons=%d", 
             state.coherence, state.spoons);
}
```

---

## Deliverables

- [ ] SX1262 initialization at 915 MHz
- [ ] Meshtastic node identity (NODE ZERO / NZ)
- [ ] Mesh message queue and relay task
- [ ] P31 state sync protocol (mesh ↔ BLE)
- [ ] Mesh topology visualization data to Spaceship Earth
- [ ] `idf.py build` succeeds

---

## Dependencies

- **Prerequisites**: FW10 (SPI bus works)
- **Blocked by**: None
- **Blocks**: None (final firmware integration)

---

## Meshtastic Configuration

```
# Meshtastic settings:
frequency: 915.0 MHz
bandwidth: 125 kHz
spreading_factor: 7
coding_rate: 5
tx_power: 30 dBm
node: NODE ZERO (NZ)
```

---

## Usage

1. **Two Node Zero devices** can communicate directly over LoRa mesh
2. **Mesh → BLE relay**: Messages from mesh can be forwarded to Spaceship Earth
3. **BLE → Mesh relay**: Commands from Spaceship Earth can be sent to mesh
4. **No internet required**: Entire system works offline

---

## Acceptance Criteria

1. SX1262 initializes and transmits at 915 MHz
2. Mesh node shows as "NODE ZERO" / "NZ" in Meshtastic app
3. P31 state messages can be sent/received over mesh
4. Mesh messages relay to/from BLE for Spaceship Earth integration
5. Mesh topology visible in Spaceship Earth UI

---

## Agent Assignment

**Primary**: DeepSeek (SX1262, RadioLib, mesh protocols)  
**Support**: Sonnet/CC (integration testing)  
**Verification**: Opus (mesh range testing)
