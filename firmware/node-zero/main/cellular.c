#include "cellular.h"
#include "esp_log.h"
#include "driver/uart.h"
#include "esp_system.h"
#include "nvs_flash.h"   /* for NVS storage later */
#include <string.h>

static const char *TAG = "cellular";

/* UART config – to be matched to board wiring after hardware ID */
#define CELLULAR_UART_NUM    UART_NUM_2
#define CELLULAR_TX_PIN      GPIO_NUM_16   /* placeholder — verify on board */
#define CELLULAR_RX_PIN      GPIO_NUM_17   /* placeholder */
#define CELLULAR_BAUD        115200

/* Modem power‑enable (AXP2101) placeholder */
#define CELLULAR_EN_GPIO     GPIO_NUM_NC   /* not yet mapped */

bool cellular_init(void) {
    ESP_LOGI(TAG, "Initialising cellular modem (stub)");
    /* UART init */
    uart_config_t ucfg = {
        .baud_rate = CELLULAR_BAUD,
        .data_bits = UART_DATA_8_BITS,
        .parity    = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_APB,
    };
    ESP_ERROR_CHECK(uart_param_config(CELLULAR_UART_NUM, &ucfg));
    ESP_ERROR_CHECK(uart_set_pin(CELLULAR_UART_NUM, CELLULAR_TX_PIN, CELLULAR_RX_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
    ESP_ERROR_CHECK(uart_driver_install(CELLULAR_UART_NUM, 1024, 0, 0, NULL, 0));

    /* Power enable pin via AXP2101 (future) */

    /* Basic AT check */
    uart_write_bytes(CELLULAR_UART_NUM, "AT\r\n", 4);
    vTaskDelay(pdMS_TO_TICKS(100));
    uint8_t buf[64];
    int len = uart_read_bytes(CELLULAR_UART_NUM, buf, sizeof(buf)-1, 0);
    if (len > 0) {
        buf[len] = 0;
        if (strstr((char*)buf, "OK")) {
            ESP_LOGI(TAG, "Modem responded to AT");
            return true;
        }
    }
    ESP_LOGW(TAG, "No modem response – stub only; hardware not yet identified");
    return false;  /* stub – will succeed after pin mapping */
}

void cellular_shutdown(void) {
    ESP_LOGI(TAG, "Cellular shutdown (stub)");
    uart_driver_delete(CELLULAR_UART_NUM);
}

const char *cellular_get_info(void) {
    return "modem_stub (unidentified)";
}

int cellular_get_rssi(void) {
    return -1;  /* not implemented */
}

const char *cellular_get_operator(void) {
    return "unknown";
}
