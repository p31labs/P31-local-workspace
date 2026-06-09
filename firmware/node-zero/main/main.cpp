#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "esp_err.h"
#include "esp_timer.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "lvgl.h"

// P31 firmware modules
extern "C" {
#include "bus_mutex.h"
#include "display.h"
#include "touch.h"
#include "lora.h"
#include "p31_ui.h"
#include "p31_net.h"
}

static const char *TAG = "main";

// ── LVGL mutex — required for multi-task LVGL access ─────────────────────────
static SemaphoreHandle_t s_lvgl_mutex = NULL;

bool lvgl_lock(uint32_t timeout_ms) {
    return xSemaphoreTake(s_lvgl_mutex, pdMS_TO_TICKS(timeout_ms)) == pdTRUE;
}

void lvgl_unlock(void) {
    xSemaphoreGive(s_lvgl_mutex);
}

// ── LVGL tick: hardware timer ISR increments the LVGL clock ──────────────────
static void lvgl_tick_cb(void *arg) {
    lv_tick_inc(1);  // 1ms increments match the timer period
}

// ── LVGL task: pinned to CPU1, calls lv_timer_handler() every 10ms ───────────
static void lvgl_task(void *arg) {
    lv_disp_t *disp = (lv_disp_t *)arg;

    // Build the P31 UI on the LVGL task (only task that should touch widgets)
    lvgl_lock(portMAX_DELAY);
    p31_ui_init(disp);
    p31_ui_update_status("mesh ready");
    lvgl_unlock();

    while (1) {
        if (lvgl_lock(10)) {
            lv_timer_handler();
            lvgl_unlock();
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

// ── WiFi event handler (minimal — just logs connect/disconnect) ───────────────
static void wifi_event_handler(void *arg, esp_event_base_t base,
                                int32_t id, void *data) {
    if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_LOGW(TAG, "WiFi disconnected — reconnecting");
        esp_wifi_connect();
        p31_ui_update_status("wifi: reconnecting");
    } else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *ev = (ip_event_got_ip_t *)data;
        char buf[32];
        snprintf(buf, sizeof(buf), "ip " IPSTR, IP2STR(&ev->ip_info.ip));
        p31_ui_update_status(buf);
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&ev->ip_info.ip));
    }
}

static void wifi_init(void) {
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t inst_any, inst_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID,
                                                        &wifi_event_handler, NULL, &inst_any));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP,
                                                        &wifi_event_handler, NULL, &inst_got_ip));

    // WiFi credentials — load from NVS in production; compile-time fallback for dev
    // To provision: write "wifi_ssid" and "wifi_pass" to NVS namespace "p31"
    // nvs-set: idf.py -p /dev/ttyUSB0 nvs-set p31 wifi_ssid STRING "YourSSID"
    nvs_handle_t nvs;
    char ssid[64] = {0};
    char pass[64] = {0};
    bool got_creds = false;

    if (nvs_open("p31", NVS_READONLY, &nvs) == ESP_OK) {
        size_t ssid_len = sizeof(ssid);
        size_t pass_len = sizeof(pass);
        if (nvs_get_str(nvs, "wifi_ssid", ssid, &ssid_len) == ESP_OK &&
            nvs_get_str(nvs, "wifi_pass", pass, &pass_len) == ESP_OK) {
            got_creds = true;
        }
        nvs_close(nvs);
    }

    if (!got_creds) {
        ESP_LOGW(TAG, "No WiFi credentials in NVS — running offline");
        return;
    }

    wifi_config_t wifi_cfg = {};
    strncpy((char *)wifi_cfg.sta.ssid, ssid, sizeof(wifi_cfg.sta.ssid) - 1);
    strncpy((char *)wifi_cfg.sta.password, pass, sizeof(wifi_cfg.sta.password) - 1);
    wifi_cfg.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_cfg));
    ESP_ERROR_CHECK(esp_wifi_start());
    esp_wifi_connect();
    ESP_LOGI(TAG, "WiFi connecting to: %s", ssid);
}

// ── LoRa monitor task: polls for received packets every 200ms ─────────────────
static void lora_monitor_task(void *arg) {
    uint8_t buf[256];
    int16_t rssi;
    int8_t  snr;

    while (1) {
        size_t n = lora_rx_get(buf, sizeof(buf), &rssi, &snr);
        if (n > 0) {
            ESP_LOGI(TAG, "LoRa RX %zu bytes RSSI=%d SNR=%d", n, rssi, snr);
            p31_ui_update_lora(lora_state(), rssi);
        } else {
            // Periodic RSSI update even with no packet
            p31_ui_update_lora(lora_state(), -120);  // floor when silent
        }
        vTaskDelay(pdMS_TO_TICKS(200));
    }
}

