/**
 * @file mldsa_random.c
 * @brief Hardware RNG wrapper for ML-DSA.
 *
 * Uses esp_fill_random() which taps the ESP32 hardware RNG (TRNG).
 * NIST SP 800-90B compliant when properly seeded from hardware entropy.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include "mldsa.h"
#include "esp_random.h"

/* mldsa_core.c uses esp_fill_random() directly — this module exists
 * as the integration point for the NeuraiProject/mldsa-esp32 library's
 * mldsa_random.c interface. When the full library is dropped in, this
 * file provides the random byte source. */
