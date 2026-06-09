#ifndef LV_CONF_H
#define LV_CONF_H

#include <stdint.h>

// ── Color depth ───────────────────────────────────────────────────────────────
// RGB565 (16-bit) — matches AXS15231B COLMOD 0x55 init command
#define LV_COLOR_DEPTH 16

// ── Memory — PSRAM custom allocator ──────────────────────────────────────────
// Do NOT use the default lv_mem (internal SRAM only).
// Full-frame double buffers live in PSRAM; LVGL heap also goes there.
// This eliminates the ThorVG tiling penalty by avoiding partial-buffer redraws.
#define LV_MEM_CUSTOM 1
#define LV_MEM_CUSTOM_INCLUDE "esp_heap_caps.h"
#define LV_MEM_CUSTOM_ALLOC(size) \
    heap_caps_malloc((size), MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT)
#define LV_MEM_CUSTOM_REALLOC(p, new_size) \
    heap_caps_realloc((p), (new_size), MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT)
#define LV_MEM_CUSTOM_FREE  heap_caps_free

// ── Rendering ─────────────────────────────────────────────────────────────────
#define LV_DISP_DEF_REFR_PERIOD  10  // ms between LVGL timer handler calls
#define LV_INDEV_DEF_READ_PERIOD 30  // ms between touch polls

// ── Display rotation (software — hardware MADCTL breaks AXS15231B) ────────────
// sw_rotate is set on lv_disp_drv_t at runtime in display.c
// Defined here for documentation clarity only
#define LV_USE_ROTATE 1

// ── Fonts ─────────────────────────────────────────────────────────────────────
#define LV_FONT_MONTSERRAT_10 0
#define LV_FONT_MONTSERRAT_12 0
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_16 1
#define LV_FONT_MONTSERRAT_18 0
#define LV_FONT_MONTSERRAT_20 1
#define LV_FONT_MONTSERRAT_22 0
#define LV_FONT_MONTSERRAT_24 1
#define LV_FONT_MONTSERRAT_26 0
#define LV_FONT_MONTSERRAT_28 0
#define LV_FONT_MONTSERRAT_30 0
#define LV_FONT_MONTSERRAT_32 1
#define LV_FONT_MONTSERRAT_34 0
#define LV_FONT_MONTSERRAT_36 0
#define LV_FONT_MONTSERRAT_38 0
#define LV_FONT_MONTSERRAT_40 0
#define LV_FONT_MONTSERRAT_42 0
#define LV_FONT_MONTSERRAT_44 0
#define LV_FONT_MONTSERRAT_46 0
#define LV_FONT_MONTSERRAT_48 0
#define LV_FONT_UNSCII_8     0
#define LV_FONT_UNSCII_16    0

#define LV_FONT_DEFAULT &lv_font_montserrat_16

// ── Widgets ───────────────────────────────────────────────────────────────────
#define LV_USE_ARC      1
#define LV_USE_BAR      1
#define LV_USE_BTN      1
#define LV_USE_BTNMATRIX 0
#define LV_USE_CANVAS   0
#define LV_USE_CHART    0
#define LV_USE_CHECKBOX 0
#define LV_USE_DROPDOWN 0
#define LV_USE_IMG      1
#define LV_USE_LABEL    1
#define LV_USE_LINE     1
#define LV_USE_METER    1
#define LV_USE_MSGBOX   0
#define LV_USE_ROLLER   0
#define LV_USE_SLIDER   1
#define LV_USE_SPINBOX  0
#define LV_USE_SPINNER  1
#define LV_USE_SWITCH   1
#define LV_USE_TABLE    0
#define LV_USE_TABVIEW  1
#define LV_USE_TEXTAREA 1
#define LV_USE_WIN      0

// ── Vector graphics — DISABLED (ThorVG tiling penalty at partial-buffer depth)
#define LV_USE_THORVG_INTERNAL 0
#define LV_USE_THORVG_EXTERNAL 0
#define LV_USE_SVG 0

// ── Logging ───────────────────────────────────────────────────────────────────
#define LV_USE_LOG 0

// ── Performance ───────────────────────────────────────────────────────────────
#define LV_USE_PERF_MONITOR 0
#define LV_USE_MEM_MONITOR  0

// ── Misc ──────────────────────────────────────────────────────────────────────
#define LV_USE_ASSERT_NULL         1
#define LV_USE_ASSERT_MALLOC       1
#define LV_USE_ASSERT_STYLE        0
#define LV_USE_ASSERT_MEM_INTEGRITY 0
#define LV_USE_ASSERT_OBJ          0

#define LV_SPRINTF_CUSTOM 0
#define LV_USE_USER_DATA  1

// ── Theme ─────────────────────────────────────────────────────────────────────
#define LV_USE_THEME_DEFAULT 1
#define LV_THEME_DEFAULT_DARK 1        // Dark mode for Node Zero
#define LV_USE_THEME_SIMPLE  0
#define LV_USE_THEME_MONO    0

// ── Animation ─────────────────────────────────────────────────────────────────
#define LV_USE_ANIMATION 1

#endif /* LV_CONF_H */
