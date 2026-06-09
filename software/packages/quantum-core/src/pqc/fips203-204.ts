/**
 * FIPS 203 (ML-KEM) + FIPS 204 (ML-DSA)
 * Implementation via @noble/post-quantum — audited, zero-dependency, NIST KAT-verified.
 *
 * Security level → variant mapping:
 *   Level 1 → ML-KEM-512  / ML-DSA-44   (128-bit post-quantum)
 *   Level 3 → ML-KEM-768  / ML-DSA-65   (192-bit post-quantum) ← default
 *   Level 5 → ML-KEM-1024 / ML-DSA-87   (256-bit post-quantum)
 *
 * FIPS 203 Table 3 key/ciphertext sizes (bytes):
 *   ML-KEM-512:  ek=800,  dk=1632, ct=768,  ss=32
 *   ML-KEM-768:  ek=1184, dk=2400, ct=1088, ss=32
 *   ML-KEM-1024: ek=1568, dk=3168, ct=1568, ss=32
 *
 * FIPS 204 key/signature sizes (bytes):
 *   ML-DSA-44: pk=1312, sk=2528, sig=2420
 *   ML-DSA-65: pk=1952, sk=4032, sig=3309
 *   ML-DSA-87: pk=2592, sk=4896, sig=4627
 */

// @noble/post-quantum uses .js suffixes in its exports map
import { ml_kem512, ml_kem768, ml_kem1024 } from "@noble/post-quantum/ml-kem.js";
import { ml_dsa44, ml_dsa65, ml_dsa87 } from "@noble/post-quantum/ml-dsa.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MLKEMConfig {
  securityLevel: 1 | 3 | 5;
}

export interface MLDSAConfig {
  securityLevel: 1 | 3 | 5;
}

export interface MLKEMKeyPair {
  /** Encapsulation key (ek) — public. Distribute to senders. */
  publicKey: Uint8Array;
  /** Decapsulation key (dk) — secret. Keep private. */
  secretKey: Uint8Array;
  /** @deprecated alias for publicKey */
  privateKey: Uint8Array;
  /** @deprecated alias for publicKey */
  encapsulationKey: Uint8Array;
}

export interface MLDSAKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  /** @deprecated alias for secretKey */
  privateKey: Uint8Array;
}

/** FIPS 204 signature — flat byte array produced by ML-DSA. */
export type MLDSASignature = Uint8Array;

// ─── Variant tables ──────────────────────────────────────────────────────────

const KEM_VARIANTS = {
  1: ml_kem512,
  3: ml_kem768,
  5: ml_kem1024,
} as const;

const DSA_VARIANTS = {
  1: ml_dsa44,
  3: ml_dsa65,
  5: ml_dsa87,
} as const;

// ─── ML-KEM (FIPS 203) ───────────────────────────────────────────────────────

export class MLKEM {
  private readonly v: (typeof KEM_VARIANTS)[1 | 3 | 5];

  constructor(config: Partial<MLKEMConfig> = {}) {
    const level = (config.securityLevel ?? 3) as 1 | 3 | 5;
    this.v = KEM_VARIANTS[level];
  }

  keygen(): MLKEMKeyPair {
    const { publicKey, secretKey } = this.v.keygen();
    return { publicKey, secretKey, privateKey: secretKey, encapsulationKey: publicKey };
  }

  /** @deprecated use keygen() */
  generateKeyPair(): MLKEMKeyPair {
    return this.keygen();
  }

  encapsulate(publicKey: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array } {
    const { cipherText, sharedSecret } = this.v.encapsulate(publicKey);
    return { cipherText, sharedSecret };
  }

  /**
   * Recover the shared secret from a ciphertext.
   * Returns the implicit-reject value on any tamper — never throws.
   */
  decapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return this.v.decapsulate(cipherText, secretKey);
  }
}

// ─── ML-DSA (FIPS 204) ───────────────────────────────────────────────────────

export class MLDSA {
  private readonly v: (typeof DSA_VARIANTS)[1 | 3 | 5];

  constructor(config: Partial<MLDSAConfig> = {}) {
    const level = (config.securityLevel ?? 3) as 1 | 3 | 5;
    this.v = DSA_VARIANTS[level];
  }

  keygen(): MLDSAKeyPair {
    const { publicKey, secretKey } = this.v.keygen();
    return { publicKey, secretKey, privateKey: secretKey };
  }

  /** @deprecated use keygen() */
  generateKeyPair(): MLDSAKeyPair {
    return this.keygen();
  }

  sign(message: Uint8Array, secretKey: Uint8Array): MLDSASignature {
    return this.v.sign(message, secretKey);
  }

  /** Noble verify order: (sig, msg, publicKey) */
  verify(message: Uint8Array, signature: MLDSASignature, publicKey: Uint8Array): boolean {
    return this.v.verify(signature, message, publicKey);
  }
}

// ─── Hybrid scheme ───────────────────────────────────────────────────────────

export class HybridPQCScheme {
  private readonly kem: MLKEM;
  private readonly dsa: MLDSA;

  constructor(securityLevel: 1 | 3 | 5 = 3) {
    this.kem = new MLKEM({ securityLevel });
    this.dsa = new MLDSA({ securityLevel });
  }

  generateHybridKeyPair(): {
    mlkemKeys: MLKEMKeyPair;
    mldsaKeys: MLDSAKeyPair;
  } {
    return { mlkemKeys: this.kem.keygen(), mldsaKeys: this.dsa.keygen() };
  }

  /**
   * Sign `message` with ML-DSA + encapsulate a fresh shared secret with ML-KEM.
   * Caller uses `sharedSecret` as the key for symmetric encryption (AES-256-GCM).
   */
  signAndEncapsulate(
    message: Uint8Array,
    dsaSecretKey: Uint8Array,
    kemPublicKey: Uint8Array,
  ): { kemCipherText: Uint8Array; sharedSecret: Uint8Array; signature: MLDSASignature } {
    const signature = this.dsa.sign(message, dsaSecretKey);
    const { cipherText: kemCipherText, sharedSecret } = this.kem.encapsulate(kemPublicKey);
    return { kemCipherText, sharedSecret, signature };
  }

  decapsulateAndVerify(
    kemCipherText: Uint8Array,
    kemSecretKey: Uint8Array,
    message: Uint8Array,
    signature: MLDSASignature,
    dsaPublicKey: Uint8Array,
  ): { sharedSecret: Uint8Array; isValid: boolean } {
    const sharedSecret = this.kem.decapsulate(kemCipherText, kemSecretKey);
    const isValid = this.dsa.verify(message, signature, dsaPublicKey);
    return { sharedSecret, isValid };
  }
}

export default { MLKEM, MLDSA, HybridPQCScheme };
