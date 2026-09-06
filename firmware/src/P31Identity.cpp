#include "P31Identity.h"
#include <Arduino.h>
#include <nvs_flash.h>
#include <nvs.h>
#include <mbedtls/ed25519.h>
#include <string.h>
#include <stdio.h>

static const char *TAG = "P31Identity";
static const char *NVS_NS = "p31_identity";

static uint8_t s_ed_pub[32];
static uint8_t s_ed_sec[32];
static char s_did_key[P31_DID_KEY_MAX];
static char s_short_did[P31_SHORT_DID_MAX];
static bool s_initialized = false;

static const char B58_ALPHABET[] =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

static size_t base58btc_encode(const uint8_t *in, size_t in_len,
                               char *out, size_t out_cap) {
    size_t zeros = 0;
    while (zeros < in_len && in[zeros] == 0) zeros++;
    size_t size = (in_len - zeros) * 138 / 100 + 2;
    uint8_t *buf = (uint8_t *)calloc(size, 1);
    if (!buf) return 0;
    for (size_t i = zeros; i < in_len; i++) {
        uint32_t carry = in[i];
        for (size_t j = size; j > 0; j--) {
            carry += (uint32_t)buf[j - 1] << 8;
            buf[j - 1] = carry % 58;
            carry /= 58;
        }
    }
    size_t j = 0;
    while (j < size && buf[j] == 0) j++;
    size_t out_idx = 0;
    for (size_t k = 0; k < zeros; k++) {
        if (out_idx < out_cap) out[out_idx++] = '1';
    }
    while (j < size) {
        if (out_idx < out_cap) out[out_idx++] = B58_ALPHABET[buf[j++]];
    }
    free(buf);
    if (out_idx < out_cap) out[out_idx] = '\0';
    return out_idx;
}

static esp_err_t ed25519_generate(void) {
    uint8_t seed[32];
    esp_fill_random(seed, sizeof(seed));
    mbedtls_ed25519_context ctx;
    mbedtls_ed25519_init(&ctx);
    int ret = mbedtls_ed25519_genkey(&ctx, seed, sizeof(seed), NULL, NULL);
    if (ret != 0) {
        mbedtls_ed25519_free(&ctx);
        return ESP_FAIL;
    }
    size_t olen = 0;
    ret = mbedtls_ed25519_write_public_key(&ctx, s_ed_pub, &olen);
    if (ret != 0 || olen != 32) {
        mbedtls_ed25519_free(&ctx);
        return ESP_FAIL;
    }
    memcpy(s_ed_sec, seed, 32);
    mbedtls_ed25519_free(&ctx);
    return ESP_OK;
}

static void derive_short_did(void) {
    snprintf(s_short_did, sizeof(s_short_did), "%02x%02x%02x",
             s_ed_pub[29], s_ed_pub[30], s_ed_pub[31]);
}

static void derive_did_key(void) {
    uint8_t multicodec[34];
    multicodec[0] = 0xed;
    multicodec[1] = 0x01;
    memcpy(multicodec + 2, s_ed_pub, 32);
    char b58[64];
    size_t b58_len = base58btc_encode(multicodec, sizeof(multicodec), b58, sizeof(b58));
    snprintf(s_did_key, sizeof(s_did_key), "did:key:z%.*s", (int)b58_len, b58);
}

bool p31_identity_init(void) {
    if (s_initialized) return true;

    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        err = nvs_flash_init();
    }
    if (err != ESP_OK) {
        ed25519_generate();
        derive_did_key();
        derive_short_did();
        s_initialized = true;
        return true;
    }

    nvs_handle_t nvs;
    err = nvs_open(NVS_NS, NVS_READWRITE, &nvs);
    if (err != ESP_OK) {
        ed25519_generate();
        derive_did_key();
        derive_short_did();
        s_initialized = true;
        return true;
    }

    size_t len = sizeof(s_ed_pub);
    bool loaded = false;
    if (nvs_get_blob(nvs, "ed_pub", s_ed_pub, &len) == ESP_OK && len == 32) {
        len = sizeof(s_ed_sec);
        if (nvs_get_blob(nvs, "ed_sec", s_ed_sec, &len) == ESP_OK && len == 32) {
            loaded = true;
        }
    }

    if (loaded) {
        derive_did_key();
        derive_short_did();
        nvs_close(nvs);
        s_initialized = true;
        return true;
    }

    ed25519_generate();
    nvs_set_blob(nvs, "ed_pub", s_ed_pub, 32);
    nvs_set_blob(nvs, "ed_sec", s_ed_sec, 32);
    nvs_commit(nvs);
    nvs_close(nvs);

    derive_did_key();
    derive_short_did();
    s_initialized = true;
    return true;
}

const char *p31_identity_did_key(void) {
    return s_did_key;
}

const char *p31_identity_short_did(void) {
    return s_short_did;
}

const uint8_t *p31_identity_ed_public(void) {
    return s_ed_pub;
}

const uint8_t *p31_identity_ed_secret(void) {
    return s_ed_sec;
}