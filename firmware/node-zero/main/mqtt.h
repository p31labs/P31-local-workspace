#pragma once
#include "esp_err.h"
#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    MQTT_EVENT_CONNECTED,
    MQTT_EVENT_DISCONNECTED,
    MQTT_EVENT_DATA_RECEIVED,
} mqtt_event_type_t;

typedef struct {
    mqtt_event_type_t type;
    const char *topic;
    const char *data;
    size_t data_len;
} mqtt_event_t;

typedef void (*mqtt_event_callback_t)(mqtt_event_t *event);

esp_err_t mqtt_bridge_init(void);
void mqtt_bridge_set_callback(mqtt_event_callback_t cb);
bool mqtt_bridge_connected(void);
esp_err_t mqtt_publish_spoons(uint16_t spoons);
esp_err_t mqtt_publish_telemetry(const char *payload);

#ifdef __cplusplus
}
#endif