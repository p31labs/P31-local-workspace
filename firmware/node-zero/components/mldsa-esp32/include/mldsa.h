#pragma once
/**
 * @file mldsa.h
 * @brief ML-DSA (FIPS 204) digital signatures for ESP32.
 *
 * Provides key generation, signing, and verification for ML-DSA-44/65/87.
 * Uses esp_fill_random() for hardware RNG (NIST SP 800-90B compliant).
 * Keys can be persisted to NVS via the nvs helpers.
 *
 * Memory: ML-DSA-65 requires ~45 KB working memory (stack).
 *         Run in a dedicated FreeRTOS task with 64 KB stack.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ── Algorithm parameters ─────────────────────────────────────────────── */

#define MLDSA_44_PUB_BYTES   1312
#define MLDSA_44_SEC_BYTES   2560
#define MLDSA_44_SIG_BYTES   2420

#define MLDSA_65_PUB_BYTES   1952
#define MLDSA_65_SEC_BYTES   4032
#define MLDSA_65_SIG_BYTES   3309

#define MLDSA_87_PUB_BYTES   2592
#define MLDSA_87_SEC_BYTES   4896
#define MLDSA_87_SIG_BYTES   4627

typedef enum {
    MLDSA_44 = 44,
    MLDSA_65 = 65,
    MLDSA_87 = 87,
} mldsa_level_t;

typedef struct {
    mldsa_level_t level;
    uint8_t  public_key[MLDSA_87_PUB_BYTES];   /* max size for any level */
    uint8_t  secret_key[MLDSA_87_SEC_BYTES];
} mldsa_keypair_t;

/* ── Key generation ───────────────────────────────────────────────────── */

/**
 * Generate a new ML-DSA keypair using hardware RNG.
 * @param[out] kp      Keypair to populate (level + pub/secret keys).
 * @param      level   Security level (MLDSA_44, MLDSA_65, or MLDSA_87).
 * @return ESP_OK on success.
 */
esp_err_t mldsa_generate_keypair(mldsa_keypair_t *kp, mldsa_level_t level);

/* ── Signing ──────────────────────────────────────────────────────────── */

/**
 * Sign a message with the secret key.
 * @param      msg        Message bytes.
 * @param      msg_len    Message length in bytes.
 * @param      secret_key Secret key (from keypair).
 * @param      level      Security level.
 * @param[out] sig_out    Signature output buffer (caller-allocated).
 * @param      sig_len    Signature buffer size (must >= MLDSA_*_SIG_BYTES).
 * @return ESP_OK on success.
 */
esp_err_t mldsa_sign(const uint8_t *msg, size_t msg_len,
                     const uint8_t *secret_key, mldsa_level_t level,
                     uint8_t *sig_out, size_t sig_len);

/* ── Verification ─────────────────────────────────────────────────────── */

/**
 * Verify a signature against a message and public key.
 * @param sig        Signature bytes.
 * @param sig_len    Signature length.
 * @param msg        Message bytes.
 * @param msg_len    Message length.
 * @param public_key Public key.
 * @param level      Security level.
 * @return true if valid, false otherwise.
 */
bool mldsa_verify(const uint8_t *sig, size_t sig_len,
                  const uint8_t *msg, size_t msg_len,
                  const uint8_t *public_key, mldsa_level_t level);

/* ── NVS persistence ──────────────────────────────────────────────────── */

/**
 * Store a keypair in NVS (Preferences style, namespace "p31_mldsa").
 * Uses two NVS keys: "<prefix>_pub" and "<prefix>_sec".
 * @param kp      Keypair to store.
 * @param prefix  NVS key prefix (e.g. "mldsa65").
 * @return ESP_OK on success.
 */
esp_err_t mldsa_nvs_store(const mldsa_keypair_t *kp, const char *prefix);

/**
 * Load a keypair from NVS. Returns ESP_ERR_NOT_FOUND if not stored.
 * @param[out] kp      Keypair to populate.
 * @param      prefix  NVS key prefix (must match store call).
 * @return ESP_OK on success.
 */
esp_err_t mldsa_nvs_load(mldsa_keypair_t *kp, const char *prefix);

/**
 * Check if a keypair exists in NVS.
 * @param prefix  NVS key prefix.
 * @return true if both pub and sec keys exist.
 */
bool mldsa_nvs_exists(const char *prefix);

#ifdef __cplusplus
}
#endif
