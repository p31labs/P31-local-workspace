#pragma once
/**
 * @file mldsa_identity.h
 * @brief PQC identity module for Node Zero.
 *
 * Generates and persists Ed25519 + ML-DSA-65 keypairs on first boot.
 * Derives did:key (Ed25519) and did:jwk (ML-DSA-65 AKP, RFC 9964).
 * NVS-persisted across power cycles.
 *
 * SPDX-License-Identifier: MIT
 */

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initialize the PQC identity subsystem.
 * On first boot: generates Ed25519 + ML-DSA-65 keypairs, derives DIDs,
 * and persists to NVS. On subsequent boots: loads from NVS.
 * Must be called AFTER nvs_flash_init().
 */
void mldsa_identity_init(void);

/**
 * Get the Ed25519 did:key string.
 * Format: "did:key:z6Mk..." (base58btc-encoded).
 * Returns pointer to static buffer; valid for the lifetime of the app.
 */
const char *mldsa_identity_did_key(void);

/**
 * Get the ML-DSA-65 did:jwk string.
 * Format: "did:jwk:<thumbprint>" (RFC 9964 thumbprint).
 * Returns pointer to static buffer; valid for the lifetime of the app.
 */
const char *mldsa_identity_did_jwk(void);

/**
 * Get the Ed25519 public key (32 bytes).
 */
const uint8_t *mldsa_identity_ed_public(void);

/**
 * Get the Ed25519 secret key (32 bytes).
 */
const uint8_t *mldsa_identity_ed_secret(void);

/**
 * Get the ML-DSA-65 public key.
 */
const uint8_t *mldsa_identity_pq_public(void);

/**
 * Get the ML-DSA-65 secret key.
 */
const uint8_t *mldsa_identity_pq_secret(void);

/**
 * Get the ETH address (EIP-55 checksummed hex).
 * Returns pointer to static "0x..." buffer or "0x0000...0000" if unset.
 */
const char *mldsa_identity_eth_address(void);

/**
 * Set the ETH address (called once, persisted to NVS).
 */
void mldsa_identity_set_eth(const char *eth_addr);

#ifdef __cplusplus
}
#endif
