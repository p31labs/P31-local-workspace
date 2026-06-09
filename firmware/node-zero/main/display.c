#include "display.h"
#include "config.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_vendor.h"
#include "esp_lcd_axs15231b.h"
#include "driver/spi_master.h"
#include "driver/ledc.h"
#include "driver/gpio.h"
#include "esp_heap_caps.h"
#include "esp_log.h"
#include "lvgl.h"

static const char *TAG = "display";

static esp_lcd_panel_handle_t s_panel     = NULL;
static lv_disp_drv_t          s_disp_drv;
static lv_disp_draw_buf_t     s_draw_buf;

// ── AXS15231B proprietary init sequence ──────────────────────────────────────
// Sequence awakens charge pumps, sets RGB565 pixel format, no hardware rotation.
// Hardware MADCTL rotation (0x36 with swap bits) causes blank/garbled output —
// silicon boundary alignment bug at non-8-pixel increments.
// Rotation is handled entirely by LVGL software (sw_rotate=1 below).
static const axs15231b_lcd_init_cmd_t s_init_seq[] = {
    // 0xBB: wake charge pumps and configure internal logic gates
    {0xBB, (uint8_t[]){0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00}, 8, 0},
    // 0xA0: display function control
    {0xA0, (uint8_t[]){0x00}, 1, 0},
    // 0x36: MADCTL — no rotation, RGB element order (rotation via LVGL sw)
    {0x36, (uint8_t[]){0x00}, 1, 0},
    // 0x3A: COLMOD — 16-bit RGB565 (0x55)
    {0x3A, (uint8_t[]){0x55}, 1, 0},
    // 0x11: Sleep out — mandatory 120ms delay after
    {0x11, NULL, 0, 120},
    // 0x29: Display on
    {0x29, NULL, 0, 20},
};

// ── DMA completion callback — called from ISR ─────────────────────────────────
static bool IRAM_ATTR on_color_trans_done(esp_lcd_panel_io_handle_t io,
                                           esp_lcd_panel_io_event_data_t *edata,
                                           void *user_ctx) {
    lv_disp_drv_t *drv = (lv_disp_drv_t *)user_ctx;
    lv_disp_flush_ready(drv);
    return false; // No high-priority task woken
}

// ── LVGL flush callback ────────────────────────────────────────────────────────
static void lvgl_flush_cb(lv_disp_drv_t *drv, const lv_area_t *area,
                           lv_color_t *color_map) {
    esp_lcd_panel_draw_bitmap(s_panel,
                              area->x1, area->y1,
                              area->x2 + 1, area->y2 + 1,
                              color_map);
    // lv_disp_flush_ready() is called inside on_color_trans_done ISR
}

// ── Backlight (LEDC PWM on channel 0) ─────────────────────────────────────────
static void backlight_init(void) {
    ledc_timer_config_t timer = {
        .speed_mode      = LEDC_LOW_SPEED_MODE,
        .timer_num       = LEDC_TIMER_0,
        .duty_resolution = LEDC_TIMER_8_BIT,
        .freq_hz         = 5000,
        .clk_cfg         = LEDC_AUTO_CLK,
    };
    ledc_timer_config(&timer);

    ledc_channel_config_t ch = {
        .gpio_num   = DISPLAY_BACKLIGHT,
        .speed_mode = LEDC_LOW_SPEED_MODE,
        .channel    = LEDC_CHANNEL_0,
        .intr_type  = LEDC_INTR_DISABLE,
        .timer_sel  = LEDC_TIMER_0,
        .duty       = 0,
        .hpoint     = 0,
    };
    ledc_channel_config(&ch);
}

void display_backlight_set(uint8_t brightness) {
    uint32_t duty = DISPLAY_BL_INVERT ? (255 - brightness) : brightness;
    ledc_set_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, duty);
    ledc_update_duty(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0);
}

