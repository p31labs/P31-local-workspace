#include "bus_mutex.h"
#include "esp_log.h"

static const char *TAG = "bus_mutex";
static SemaphoreHandle_t s_i2c_mutex = NULL;

void bus_mutex_init(void) {
    s_i2c_mutex = xSemaphoreCreateMutex();
    configASSERT(s_i2c_mutex);

    i2c_config_t cfg = {
        .mode             = I2C_MODE_MASTER,
        .sda_io_num       = I2C_MASTER_SDA,
        .scl_io_num       = I2C_MASTER_SCL,
        .sda_pullup_en    = GPIO_PULLUP_ENABLE,
        .scl_pullup_en    = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ,
    };
    ESP_ERROR_CHECK(i2c_param_config(I2C_MASTER_NUM, &cfg));
    ESP_ERROR_CHECK(i2c_driver_install(I2C_MASTER_NUM, I2C_MODE_MASTER, 0, 0, 0));
    ESP_LOGI(TAG, "I2C bus ready (SDA=%d SCL=%d @ %dHz)",
             I2C_MASTER_SDA, I2C_MASTER_SCL, I2C_MASTER_FREQ_HZ);
}

bool bus_mutex_take(uint32_t timeout_ms) {
    return xSemaphoreTake(s_i2c_mutex, pdMS_TO_TICKS(timeout_ms)) == pdTRUE;
}

void bus_mutex_give(void) {
    xSemaphoreGive(s_i2c_mutex);
}

esp_err_t i2c_reg_write(uint8_t dev_addr, uint8_t reg, uint8_t val) {
    if (!bus_mutex_take(50)) return ESP_ERR_TIMEOUT;
    uint8_t buf[2] = {reg, val};
    esp_err_t ret = i2c_master_write_to_device(I2C_MASTER_NUM, dev_addr,
                                               buf, 2, pdMS_TO_TICKS(20));
    bus_mutex_give();
    return ret;
}

esp_err_t i2c_reg_read(uint8_t dev_addr, uint8_t reg, uint8_t *val) {
    if (!bus_mutex_take(50)) return ESP_ERR_TIMEOUT;
    esp_err_t ret = i2c_master_write_read_device(I2C_MASTER_NUM, dev_addr,
                                                  &reg, 1, val, 1,
                                                  pdMS_TO_TICKS(20));
    bus_mutex_give();
    return ret;
}
