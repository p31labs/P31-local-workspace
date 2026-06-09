#include "p31_net.h"
#include "p31_ui.h"
#include "config.h"
#include "esp_http_client.h"
#include "esp_crt_bundle.h"
#include "esp_log.h"
#include "esp_random.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "cJSON.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "p31_net";

#define QFACTOR_API_BASE  "https://api.p31ca.org"
#define REPORT_INTERVAL_S 300   // POST spoon update every 5 minutes
#define HTTP_TIMEOUT_MS   8000

// ── Device DID (NVS-persisted, generated once) ────────────────────────────────
static char s_did[8] = {0};  // 6 hex chars + null

const char *p31_net_did(void) {
    if (s_did[0] != '\0') return s_did;

    nvs_handle_t nvs;
    if (nvs_open("p31", NVS_READWRITE, &nvs) != ESP_OK) {
        ESP_LOGE(TAG, "NVS open failed — using fallback DID");
        strncpy(s_did, "000000", sizeof(s_did));
        return s_did;
    }

    size_t len = sizeof(s_did);
    if (nvs_get_str(nvs, "did", s_did, &len) == ESP_OK && strlen(s_did) == 6) {
        nvs_close(nvs);
        ESP_LOGI(TAG, "Device DID loaded: %s", s_did);
        return s_did;
    }

    // First boot: generate 3 random bytes → 6-char hex (matches p31-did in browser)
    uint32_t rnd = esp_random();
    snprintf(s_did, sizeof(s_did), "%02x%02x%02x",
             (unsigned)(rnd & 0xFF),
             (unsigned)((rnd >> 8) & 0xFF),
             (unsigned)((rnd >> 16) & 0xFF));

    nvs_set_str(nvs, "did", s_did);
    nvs_commit(nvs);
    nvs_close(nvs);
    ESP_LOGI(TAG, "Device DID generated: %s", s_did);
    return s_did;
}

// ── HTTP response accumulator ─────────────────────────────────────────────────
typedef struct {
    char  *buf;
    size_t len;
    size_t cap;
} resp_t;

static esp_err_t http_evt(esp_http_client_event_t *evt) {
    resp_t *r = (resp_t *)evt->user_data;
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

// ── POST helper (JSON body → JSON response) ───────────────────────────────────
static esp_err_t http_post_json(const char *url, const char *body,
                                char **resp_out, size_t *resp_len) {
    resp_t r = {.buf = malloc(256), .len = 0, .cap = 256};
    if (!r.buf) return ESP_ERR_NO_MEM;

    esp_http_client_config_t cfg = {
        .url             = url,
        .method          = HTTP_METHOD_POST,
        .timeout_ms      = HTTP_TIMEOUT_MS,
        .event_handler   = http_evt,
        .user_data       = &r,
        .crt_bundle_attach = esp_crt_bundle_attach,
    };
    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, body, (int)strlen(body));

    esp_err_t err = esp_http_client_perform(client);
    int status = esp_http_client_get_status_code(client);
    esp_http_client_cleanup(client);

    if (err != ESP_OK || status < 200 || status >= 300) {
        free(r.buf);
        ESP_LOGW(TAG, "POST %s → %d (err=%d)", url, status, err);
        return (err != ESP_OK) ? err : ESP_FAIL;
    }

    if (resp_out) { *resp_out = r.buf; *resp_len = r.len; }
    else          { free(r.buf); }
    return ESP_OK;
}

// ── GET helper ────────────────────────────────────────────────────────────────
static esp_err_t http_get_json(const char *url,
                               char **resp_out, size_t *resp_len) {
    resp_t r = {.buf = malloc(512), .len = 0, .cap = 512};
    if (!r.buf) return ESP_ERR_NO_MEM;

    esp_http_client_config_t cfg = {
        .url             = url,
        .method          = HTTP_METHOD_GET,
        .timeout_ms      = HTTP_TIMEOUT_MS,
        .event_handler   = http_evt,
        .user_data       = &r,
        .crt_bundle_attach = esp_crt_bundle_attach,
    };
    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    esp_err_t err = esp_http_client_perform(client);
    int status = esp_http_client_get_status_code(client);
    esp_http_client_cleanup(client);

    if (err != ESP_OK || status < 200 || status >= 300) {
        free(r.buf);
        ESP_LOGW(TAG, "GET %s → %d (err=%d)", url, status, err);
        return (err != ESP_OK) ? err : ESP_FAIL;
    }

    if (resp_out) { *resp_out = r.buf; *resp_len = r.len; }
    else          { free(r.buf); }
    return ESP_OK;
}