// ── Public API ─────────────────────────────────────────────────────────────────
lv_disp_t *display_init(void) {
    // ── Backlight off during init (prevents white flash) ─────────────────────
    backlight_init();
    display_backlight_set(0);

    // ── QSPI bus (SPI2_HOST) ─────────────────────────────────────────────────
    spi_bus_config_t bus = {
        .sclk_io_num     = DISPLAY_CLK,
        .data0_io_num    = DISPLAY_D0,
        .data1_io_num    = DISPLAY_D1,
        .data2_io_num    = DISPLAY_D2,
        .data3_io_num    = DISPLAY_D3,
        .max_transfer_sz = DISPLAY_H_RES * DISPLAY_V_RES * sizeof(uint16_t) + 64,
        .flags           = SPICOMMON_BUSFLAG_QUAD,
    };
    ESP_ERROR_CHECK(spi_bus_initialize(DISPLAY_HOST, &bus, SPI_DMA_CH_AUTO));

    // ── Panel IO ──────────────────────────────────────────────────────────────
    esp_lcd_panel_io_handle_t io = NULL;
    esp_lcd_panel_io_spi_config_t io_cfg = {
        .cs_gpio_num      = DISPLAY_CS,
        .dc_gpio_num      = DISPLAY_DC,   // GPIO_NUM_NC — no DC in QSPI mode
        .spi_mode         = 0,
        .pclk_hz          = DISPLAY_CLK_HZ,
        .trans_queue_depth = 10,
        .on_color_trans_done = on_color_trans_done,
        .user_ctx         = &s_disp_drv,
        .lcd_cmd_bits     = 32,           // AXS15231B 32-bit command format
        .lcd_param_bits   = 8,
        .flags = { .quad_mode = true },
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_io_spi(DISPLAY_HOST, &io_cfg, &io));

    // ── AXS15231B panel ───────────────────────────────────────────────────────
    axs15231b_vendor_config_t vendor = {
        .init_cmds      = s_init_seq,
        .init_cmds_size = sizeof(s_init_seq) / sizeof(s_init_seq[0]),
        .flags = {
            .mirror_by_cmd      = true,
            .use_qspi_interface = true,
        },
    };
    esp_lcd_panel_dev_config_t panel_cfg = {
        .reset_gpio_num  = DISPLAY_RST,         // GPIO_NUM_NC
        .rgb_ele_order   = LCD_RGB_ELEMENT_ORDER_RGB,
        .bits_per_pixel  = 16,
        .vendor_config   = &vendor,
    };
    ESP_ERROR_CHECK(esp_lcd_new_panel_axs15231b(io, &panel_cfg, &s_panel));
    ESP_ERROR_CHECK(esp_lcd_panel_reset(s_panel));
    ESP_ERROR_CHECK(esp_lcd_panel_init(s_panel));
    ESP_ERROR_CHECK(esp_lcd_panel_disp_on_off(s_panel, true));
    ESP_LOGI(TAG, "AXS15231B panel initialized");

    // ── LVGL init ─────────────────────────────────────────────────────────────
    // lv_init() MUST precede lv_disp_drv_register()
    lv_init();

    // ── Double buffer in PSRAM (full-frame avoids ThorVG tiling penalty) ──────
    size_t buf_sz = (size_t)DISPLAY_H_RES * DISPLAY_V_RES * sizeof(lv_color_t);
    lv_color_t *buf1 = heap_caps_malloc(buf_sz, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
    lv_color_t *buf2 = heap_caps_malloc(buf_sz, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
    if (!buf1 || !buf2) {
        ESP_LOGE(TAG, "PSRAM display buffer alloc failed — check sdkconfig SPIRAM_MODE_OCT");
        return NULL;
    }
    lv_disp_draw_buf_init(&s_draw_buf, buf1, buf2, DISPLAY_H_RES * DISPLAY_V_RES);

    // ── LVGL display driver ───────────────────────────────────────────────────
    lv_disp_drv_init(&s_disp_drv);
    s_disp_drv.hor_res      = DISPLAY_H_RES;
    s_disp_drv.ver_res      = DISPLAY_V_RES;
    s_disp_drv.flush_cb     = lvgl_flush_cb;
    s_disp_drv.draw_buf     = &s_draw_buf;
    s_disp_drv.user_data    = s_panel;
    s_disp_drv.full_refresh = 1;     // Required for PSRAM double-buffer mode
    // sw_rotate: LVGL rotates the pixel buffer in RAM before DMA transfer.
    // Do NOT use esp_lcd_panel_swap_xy() — it invokes AXS15231B hardware
    // rotation which crashes at non-8-pixel boundaries (silicon bug).
    s_disp_drv.sw_rotate    = 1;
    s_disp_drv.rotated      = DISPLAY_LVGL_ROT;

    lv_disp_t *disp = lv_disp_drv_register(&s_disp_drv);
    if (!disp) {
        ESP_LOGE(TAG, "LVGL display driver registration failed");
        return NULL;
    }

    // ── Backlight fade in ─────────────────────────────────────────────────────
    for (int i = 0; i <= 200; i += 5) {
        display_backlight_set((uint8_t)i);
        vTaskDelay(pdMS_TO_TICKS(5));
    }
    display_backlight_set(200); // ~78% — comfortable default

    ESP_LOGI(TAG, "LVGL 8.4 registered (%dx%d, sw_rotate=90°, PSRAM double-buf %zuKB)",
             DISPLAY_H_RES, DISPLAY_V_RES, (buf_sz * 2) / 1024);
    return disp;
}

esp_lcd_panel_handle_t display_get_panel(void) { return s_panel; }
