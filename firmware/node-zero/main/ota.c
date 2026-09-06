#include "ota.h"
#include "p31_http.h"
#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_https_ota.h"
#include "cJSON.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "ota";

#define OTA_MANIFEST_URL "https://ota.p31ca.org/firmware/node-zero/latest.json"
#define CHECK_INTERVAL_MS (12 * 3600 * 1000)

static const char *s_current_version = "0.2.0";

esp_err_t ota_fetch_manifest(ota_manifest_t *manifest) {
    char *resp = NULL;
    size_t resp_len = 0;
    esp_err_t err = p31_http_get_json(OTA_MANIFEST_URL, &resp, &resp_len);
    if (err != ESP_OK || !resp) {
        ESP_LOGW(TAG, "Failed to fetch OTA manifest: %s", esp_err_to_name(err));
        if (resp) free(resp);
        return err ? err : ESP_FAIL;
    }

    cJSON *root = cJSON_ParseWithLength(resp, resp_len);
    free(resp);
    if (!root) return ESP_ERR_INVALID_RESPONSE;

    cJSON *ver = cJSON_GetObjectItemCaseSensitive(root, "version");
    cJSON *url = cJSON_GetObjectItemCaseSensitive(root, "url");
    cJSON *sha = cJSON_GetObjectItemCaseSensitive(root, "sha256");

    esp_err_t result = ESP_FAIL;
    if (cJSON_IsString(ver) && cJSON_IsString(url) && cJSON_IsString(sha)) {
        strncpy(manifest->version, ver->valuestring, sizeof(manifest->version) - 1);
        strncpy(manifest->url, url->valuestring, sizeof(manifest->url) - 1);
        strncpy(manifest->sha256, sha->valuestring, sizeof(manifest->sha256) - 1);
        ESP_LOGI(TAG, "Manifest: version=%s url=%s sha256=%s",
                 manifest->version, manifest->url, manifest->sha256);
        result = ESP_OK;
    } else {
        ESP_LOGW(TAG, "Invalid manifest JSON");
    }

    cJSON_Delete(root);
    return result;
}

esp_err_t ota_apply_update(const ota_manifest_t *manifest) {
    ESP_LOGI(TAG, "Starting OTA update to %s from %s", manifest->version, manifest->url);

    esp_http_client_config_t http_cfg = {
        .url             = manifest->url,
        .timeout_ms      = 30000,
        .crt_bundle_attach = esp_crt_bundle_attach,
        .keep_alive_enable = false,
    };

    esp_https_ota_config_t ota_cfg = {
        .http_config = &http_cfg,
    };

    esp_err_t err = esp_https_ota(&ota_cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "esp_https_ota failed: %s", esp_err_to_name(err));
        return err;
    }

    esp_ota_img_states_t ota_state;
    const esp_partition_t *update_part = esp_ota_get_running_partition();
    if (esp_ota_get_state_partition(update_part, &ota_state) == ESP_OK) {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
            esp_ota_mark_app_valid_cancel_rollback();
        }
    }

    ESP_LOGI(TAG, "OTA update to %s successful", manifest->version);
    return ESP_OK;
}

bool ota_check_and_update(void) {
    ota_manifest_t manifest;
    esp_err_t err = ota_fetch_manifest(&manifest);
    if (err != ESP_OK) return false;

    int cmp = strcmp(manifest.version, s_current_version);
    if (cmp <= 0) {
        ESP_LOGI(TAG, "Current version %s is up to date (manifest: %s)",
                 s_current_version, manifest.version);
        return false;
    }

    ESP_LOGW(TAG, "New firmware available: %s (current: %s)",
             manifest.version, s_current_version);

    err = ota_apply_update(&manifest);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "OTA update applied. Rebooting...");
        esp_restart();
        return true;
    }

    ESP_LOGE(TAG, "OTA update failed");
    return false;
}

void ota_task(void *arg) {
    vTaskDelay(pdMS_TO_TICKS(30000));

    ESP_LOGI(TAG, "Checking for firmware updates...");
    ota_check_and_update();

    while (1) {
        vTaskDelay(pdMS_TO_TICKS(CHECK_INTERVAL_MS));
        ESP_LOGI(TAG, "Periodic OTA check...");
        ota_check_and_update();
    }
}