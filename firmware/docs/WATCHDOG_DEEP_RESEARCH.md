# Deep Research: ESP32-S3 Watchdog Timeout During LCD Panel Init

## Problem Statement

The ESP32-S3 firmware encounters a **Task Watchdog Timeout** at exactly 6 seconds after `esp_lcd_panel_init()` is called. The watchdog triggers before the display finishes initializing.

## Hardware Configuration

- **Chip:** ESP32-S3 (QFN56) revision v0.2
- **Display:** AXS15231B (320×480) with QSPI interface
- **Interface:** SPI2_HOST (FSPI) in QSPI mode
- **DMA:** SPI_DMA_CH_AUTO configured
- **Clock:** 160 MHz (likely due to flash/PSRAM constraints)

## Current Pin Mapping (Verified Correct)

| Signal | GPIO | Notes |
|--------|------|-------|
| LCD_CLK | 10 | QSPI clock |
| LCD_D0 | 11 | QSPI data 0 |
| LCD_D1 | 12 | QSPI data 1 |
| LCD_D2 | 13 | QSPI data 2 |
| LCD_D3 | 14 | QSPI data 3 |
| LCD_CS | 9 | Chip select |
| LCD_RST | 18 | Reset |

## Observed Behavior

```
I (1035) DISPLAY: Initializing AXS15231B...
I (1045) lcd_panel.axs15231b: LCD panel create success, version: 2.1.0
E (6035) task_wdt: Task watchdog got triggered.
```

- Panel creation succeeds (vendor driver reports success)
- Initialization takes >6 seconds (watchdog default timeout)
- Backtrace shows `panel_axs15231b_init` → `esp_lcd_panel_init` → `esp_lcd_panel_io_tx_param` → `spi_device_polling_transmit`

## Root Cause Analysis

The backtrace reveals the issue:
```
spi_device_polling_transmit  (NOT using DMA/interrupts)
panel_axs15231b_init
esp_lcd_panel_init
```

The vendor driver (`esp_lcd_axs15231b.c`) is calling `esp_lcd_panel_io_tx_param()` which uses **polling mode** instead of async DMA. The initialization sequence sends many small SPI commands sequentially, each blocking until complete.

## What We've Tried

1. ✅ Added `vTaskDelay(1)` after `spi_bus_initialize` - **Insufficient**
2. ✅ Confirmed QSPI pins are correct (GPIO 11-14) - **Verified**
3. ✅ DMA channel is auto-configured - **Correct**

## Research Questions

### Primary Question
How do we prevent the Task Watchdog from triggering during `esp_lcd_panel_init()` for the AXS15231B display controller on ESP32-S3?

### Secondary Questions

1. **Task-based Solution:**
   - How to create a dedicated initialization task for display?
   - Should the task have higher or lower priority than main?
   - How to properly pass the panel handle back to main after init?

2. **Watchdog Configuration:**
   - How to selectively disable task watchdog for a specific task during init?
   - How to use `esp_task_wdt_init()` or `esp_task_wdt_add()` properly?
   - Is there a way to configure the watchdog to ignore blocking SPI transfers?

3. **Vendor Driver Modification:**
   - Can we modify the axs15231b vendor driver to use async callbacks?
   - How to wrap the blocking init in `esp_task_for_core_zero()` or similar?
   - Can we inject a yield/vTaskDelay into the vendor init sequence?

4. **Alternative Approaches:**
   - Use `esp_lcd_panel_draw_bitmap` immediately after init to unblock?
   - Run display init on CPU1 instead of CPU0?
   - Increase CPU frequency during init then drop back?

## Technical Context

- ESP-IDF v5.5.3
- FreeRTOS with tickless idle
- Task Watchdog enabled by default
- SPI using esp_driver_spi component
- AXS15231B from espressif__esp_lcd_axs15231b managed component

## Success Criteria

1. Display initialization completes without watchdog timeout
2. Solution is maintainable (not a hack)
3. Subsequent display operations work correctly
4. Watchdog remains functional for runtime protection
