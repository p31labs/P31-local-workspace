#pragma once
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "driver/i2c.h"
#include "config.h"

#ifdef __cplusplus
extern "C" {
#endif

// Initialize the shared I2C bus and its FreeRTOS mutex.
// Must be called before any peripheral (PMIC, codec, touch) is accessed.
void    bus_mutex_init(void);

// Acquire I2C bus. Returns true on success, false on timeout.
// Always pair with bus_mutex_give() even on error paths.
bool    bus_mutex_take(uint32_t timeout_ms);
void    bus_mutex_give(void);

// Convenience: I2C register read/write (acquires+releases mutex internally)
esp_err_t i2c_reg_write(uint8_t dev_addr, uint8_t reg, uint8_t val);
esp_err_t i2c_reg_read(uint8_t dev_addr, uint8_t reg, uint8_t *val);

#ifdef __cplusplus
}
#endif
