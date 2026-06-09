#include "touch.h"
#include "config.h"
#include "bus_mutex.h"
#include "esp_log.h"
#include "esp_lcd_touch.h"
#include "esp_lcd_touch_axs15231b.h"
#include "lvgl.h"

static const char *TAG = "touch";

lv_indev_t *touch_init(void) {
    // Driver will auto-probe I2C address (0x3B) and initialize controller.
    // All I2C bus transactions are serialized via bus_mutex (I2C0 shared).
    esp_lcd_touch_config_t tp_cfg = {
        .x_max = DISPLAY_H_RES - 1,   // logical width after rotation
        .y_max = DISPLAY_V_RES - 1,   // logical height
        .rst_gpio_num = GPIO_NUM_NC,  // no reset wired on Type B
        .int_gpio_num = GPIO_NUM_NC,  // interrupt not used
        .flags = {
            .swap_xy  = 1,   // physical portrait → logical landscape (sw_rotate 90°)
            .mirror_x = 1,   // HW mirror X to match MADCTL
            .mirror_y = 0,
        },
    };

    esp_lcd_touch_handle_t tp = NULL;
    ESP_ERROR_CHECK(esp_lcd_touch_new_i2c_axs15231b(&tp_cfg, &tp));

    lv_indev_t *indev = esp_lcd_touch_register_with_lvgl(tp);
    if (!indev) {
        ESP_LOGE(TAG, "LVGL touch registration failed");
        return NULL;
    }
    ESP_LOGI(TAG, "AXS15231B touch ready (I2C 0x%02X, rot-corrected via tp_cfg)", TOUCH_I2C_ADDR);
    return indev;
}
