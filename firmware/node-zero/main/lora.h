#pragma once
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

// SX1262 operating state
typedef enum {
    LORA_STATE_IDLE = 0,
    LORA_STATE_RX,
    LORA_STATE_TX,
    LORA_STATE_ERROR,
} lora_state_t;

// Initialize SX1262 on SPI3_HOST (GPIO 38-45).
// Configures Meshtastic LONG_FAST: 915 MHz, SF11, BW250, CR4/5.
// Leaves radio in continuous-RX mode after init.
// Returns ESP_OK on success.
esp_err_t lora_init(void);

// Transmit len bytes from buf. Blocks until TX_DONE IRQ or timeout_ms elapses.
// Returns ESP_OK if packet was transmitted, ESP_ERR_TIMEOUT otherwise.
esp_err_t lora_tx(const uint8_t *buf, size_t len, uint32_t timeout_ms);

// Copy the last received packet into buf (max buf_len bytes).
// Sets *rssi_out and *snr_out if non-NULL.
// Returns number of bytes written, or 0 if no packet ready.
size_t lora_rx_get(uint8_t *buf, size_t buf_len, int16_t *rssi_out, int8_t *snr_out);

// Return current operating state.
lora_state_t lora_state(void);

#ifdef __cplusplus
}
#endif