// ── Public: report spoons ──────────────────────────────────────────────────────
esp_err_t p31_net_report_spoons(uint8_t value) {
    char body[128];
    snprintf(body, sizeof(body),
             "{\"userId\":\"%s\",\"source\":\"node-zero\",\"type\":\"spoon\",\"value\":%d}",
             p31_net_did(), (int)value);

    char *resp = NULL;
    size_t resp_len = 0;
    esp_err_t err = http_post_json(QFACTOR_API_BASE "/qfactor/event", body, &resp, &resp_len);

    if (err == ESP_OK && resp) {
        ESP_LOGD(TAG, "spoon event OK: %.*s", (int)resp_len, resp);
        free(resp);
    }
    return err;
}

// ── Public: fetch Q-score ──────────────────────────────────────────────────────
esp_err_t p31_net_fetch_q(float *q_out) {
    char url[96];
    snprintf(url, sizeof(url),
             QFACTOR_API_BASE "/qfactor/current?userId=%s", p31_net_did());

    char *resp = NULL;
    size_t resp_len = 0;
    esp_err_t err = http_get_json(url, &resp, &resp_len);
    if (err != ESP_OK || !resp) return err;

    // Parse: { "q": { "score": 0.73 }, ... }
    cJSON *root = cJSON_ParseWithLength(resp, resp_len);
    free(resp);
    if (!root) return ESP_ERR_INVALID_RESPONSE;

    esp_err_t result = ESP_FAIL;
    cJSON *q_obj = cJSON_GetObjectItemCaseSensitive(root, "q");
    if (q_obj) {
        cJSON *score = cJSON_GetObjectItemCaseSensitive(q_obj, "score");
        if (cJSON_IsNumber(score)) {
            *q_out = (float)score->valuedouble;
            result = ESP_OK;
        }
    }
    cJSON_Delete(root);
    return result;
}

// ── Periodic net task (runs on CPU0, priority 3) ───────────────────────────────
// Spoon tracking: firmware stores last-reported spoon level in NVS.
// The LVGL spoon arc writes to s_current_spoons; this task reads and ships it.
static volatile uint8_t s_current_spoons = 80;  // Default 80% until operator adjusts

void p31_net_spoon_set(uint8_t pct) {  // called from UI or LoRa handler
    s_current_spoons = (pct > 100) ? 100 : pct;
}

void p31_net_task(void *arg) {
    // Brief boot delay — wait for WiFi to connect
    vTaskDelay(pdMS_TO_TICKS(15000));

    // Initialize DID (creates if missing)
    const char *did = p31_net_did();
    ESP_LOGI(TAG, "Net task live — DID=%s endpoint=%s", did, QFACTOR_API_BASE);
    p31_ui_update_status(did);  // Show DID on display

    while (1) {
        // ── Report current spoon level ────────────────────────────────────────
        uint8_t spoons = s_current_spoons;
        esp_err_t err = p31_net_report_spoons(spoons);
        if (err == ESP_OK) {
            ESP_LOGI(TAG, "Spoon report: %d%% → api.p31ca.org OK", spoons);
        } else {
            ESP_LOGW(TAG, "Spoon report failed: %d", err);
            p31_ui_update_status("mesh: offline");
        }

        // ── Fetch Q-score and update display ──────────────────────────────────
        float q = 0.0f;
        if (p31_net_fetch_q(&q) == ESP_OK) {
            uint8_t q_pct = (uint8_t)(q * 100.0f);
            p31_ui_update_spoons(q_pct);
            char status[32];
            snprintf(status, sizeof(status), "Q=%.2f | %s", q, did);
            p31_ui_update_status(status);
        }

        vTaskDelay(pdMS_TO_TICKS(REPORT_INTERVAL_S * 1000));
    }
}