// ── app_main ──────────────────────────────────────────────────────────────────
extern "C" void app_main(void) {
    ESP_LOGI(TAG, "P31 Node Zero booting — IDF %s", esp_get_idf_version());

    // ── NVS (required by WiFi + config storage) ───────────────────────────────
    esp_err_t nvs_err = nvs_flash_init();
    if (nvs_err == ESP_ERR_NVS_NO_FREE_PAGES || nvs_err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGW(TAG, "NVS partition corrupt — erasing and reinitializing");
        ESP_ERROR_CHECK(nvs_flash_erase());
        nvs_err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(nvs_err);

    // ── Shared I2C bus mutex (PMIC + codec + touch share I2C_NUM_0) ─────────────
    bus_mutex_init();

    // ── PMIC (AXP2101) — must come before peripherals dependent on power rails ─
    // Note: PMIC init lives in board support; display_init() powers backlight via LEDC.
    // For now, bus_mutex covers I2C; PMIC power sequencing is handled by board HW.

    // ── Display (AXS15231B QSPI, LVGL 8.4, sw_rotate=90°) ──────────────────────
    lv_disp_t *disp = display_init();
    if (!disp) {
        ESP_LOGE(TAG, "FATAL: display_init() failed — halting");
        esp_restart();
    }

    // ── Touch (AXS15231B integrated, I2C, tp_cfg-corrected) ────────────────────
    lv_indev_t *touch = touch_init();
    if (!touch) {
        ESP_LOGW(TAG, "Touch unavailable — continuing without input");
    }

    // ── Audio (ES8311 codec) ────────────────────────────────────────────────────
    // Audio init runs on I2C; acquisition handled inside p31_ui (sounds/sfx).
    // Explicit audio_init() not needed for basic tones (tone(2200, 100) pattern).

    // ── Haptic (GPIO output — placeholder) ─────────────────────────────────────
    // Haptic driver not yet present; reserved GPIO to be defined in config.h.

    // ── Sensors (IMU/env — placeholder) ────────────────────────────────────────
    // Sensor bus acquisition deferred to feature modules.

    // ── Identity (DID provisioning — placeholder) ──────────────────────────────
    // Identity boot tasks executed by p31_net_task below.

    // ── LVGL mutex + 1ms hardware tick timer ───────────────────────────────────
    s_lvgl_mutex = xSemaphoreCreateMutex();
    configASSERT(s_lvgl_mutex);

    const esp_timer_create_args_t tick_args = {
        .callback  = lvgl_tick_cb,
        .name      = "lvgl_tick",
    };
    esp_timer_handle_t tick_timer;
    ESP_ERROR_CHECK(esp_timer_create(&tick_args, &tick_timer));
    ESP_ERROR_CHECK(esp_timer_start_periodic(tick_timer, 1000));  // 1000µs = 1ms

    // ── LVGL task — pinned to CPU1, 8KB stack ──────────────────────────────────
    xTaskCreatePinnedToCore(lvgl_task, "lvgl", 8192, disp, 4, NULL, 1);

    // ── Connectivity (WiFi + LoRa mesh) ─────────────────────────────────────────
    wifi_init();

    // ── LoRa init ───────────────────────────────────────────────────────────────
    esp_err_t lora_err = lora_init();
    if (lora_err != ESP_OK) {
        ESP_LOGW(TAG, "LoRa init failed (err %d) — mesh offline", lora_err);
    }

    // ── LoRa monitor task (CPU0, low priority) ──────────────────────────────────
    if (lora_err == ESP_OK) {
        xTaskCreate(lora_monitor_task, "lora_mon", 4096, NULL, 3, NULL);
    }

    // ── Network telemetry task: Q-Factor heartbeat every 5 min ─────────────────
    // Boots DID from NVS, POSTs spoon events, fetches Q-score → updates UI.
    // Delayed 15s internally to let WiFi stabilize before first request.
    xTaskCreate(p31_net_task, "p31_net", 8192, NULL, 3, NULL);

    ESP_LOGI(TAG, "All subsystems started — entering idle");

    // app_main must not return — FreeRTOS tasks carry the system from here
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(10000));
        ESP_LOGI(TAG, "heap free: %lu bytes PSRAM: %lu bytes",
                 (unsigned long)esp_get_free_heap_size(),
                 (unsigned long)heap_caps_get_free_size(MALLOC_CAP_SPIRAM));
    }
}
