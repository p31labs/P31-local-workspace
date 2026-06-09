# DeepSeek Prompt: ESP32-S3 LCD Panel Watchdog Timeout Fix

## Context

You are debugging an ESP32-S3 firmware project using ESP-IDF v5.5.3. The firmware initializes an AXS15231B LCD panel (320×480, QSPI interface) but encounters a **Task Watchdog Timeout** exactly 6 seconds after calling `esp_lcd_panel_init()`.

## The Problem

```
I (1035) DISPLAY: Initializing AXS15231B...
I (1045) lcd_panel.axs15231b: LCD panel create success, version: 2.1.0
E (6035) task_wdt: Task watchdog got triggered.
```

The panel creation succeeds, but the subsequent initialization (`esp_lcd_panel_init`) takes >6 seconds, triggering the default task watchdog.

## Technical Stack

- ESP32-S3 (QFN56) @ 160 MHz
- ESP-IDF v5.5.3
- AXS15231B display driver via `espressif__esp_lcd_axs15231b` component
- SPI2_HOST (FSPI) in QSPI mode
- DMA enabled (SPI_DMA_CH_AUTO)
- QSPI pins: GPIO 10 (CLK), 11-14 (D0-D3), 9 (CS), 18 (RST)

## Backtrace Analysis

```
panel_axs15231b_init (vendor driver)
esp_lcd_panel_init (ESP-IDF)
esp_lcd_panel_io_tx_param (ESP-IDF SPI I/O)
spi_device_polling_transmit (esp_driver_spi)
```

The vendor driver uses **polling mode** SPI transfers, not async DMA. The init sequence sends many small commands sequentially, each blocking until complete.

## What You've Tried

1. ✅ Added `vTaskDelay(1)` after `spi_bus_initialize` - **Failed** (not enough)
2. ✅ Verified QSPI pins (GPIO 11-14) - **Correct**
3. ✅ DMA is auto-configured - **Correct**

## Your Question

**How do we definitively fix this watchdog timeout during LCD panel initialization?**

We need a solution that:
1. Allows the display init to complete (>6 seconds)
2. Keeps the watchdog functional for runtime protection
3. Is maintainable (not a hack like disabling watchdog entirely)

## Specific Approaches to Evaluate

1. **Move init to dedicated task:**
   - Create a separate FreeRTOS task for display init
   - Lower priority so it can be preempted
   - How to pass panel handle back to main?

2. **Watchdog management:**
   - Use `esp_task_wdt_add()` to exclude this task from watchdog
   - Use `esp_task_wdt_init()` to temporarily increase timeout
   - Call `esp_task_wdt_reset()` in a tight loop during init (hacky but might work)

3. **CPU affinity:**
   - Run init on CPU1 instead of CPU0
   - Does CPU1 have its own watchdog?

4. **Vendor driver modification:**
   - Modify axs15231b to use callbacks instead of polling
   - Inject yields into init sequence
   - Is there a config option in menuconfig?

5. **SPI configuration:**
   - Use interrupt-driven mode instead of polling
   - Is there a way to make `esp_lcd_panel_io_tx_param` async?

## Deliverable

Provide a concrete code solution (C/C++ for ESP-IDF) that:
1. Compiles and runs on ESP32-S3
2. Successfully initializes the AXS15231B display
3. Does not trigger the task watchdog
4. Maintains watchdog protection for the rest of the application

Include any necessary CMake changes or menuconfig settings.
