#pragma once
/**
 * @file p31_care_proof.h
 * @brief Composite care-proof module for Node Zero.
 *
 * Generates a canonical care-proof message, signs it with both Ed25519
 * and ML-DSA-65, and POSTs the composite signature to ledger-bridge.
 * This is the first physical PQC-signed LOVE ping.
 *
 * SPDX-License-Identifier: MIT
 */

#include "esp_err.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Build and POST a composite care-proof to ledger-bridge.
 *
 * Canonical message: "proof|<did>|<eth_addr>|<tProx>|<qRes>|<tasks>|<entropyRoots>"
 * Composite sig:     base64(ed25519_sig) || "." || base64(mldsa65_sig)
 *
 * @param eth_addr  ETH address for the on-chain binding.
 * @param tProx     Proximity time (ms since boot).
 * @param qRes      Q-score resource value (0.0-1.0).
 * @param tasks     Number of completed tasks.
 * @return ESP_OK on success (200 from ledger-bridge).
 */
esp_err_t p31_care_proof_post(const char *eth_addr,
                              uint32_t tProx,
                              float qRes,
                              uint32_t tasks);

/**
 * Get the last care-proof entry hash (from ledger-bridge response).
 * Returns pointer to static buffer or NULL if no proof sent yet.
 */
const char *p31_care_proof_last_entry_hash(void);

/**
 * Get the last care-proof tx hash (from on-chain anchor).
 * Returns pointer to static buffer or NULL if not anchored.
 */
const char *p31_care_proof_last_tx_hash(void);

#ifdef __cplusplus
}
#endif
