# DeepSeek CWP-046 Output — Reference Only

**Status: DO NOT USE — contains critical GPIO errors for the Type B board.**

This is the raw DeepSeek output from CWP-046 execution on 2026-05-05.
Kept for audit trail. The correct implementation is in `main/display.c`.

## Critical Errors vs. Type B Board

| Error | Generated | Correct (from boards/waveshare-s3-touch-lcd-3.5b-nodezero/config.h) |
|-------|-----------|----------------------------------------------------------------------|
| QSPI CLK | GPIO 10 | GPIO 5 (DISPLAY_CLK) |
| QSPI CS | GPIO 9 | GPIO 12 (DISPLAY_CS) |
| QSPI D0-D3 | quadwp/quadhd = -1 (DISABLED) | GPIO 1,2,3,4 |
| Backlight | not implemented | GPIO 6, LEDC PWM (DISPLAY_BACKLIGHT) |
| lcd_cmd_bits | 8 | 32 (AXS15231B QSPI protocol) |
| AXS15231B init | none | 6-command wake sequence in s_init_seq[] |
| Reset control | TCA9554 "assumed bit 0" | DISPLAY_RST = GPIO_NUM_NC — not wired |
| TCA9554 | wired in, assumed present | NOT on Type B board |
| Flush cb | C++ lambda in .c file | C function pointer, IRAM_ATTR ISR |
| LVGL buffer | 480×20 partial | 480×320 full-frame double buffer (PSRAM) |
| SPIRAM speed | 120M | 80M (conservative, stable on N16R8) |

## Raw Generated Output

```
[The complete DeepSeek firmware output was received 2026-05-05.
Files: CMakeLists.txt, sdkconfig.defaults, main.c, display.c, i2c_master.c.
All superseded by the existing C++ implementation.]
```
