#pragma once
#include "lvgl.h"
#include "esp_lcd_panel_ops.h"

#ifdef __cplusplus
extern "C" {
#endif

// Initialize the AXS15231B display over QSPI and register with LVGL 8.4.
// Call after bus_mutex_init(). lv_init() is called internally.
// Returns the LVGL display pointer on success, NULL on failure.
lv_disp_t *display_init(void);

// Set backlight brightness: 0 (off) – 255 (full)
void display_backlight_set(uint8_t brightness);

// Expose the raw panel handle (used by touch and power management)
esp_lcd_panel_handle_t display_get_panel(void);

#ifdef __cplusplus
}
#endif
