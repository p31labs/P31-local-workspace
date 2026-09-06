#include "p31_http.h"
#include "esp_http_client.h"
#include "esp_crt_bundle.h"
#include "esp_log.h"
#include <stdlib.h>
#include <string.h>

static const char *TAG = "p31_http";

esp_err_t p31_http_evt(esp_http_client_event_t *evt) {
    p31_http_resp_t *r = (p31_http_resp_t *)evt->user_data;
    if (!r) return ESP_OK;
    if (evt->event_id == HTTP_EVENT_ON_DATA) {
        size_t new_len = r->len + evt->data_len;
        if (new_len + 1 > r->cap) {
            char *nb = realloc(r->buf, new_len + 256);
            if (!nb) return ESP_ERR_NO_MEM;
            r->buf = nb;
            r->cap = new_len + 256;
        }
        memcpy(r->buf + r->len, evt->data, evt->data_len);
        r->len = new_len;
        r->buf[r->len] = '\0';
    }
    return ESP_OK;
}

static esp_err_t http_request(const char *url, const char *body,
                               esp_http_client_method_t method,
                               char **resp_out, size_t *resp_len) {
    p31_http_resp_t r = {.buf = malloc(512), .len = 0, .cap = 512};
    if (!r.buf) return ESP_ERR_NO_MEM;

    esp_http_client_config_t cfg = {
        .url             = url,
        .method          = method,
        .timeout_ms      = P31_HTTP_TIMEOUT_MS,
        .event_handler   = p31_http_evt,
        .user_data       = &r,
        .crt_bundle_attach = esp_crt_bundle_attach,
    };
    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    if (body) {
        esp_http_client_set_header(client, "Content-Type", "application/json");
        esp_http_client_set_post_field(client, body, (int)strlen(body));
    }

    esp_err_t err = esp_http_client_perform(client);
    int status = esp_http_client_get_status_code(client);
    esp_http_client_cleanup(client);

    if (err != ESP_OK || status < 200 || status >= 300) {
        free(r.buf);
        if (resp_out) *resp_out = NULL;
        if (resp_len) *resp_len = 0;
        return (err != ESP_OK) ? err : ESP_FAIL;
    }

    if (resp_out) { *resp_out = r.buf; *resp_len = r.len; }
    else          { free(r.buf); }
    return ESP_OK;
}

esp_err_t p31_http_post_json(const char *url, const char *body,
                              char **resp_out, size_t *resp_len) {
    for (int attempt = 0; attempt < P31_HTTP_MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            int delay_ms = (1 << attempt) * 1000;
            ESP_LOGW(TAG, "Retry %d/%d in %dms", attempt + 1, P31_HTTP_MAX_RETRIES, delay_ms);
            vTaskDelay(pdMS_TO_TICKS(delay_ms));
        }
        esp_err_t err = http_request(url, body, HTTP_METHOD_POST, resp_out, resp_len);
        if (err == ESP_OK) return ESP_OK;
        ESP_LOGW(TAG, "POST attempt %d failed: %s", attempt + 1, esp_err_to_name(err));
    }
    return ESP_FAIL;
}

esp_err_t p31_http_get_json(const char *url,
                             char **resp_out, size_t *resp_len) {
    for (int attempt = 0; attempt < P31_HTTP_MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            int delay_ms = (1 << attempt) * 1000;
            ESP_LOGW(TAG, "Retry %d/%d in %dms", attempt + 1, P31_HTTP_MAX_RETRIES, delay_ms);
            vTaskDelay(pdMS_TO_TICKS(delay_ms));
        }
        esp_err_t err = http_request(url, NULL, HTTP_METHOD_GET, resp_out, resp_len);
        if (err == ESP_OK) return ESP_OK;
        ESP_LOGW(TAG, "GET attempt %d failed: %s", attempt + 1, esp_err_to_name(err));
    }
    return ESP_FAIL;
}