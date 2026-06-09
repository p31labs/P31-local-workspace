# Node One Firmware Configuration
## Based on xiaozhi-esp32 v1.9.0+ Release Notes

**Document Version:** 1.0  
**Date:** March 24, 2026  
**Reference:** xiaozhi-esp32 v1.7.2 → v1.9.0+

---

## Overview

This document captures the firmware configuration updates for Node One (The Totem) based on the xiaozhi-esp32 project v1.9.0+ release notes. These improvements enhance display performance, audio stability, and touch accuracy on the ESP32-S3 platform.

---

## Key Changes from v1.7.2

### 1. Display & UI Performance

| Feature | v1.7.2 (Old) | v1.9.0+ (New) |
|---------|---------------|---------------|
| Stability | Occasional USB crashes | Watchdog timeout increased |
| Color Depth | Manual 16_SWAP required | Auto-detected |
| UI Speed | High PSRAM copy overhead | Zero-copy DMA paths |

**Configuration Applied:**
- `CONFIG_LV_COLOR_16_SWAP=y` - Ensures correct color byte ordering
- `CONFIG_SPIRAM_FREQ=80M` - Optimized for 8MB Octal PSRAM
- `CONFIG_LV_DISPLAY_SPI_CLOCK=40000000` - Stable 40MHz operation

### 2. Audio Subsystem (ES8311)

**Critical Fix:** GPIO 44 conflict resolved via MCLK-less operation.

| Feature | v1.7.2 | v1.9.0+ |
|---------|--------|---------|
| MCLK | GPIO 44 (conflicts with UART) | Disabled (derived from Bit Clock) |
| Audio Pop | Buffer underrun | Increased DMA buffers |
| Microphone | Basic | AEC enabled |

**Configuration Applied:**
- `CONFIG_ES8311_MCLK_LESS=y` - Frees GPIO 44
- `CONFIG_I2S_DMA_BUFFER_SIZE=512` - Prevents audio cut-off
- `CONFIG_I2S_AEC_ENABLED=y` - Echo cancellation for MIC (GPIO 40)

### 3. Touch & Gestures

| Feature | v1.7.2 | v1.9.0+ |
|---------|--------|---------|
| Coordinates | Manual inversion needed | Hardware-level swap flags |
| Gestures | Accidental triggers | Improved threshold logic |

**Configuration Applied:**
- `CONFIG_TOUCH_SWAP_X_Y=y`
- `CONFIG_TOUCH_INVERT_X=y`
- `CONFIG_TOUCH_INVERT_Y=y`
- `CONFIG_TOUCH_GESTURE_SWIPE_THRESHOLD=20`

### 4. Memory Management

**Critical:** Prevents `StoreProhibited` crashes.

| Feature | v1.7.2 | v1.9.0+ |
|---------|--------|---------|
| UI Assets | Internal RAM | PSRAM |
| DMA Buffers | PSRAM | Internal RAM (64KB pool) |

**Configuration Applied:**
- `CONFIG_ESP32S3_DATA_CACHE_LINE_64B=y` - PSRAM alignment
- `CONFIG_ESP_SYSTEM_ALLOW_RTC_FAST_MEM_ALWAYS=y`
- `CONFIG_SPIRAM_MALLOC_ALWAYS_INTERNAL=y` - DMA buffers in internal RAM

---

## GPIO Pin Mapping

| GPIO | Function | Notes |
|------|----------|-------|
| 0 | BOOT Button | |
| 1 | UART TX | Debug console |
| 3 | UART RX | Debug console |
| 6 | Backlight PWM | Power management |
| 40 | Microphone (I2S) | AEC enabled |
| 44 | **AVAILABLE** | MCLK-less frees this pin |
| 46 | Speaker | I2S output |
| 47 | Touch IRQ | AXS15231B |
| 48 | Touch MOSI | QSPI |
| 45 | Touch MISO | QSPI |
| 21 | Touch CS | QSPI |
| 14 | Display SCK | QSPI |
| 13 | Display MOSI | QSPI |
| 12 | Display MISO | QSPI |
| 11 | Display CS | QSPI |
| 10 | Display DC | QSPI |

---

## Build Instructions

```bash
# Navigate to firmware directory
cd software/firmware/node-one

# Initialize ESP-IDF
. $IDF_PATH/export.sh

# Configure project
idf.py menuconfig

# Build and flash
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

---

## Verification Checklist

After flashing v1.9.0+ firmware, verify:

- [ ] Display shows correct colors (no inversion)
- [ ] Touch coordinates are accurate (no offset)
- [ ] Audio plays without pop/crackle
- [ ] Microphone captures with echo cancellation
- [ ] No boot loops (UART console works)
- [ ] PSRAM usage optimized (check with `heap_info`)

---

## Troubleshooting

### Issue: Display shows inverted colors
**Fix:** Ensure `CONFIG_LV_COLOR_16_SWAP=y` is set

### Issue: Boot loop after flash
**Cause:** GPIO 44 conflict with UART
**Fix:** Use MCLK-less ES8311 config (`CONFIG_ES8311_MCLK_LESS=y`)

### Issue: Touch points offset
**Fix:** Enable `CONFIG_TOUCH_INVERT_X=y` and `CONFIG_TOUCH_INVERT_Y=y`

### Issue: Audio pop at start/end
**Fix:** Increase I2S DMA buffers (512 minimum)

---

## Related Documents

- [MIT-002-KILO-HARDWARE-INTEGRATION.md](../../admin/MIT-002-KILO-HARDWARE-INTEGRATION.md)
- [P31 Cognitive Passport - Node One Hardware](../../P31_COGNITIVE_PASSPORT.md)

---

**Document Status:** ✅ Complete  
**Next Review:** April 24, 2026

🔺💜 THE DELTA IS ONLINE. THE MESH HOLDS. 🔺💜