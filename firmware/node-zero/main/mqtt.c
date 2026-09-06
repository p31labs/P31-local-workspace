#include "mqtt.h"
#include "mqtt_config.h"
#include "mldsa_identity.h"
#include "esp_log.h"
#include "mqtt_client.h"
#include "cJSON.h"
#include <string.h>
#include <stdio.h>
#include <time.h>

static const char *TAG = "mqtt";

static esp_mqtt_client_handle_t s_client = NULL;
static bool s_connected = false;
static mqtt_event_callback_t s_callback = NULL;

static char s_client_id[24];
static char s_topic_base[64];
static char s_cmd_topic[80];

static void mqtt_event_handler(void *handler_args, esp_event_base_t base,
                                int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)event_data;

    switch (event->event_id) {
        case MQTT_EVENT_CONNECTED:
            s_connected = true;
            ESP_LOGI(TAG, "MQTT connected to %s", MQTT_BROKER_URI);
            esp_mqtt_client_subscribe(s_client, s_cmd_topic, 1);
            ESP_LOGI(TAG, "Subscribed to %s", s_cmd_topic);
            if (s_callback) {
                mqtt_event_t ev = { .type = MQTT_EVENT_CONNECTED };
                s_callback(&ev);
            }
            break;

        case MQTT_EVENT_DISCONNECTED:
            s_connected = false;
            ESP_LOGW(TAG, "MQTT disconnected");
            if (s_callback) {
                mqtt_event_t ev = { .type = MQTT_EVENT_DISCONNECTED };
                s_callback(&ev);
            }
            break;

        case MQTT_EVENT_DATA:
            if (s_callback && event->topic && event->data) {
                char *topic = strndup(event->topic, event->topic_len);
                char *data = strndup(event->data, event->data_len);
                if (topic && data) {
                    mqtt_event_t ev = {
                        .type = MQTT_EVENT_DATA_RECEIVED,
                        .topic = topic,
                        .data = data,
                        .data_len = event->data_len,
                    };
                    s_callback(&ev);
                }
                free(topic);
                free(data);
            }
            break;

        default:
            break;
    }
}

void mqtt_bridge_set_callback(mqtt_event_callback_t cb) {
    s_callback = cb;
}

bool mqtt_bridge_connected(void) {
    return s_connected;
}

esp_err_t mqtt_bridge_init(void) {
    if (s_client) {
        ESP_LOGW(TAG, "MQTT already initialized");
        return ESP_ERR_INVALID_STATE;
    }

    const char *short_did = mldsa_identity_short_did();
    snprintf(s_client_id, sizeof(s_client_id), "%s%s", MQTT_CLIENT_PREFIX, short_did);
    snprintf(s_topic_base, sizeof(s_topic_base), "devices/%s", short_did);
    snprintf(s_cmd_topic, sizeof(s_cmd_topic), "devices/%s/command", short_did);

    esp_mqtt_client_config_t cfg = {
        .broker = {
            .address = {
                .uri = MQTT_BROKER_URI,
            },
        },
        .credentials = {
            .username = MQTT_USERNAME,
            .authentication = {
                .password = MQTT_PASSWORD,
            },
            .client_id = s_client_id,
        },
        .session = {
            .keepalive = 60,
        },
    };

    s_client = esp_mqtt_client_init(&cfg);
    if (!s_client) {
        ESP_LOGE(TAG, "Failed to create MQTT client");
        return ESP_FAIL;
    }

    esp_mqtt_client_register_event(s_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_err_t err = esp_mqtt_client_start(s_client);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start MQTT client: %d", err);
        esp_mqtt_client_destroy(s_client);
        s_client = NULL;
        return err;
    }

    ESP_LOGI(TAG, "MQTT bridge started — client_id=%s cmd_topic=%s", s_client_id, s_cmd_topic);
    return ESP_OK;
}

esp_err_t mqtt_publish_spoons(uint16_t spoons) {
    if (!s_connected || !s_client) {
        return ESP_ERR_INVALID_STATE;
    }

    time_t now;
    time(&now);

    cJSON *root = cJSON_CreateObject();
    if (!root) return ESP_ERR_NO_MEM;

    cJSON_AddStringToObject(root, "source", "node-zero");
    cJSON_AddStringToObject(root, "did", mldsa_identity_did_key());
    cJSON_AddNumberToObject(root, "spoons", spoons);
    cJSON_AddNumberToObject(root, "timestamp", (double)now);

    char *json = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    if (!json) return ESP_ERR_NO_MEM;

    char topic[80];
    snprintf(topic, sizeof(topic), "%s/telemetry/spoons", s_topic_base);

    int msg_id = esp_mqtt_client_publish(s_client, topic, json, 0, 1, 0);
    free(json);

    if (msg_id < 0) {
        ESP_LOGW(TAG, "MQTT publish failed: %d", msg_id);
        return ESP_FAIL;
    }

    ESP_LOGD(TAG, "MQTT spoons=%d published to %s (msg_id=%d)", spoons, topic, msg_id);
    return ESP_OK;
}

esp_err_t mqtt_publish_telemetry(const char *payload) {
    if (!s_connected || !s_client || !payload) {
        return ESP_ERR_INVALID_STATE;
    }

    char topic[80];
    snprintf(topic, sizeof(topic), "%s/telemetry", s_topic_base);

    int msg_id = esp_mqtt_client_publish(s_client, topic, payload, 0, 1, 0);
    if (msg_id < 0) {
        ESP_LOGW(TAG, "MQTT telemetry publish failed: %d", msg_id);
        return ESP_FAIL;
    }

    ESP_LOGD(TAG, "MQTT telemetry published to %s (msg_id=%d)", topic, msg_id);
    return ESP_OK;
}