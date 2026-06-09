#pragma once
#include "lvgl.h"
#include "lora.h"

#ifdef __cplusplus
extern "C" {
#endif

// Initialize all LVGL screens and widgets.
// Must be called from the LVGL task (after display_init + touch_init).
void p31_ui_init(lv_disp_t *disp);

// Update LoRa indicator. Safe to call from any task (uses lv_async_call internally).
void p31_ui_update_lora(lora_state_t state, int16_t rssi);

// Update spoon gauge (0-100). Reflects operator cognitive energy level.
void p31_ui_update_spoons(uint8_t pct);

// Update status line text (max 32 chars).
void p31_ui_update_status(const char *msg);

#ifdef __cplusplus
}
#endif
