# WCD-FW03: UI Status Logic Fix + Clean Build + Flash

**System:** Phenix Phantom — Node Zero Maker Variant
**Hardware:** ESP32-S3 + AXS15231B QSPI Display (480×320 landscape)
**Executor:** KwaiPilot (Firmware Lane)
**Author:** Opus (Architect)
**Date:** 2026-03-19
**Classification:** CRITICAL — Final WCD in sequence; triggers build and flash
**Depends On:** WCD-FW01 (sdkconfig patched), WCD-FW02 (touch_manager patched)
**Blocking:** None (this is the terminal WCD)

---

## Problem Statement

Two issues in `ui_core.cpp`:

1. **Duplicate status logic block (lines 123–133):** A second `if/else` block unconditionally overrides the correct 3-threshold status logic (lines 98–121) above it. This is why the display shows "COHERENT" and "COH:0%" simultaneously — the duplicate block uses a simple 0.60 threshold that always runs last and clobbers the correct state.

2. **Stale binary on flash:** The current `ui_core.cpp` source already has `%d` integer format fixes applied (fixing the "Q:f P:f" display bug), but a CMake cache path mismatch (`C:/Users/sandra/.../esp-idf-v5.5.3` vs `C:/esp/v5.5.3/esp-idf`) caused build failure. The device is still running the old binary. A `fullclean` resolves this.

## Scope

**ONE file modified. ONE block deleted. Then: full clean build and flash.**

| File | Action |
|------|--------|
| `firmware/maker-variant/main/ui_core.cpp` | Delete duplicate status block (lines 123–133) |
| Build system | `fullclean` → `build` → `flash monitor` |

## DO NOT TOUCH

- Lines 98–121 of `ui_core.cpp` — this is the CORRECT 3-threshold status logic. Do not modify.
- `sdkconfig` — already patched in WCD-FW01
- `touch_manager.cpp` — already patched in WCD-FW02
- `display_manager.cpp` — no changes needed

## Implementation

### Step 1: Delete duplicate status block in ui_core.cpp

Open: `firmware/maker-variant/main/ui_core.cpp`

Find and **DELETE** the entire block at approximately lines 123–133. This is the block to remove:

```c
if (current_coherence < 0.60f) {
    lv_obj_set_style_arc_color(coh_arc, lv_color_hex(COLOR_AMBER), LV_PART_INDICATOR);
    lv_obj_set_style_text_color(label_value, lv_color_hex(COLOR_AMBER), 0);
    lv_label_set_text(label_status, "SEEKING");
    lv_obj_set_style_text_color(label_status, lv_color_hex(COLOR_AMBER), 0);
} else {
    lv_obj_set_style_arc_color(coh_arc, lv_color_hex(COLOR_NEON_GREEN), LV_PART_INDICATOR);
    lv_obj_set_style_text_color(label_value, lv_color_hex(COLOR_NEON_GREEN), 0);
    lv_label_set_text(label_status, "COHERENT");
    lv_obj_set_style_text_color(label_status, lv_color_hex(COLOR_BRIGHT_CYAN), 0);
}
```

**How to identify it:** It is the SECOND `if (current_coherence ...)` block that sets status labels. The FIRST one (lines 98–121) has THREE thresholds (`< 0.30`, `< 0.60`, `else`) and is correct. The SECOND one (the one to delete) has only TWO branches (`< 0.60`, `else`) and is the duplicate.

Delete the entire block. Do not leave blank lines or orphaned braces.

### Step 2: Verify the correct block remains

After deletion, confirm lines 98–121 (approximately) contain this 3-threshold structure:

```c
if (current_coherence < 0.30f) {
    // RED state — "CRITICAL" or "SEEKING"
    // ... sets arc color, text color, status label
} else if (current_coherence < 0.60f) {
    // AMBER state — "SEEKING" or "STABILIZING"
    // ... sets arc color, text color, status label
} else {
    // GREEN state — "COHERENT"
    // ... sets arc color, text color, status label
}
```

This block must be the ONLY status logic that runs. No other `if` block should set `label_status` text after it.

### Step 3: Clean build and flash

All three wcds are now applied. Execute:

```bash
cd /c/Users/sandra/Documents/P31_Andromeda/firmware/maker-variant
idf.py fullclean
idf.py build
idf.py -p COM4 flash monitor
```

**Why `fullclean`:** The CMake cache has a stale path reference (`C:/Users/sandra/.../esp-idf-v5.5.3` vs the actual `C:/esp/v5.5.3/esp-idf`). `fullclean` wipes the entire `build/` directory and CMake cache. The `sdkconfig` file persists (including the `CONFIG_LV_COLOR_16_SWAP=y` from WCD-FW01).

**Expected build behavior:**
- CMake reconfigures from scratch against `C:/esp/v5.5.3/esp-idf`
- All source files recompile (including patched `touch_manager.cpp` and `ui_core.cpp`)
- Binary includes all three WCD fixes
- Flash writes the new binary to device

### Step 4: Monitor serial output

After `flash monitor`, watch for:
- LVGL initialization log (confirms display driver loaded)
- Touch controller I2C init success
- No `%f` format warnings in telemetry output
- Coherence value starting at 0.99 (not 0.00)

## Verification Criteria (ALL THREE wcds)

### WCD-FW01 — Color
- [ ] Arc indicator: clean neon green (`#39FF14`), no pink/lavender halos
- [ ] Title text: clean color, no chromatic aberration on edges
- [ ] Background: dark slate gray, no color shift

### WCD-FW02 — Touch
- [ ] Tap screen center → coherence drops to 0.30 with audio pop
- [ ] Tap top-left → event in top-left (not mirrored)
- [ ] Tap bottom-right → event in bottom-right
- [ ] Swipe down → emergency reset overlay

### WCD-FW03 — UI Logic
- [ ] Telemetry bar shows `Q:0.01 P:0.99 | PRED: STABLE` (no literal `f` characters)
- [ ] No `WIFI:` label visible (old binary artifact gone)
- [ ] COH% matches actual coherence value (not stuck at 0%)
- [ ] Status transitions: SEEKING (red, <0.30) → STABILIZING (amber, <0.60) → COHERENT (green, ≥0.60)
- [ ] Coherence starts at 0.99 on boot, not 0.00

### Touch Mirror Adjustment (if needed)
If horizontal mirror: toggle `mirror_x` in `touch_manager.cpp` (`1` → `0`)
If vertical mirror: toggle `mirror_y` in `touch_manager.cpp` (`0` → `1`)
Then: `idf.py build && idf.py -p COM4 flash monitor` (no fullclean needed for mirror tweak)

## Rollback

To revert all three wcds:
1. `sdkconfig`: restore `# CONFIG_LV_COLOR_16_SWAP is not set`
2. `touch_manager.cpp`: restore original manual coordinate remap
3. `ui_core.cpp`: restore duplicate status block
4. `idf.py fullclean && idf.py build && idf.py -p COM4 flash`

---
*WCD-FW03 COMPLETE — All three wcds applied. Flash and verify.*
