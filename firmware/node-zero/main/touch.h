#pragma once
#include "lvgl.h"

#ifdef __cplusplus
extern "C" {
#endif

// Initialize AXS15231B integrated touch via I2C and register with LVGL 8.4.
// Must be called after display_init() (lv_init() must have run).
// Acquires I2C bus via bus_mutex internally on every poll.
// Returns the LVGL input device pointer, or NULL on failure.
lv_indev_t *touch_init(void);

#ifdef __cplusplus
}
#endif
