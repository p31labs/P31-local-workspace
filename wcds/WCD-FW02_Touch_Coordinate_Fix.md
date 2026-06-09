# WCD-FW02: Touch Coordinate Mapping Fix

**System:** Phenix Phantom — Node Zero Maker Variant
**Hardware:** ESP32-S3 + AXS15231B QSPI Display (480×320 landscape) + I2C Touch Controller
**Executor:** KwaiPilot (Firmware Lane)
**Author:** Opus (Architect)
**Date:** 2026-03-19
**Classification:** CRITICAL — Touch input non-functional
**Depends On:** WCD-FW01 (sdkconfig must be patched first)
**Blocking:** WCD-FW03

---

## Problem Statement

The I2C touch controller initializes successfully (TCH:27 visible on display confirms I2C bus healthy and controller reporting). However, no input events reach the LVGL UI. Root cause: `touch_manager.cpp` manually swaps and inverts raw coordinates in the LVGL read callback. The inversion formula `320 - touch_points[0].x` pushes touches out of bounds or maps them to wrong screen regions. The correct approach is to configure the driver's hardware orientation flags and pass raw (already-transformed) coordinates through to LVGL.

## Scope

**ONE file modified. TWO changes.**

| File | Action |
|------|--------|
| `firmware/maker-variant/main/touch_manager.cpp` | 1. Set hardware flags in `tp_cfg` 2. Simplify read callback |

## DO NOT TOUCH

- `display_manager.cpp` — display orientation is handled separately
- `sdkconfig` — already patched in WCD-FW01
- Any I2C initialization code — the bus is working correctly
- The touch controller's I2C address or GPIO assignments

## Implementation

### Step 1: Fix hardware flags in tp_cfg

Open: `firmware/maker-variant/main/touch_manager.cpp`

Find the `esp_lcd_touch_config_t tp_cfg` struct. Replace the `.flags` block with:

```c
esp_lcd_touch_config_t tp_cfg = {
    .x_max = 480,   // landscape width
    .y_max = 320,   // landscape height
    .rst_gpio_num = (gpio_num_t)-1,
    .int_gpio_num = (gpio_num_t)-1,
    .flags = {
        .swap_xy = 1,   // physical portrait chip → landscape display
        .mirror_x = 1,  // match display 0x36=0x60 MX=1
        .mirror_y = 0,
    },
};
```

**Key decisions:**
- `swap_xy = 1` — the touch panel is physically portrait; display is landscape
- `mirror_x = 1` — matches the display's MADCTL register (0x36 = 0x60, MX=1)
- `mirror_y = 0` — start here; may need empirical toggle (see Verification)

### Step 2: Simplify the LVGL read callback

In the same file, find the touch read callback function (the function registered with `lv_indev_drv_t` that reads `touch_points`).

Remove ALL manual coordinate swapping and inversion. The callback should pass through raw coordinates only:

```c
data->point.x = touch_points[0].x;
data->point.y = touch_points[0].y;
```

**Delete** any lines that look like:
- `data->point.x = 320 - touch_points[0].y;`
- `data->point.y = touch_points[0].x;`
- Any manual swap/invert/remap logic

The driver's hardware flags (Step 1) now handle all orientation transformation before coordinates reach the callback.

### Step 3: Do NOT build yet

Proceed to WCD-FW03 for the ui_core.cpp fix. All three patches build together.

## Verification Criteria (post-flash, after WCD-FW03)

- [ ] Tap center of screen → coherence drops to 0.30 with audio pop
- [ ] Tap top-left corner of screen → event registers in top-left region (not mirrored)
- [ ] Tap bottom-right corner → event registers in bottom-right region
- [ ] Swipe down → emergency reset overlay triggers

## Empirical Mirror Adjustment

If after flashing, touches are **horizontally mirrored** (left tap registers right):
→ Toggle `mirror_x`: change `1` → `0`

If touches are **vertically mirrored** (top tap registers bottom):
→ Toggle `mirror_y`: change `0` → `1`

Only ONE reflash should be needed at most. Start with `mirror_x=1, mirror_y=0` as specified.

## Rollback

Restore the original manual coordinate remap logic in the callback and revert `tp_cfg.flags` to original values.

---
*WCD-FW02 COMPLETE — Proceed to WCD-FW03*
