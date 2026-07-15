/**
 * @file mldsa_nvs.c
 * @brief NVS persistence for ML-DSA keypairs.
 *
 * Uses ESP32 Preferences-style NVS (namespace "p31_mldsa") to store
 * public and secret keys across power cycles. The secret key for
 * ML-DSA-65 (4032 bytes) is split across two NVS pages if needed.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include "mldsa.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "mldsa_nvs";
static const char *NVS_NAMESPACE = "p31_mldsa";

/* ── Helpers ──────────────────────────────────────────────────────────── */

static size_t pub_bytes(mldsa_level_t lv) {
    switch (lv) {
        case MLDSA_44: return MLDSA_44_PUB_BYTES;
        case MLDSA_65: return MLDSA_65_PUB_BYTES;
        case MLDSA_87: return MLDSA_87_PUB_BYTES;
    }
    return 0;
}

static size_t sec_bytes(mldsa_level_t lv) {
    switch (lv) {
        case MLDSA_44: return MLDSA_44_SEC_BYTES;
        case MLDSA_65: return MLDSA_65_SEC_BYTES;
        case MLDSA_87: return MLDSA_87_SEC_BYTES;
    }
    return 0;
}

/* ── Store ────────────────────────────────────────────────────────────── */

esp_err_t mldsa_nvs_store(const mldsa_keypair_t *kp, const char *prefix) {
    if (!kp || !prefix) return ESP_ERR_INVALID_ARG;

    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "NVS open failed: %s", esp_err_to_name(err));
        return err;
    }

    char key[48];
    size_t pb = pub_bytes(kp->level);
    size_t sb = sec_bytes(kp->level);

    /* Store public key */
    snprintf(key, sizeof(key), "%s_pub", prefix);
    err = nvs_set_blob(nvs, key, kp->public_key, pb);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "NVS set pub failed: %s", esp_err_to_name(err));
        nvs_close(nvs);
        return err;
    }

    /* Store secret key (may be > 4KB — NVS handles multi-page blobs) */
    snprintf(key, sizeof(key), "%s_sec", prefix);
    err = nvs_set_blob(nvs, key, kp->secret_key, sb);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "NVS set sec failed: %s", esp_err_to_name(err));
        nvs_close(nvs);
        return err;
    }

    /* Store level tag */
    snprintf(key, sizeof(key), "%s_lvl", prefix);
    uint8_t lvl = (uint8_t)kp->level;
    err = nvs_set_u8(nvs, key, lvl);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "NVS set level failed: %s", esp_err_to_name(err));
        nvs_close(nvs);
        return err;
    }

    nvs_commit(nvs);
    nvs_close(nvs);

    ESP_LOGI(TAG, "ML-DSA-%d keypair stored to NVS (prefix=%s)", (int)kp->level, prefix);
    return ESP_OK;
}

/* ── Load ─────────────────────────────────────────────────────────────── */

esp_err_t mldsa_nvs_load(mldsa_keypair_t *kp, const char *prefix) {
    if (!kp || !prefix) return ESP_ERR_INVALID_ARG;

    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs);
    if (err != ESP_OK) return err;

    char key[48];

    /* Load level */
    snprintf(key, sizeof(key), "%s_lvl", prefix);
    uint8_t lvl = 0;
    err = nvs_get_u8(nvs, key, &lvl);
    if (err != ESP_OK) { nvs_close(nvs); return err; }

    mldsa_level_t level = (mldsa_level_t)lvl;
    if (level != MLDSA_44 && level != MLDSA_65 && level != MLDSA_87) {
        nvs_close(nvs);
        return ESP_ERR_INVALID_RESPONSE;
    }

    kp->level = level;
    size_t pb = pub_bytes(level);
    size_t sb = sec_bytes(level);

    /* Load public key */
    snprintf(key, sizeof(key), "%s_pub", prefix);
    size_t len = pb;
    err = nvs_get_blob(nvs, key, kp->public_key, &len);
    if (err != ESP_OK || len != pb) { nvs_close(nvs); return ESP_ERR_INVALID_SIZE; }

    /* Load secret key */
    snprintf(key, sizeof(key), "%s_sec", prefix);
    len = sb;
    err = nvs_get_blob(nvs, key, kp->secret_key, &len);
    if (err != ESP_OK || len != sb) { nvs_close(nvs); return ESP_ERR_INVALID_SIZE; }

    nvs_close(nvs);
    ESP_LOGI(TAG, "ML-DSA-%d keypair loaded from NVS (prefix=%s)", (int)level, prefix);
    return ESP_OK;
}

/* ── Exists check ─────────────────────────────────────────────────────── */

bool mldsa_nvs_exists(const char *prefix) {
    if (!prefix) return false;

    nvs_handle_t nvs;
    if (nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs) != ESP_OK) return false;

    char key[48];
    snprintf(key, sizeof(key), "%s_pub", prefix);
    size_t len = 0;
    esp_err_t err = nvs_get_blob(nvs, key, NULL, &len);
    nvs_close(nvs);

    return (err == ESP_OK && len > 0);
}
