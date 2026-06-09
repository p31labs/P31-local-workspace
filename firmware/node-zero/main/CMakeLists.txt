idf_component_register(
    SRCS
        "main.cpp"
        "bus_mutex.c"
        "display.c"
        "touch.c"
        "lora.c"
        "p31_ui.c"
        "p31_net.c"
    INCLUDE_DIRS
        "."
        "${CMAKE_CURRENT_SOURCE_DIR}/../../boards/waveshare-s3-touch-lcd-3.5b-nodezero"
    REQUIRES
        driver
        esp_timer
        esp_wifi
        nvs_flash
        esp_lcd
        esp_lcd_axs15231b
        esp_lcd_touch_axs15231b
        lvgl
        esp_codec_dev
        esp_http_client
        esp_crt_bundle
        cjson
        log
        freertos
        spi_flash
)

# Copy lv_conf.h to the location LVGL's build system expects
set(LV_CONF_DIR ${CMAKE_CURRENT_SOURCE_DIR})
target_compile_definitions(${COMPONENT_LIB} PUBLIC
    "-DLV_CONF_INCLUDE_SIMPLE"
    "-DLV_CONF_PATH=${LV_CONF_DIR}/lv_conf.h"
)
