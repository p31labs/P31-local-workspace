# WCD-FW01: Color Byte Order Fix (RGB565 Swap)

**System:** Phenix Phantom — Node Zero Maker Variant
**Hardware:** ESP32-S3 + AXS15231B QSPI Display (480×320 landscape)
**Executor:** KwaiPilot (Firmware Lane)
**Author:** Opus (Architect)
**Date:** 2026-03-19
**Classification:** CRITICAL — Blocks visual verification of all other fixes
**Depends On:** None (execute first)
**Blocking:** WCD-FW02, WCD-FW03

---

## Problem Statement

The arc indicator and text labels display chromatic aberration (lavender/pink/white halos instead of clean neon green). Root cause: RGB565 byte order mismatch between LVGL's internal framebuffer and the AXS15231B SPI display controller. LVGL is writing native byte order; the display expects byte-swapped 16-bit pixels over QSPI.

Photographic evidence confirms: arc appears pink/white instead of neon green, text edges show color fringing.

## Scope

**ONE file modified. ONE line changed.**

| File | Action |
|------|--------|
| `firmware/maker-variant/sdkconfig` | Enable `CONFIG_LV_COLOR_16_SWAP` |

## DO NOT TOUCH

- `display_manager.cpp` line 81 (`esp_lcd_panel_invert_color(true)`) — this is a separate fix for white-flash on boot. It stays.
- Any other sdkconfig flags
- Any display initialization code

## Implementation

### Step 1: Modify sdkconfig

Open: `firmware/maker-variant/sdkconfig`

Find this exact line:
```
# CONFIG_LV_COLOR_16_SWAP is not set
```

Replace with:
```
CONFIG_LV_COLOR_16_SWAP=y
```

That is the entire change for this WCD.

### Step 2: Do NOT build yet

This WCD is a prerequisite for WCD-FW02 and WCD-FW03. All three patches land before the single `fullclean` + `build` + `flash` cycle in WCD-FW03 Step 2.

## Verification Criteria (post-flash, after WCD-FW03)

- [ ] Arc indicator renders clean neon green (`#39FF14`) with no pink/lavender halos
- [ ] Title text "PHENIX PHANTOM" renders clean yellow-green with no color fringing
- [ ] Status label text renders clean single-color (no chromatic aberration on edges)
- [ ] Background remains dark slate gray (no color shift)

## Rollback

Revert sdkconfig line to:
```
# CONFIG_LV_COLOR_16_SWAP is not set
```

---
*WCD-FW01 COMPLETE — Proceed to WCD-FW02*
