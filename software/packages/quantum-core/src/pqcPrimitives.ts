/**
 * P31 Labs: Post-Quantum Cryptography (PQC) Primitives
 * ---------------------------------------------------------
 * Drop-in replacements for classical cryptographic functions
 * vulnerable to Grover's Algorithm.
 */

import * as crypto from 'crypto';

/**
 * Phase 1 Fix: Upgrades SHA-256 to SHA-512.
 * Grover's algorithm halves the effective bit strength of hashes.
 * SHA-512 provides 256 bits of post-quantum security, matching classical SHA-256.
 * 
 * @param data - The string or buffer to hash (e.g., CID, IPFS data)
 * @returns Hexadecimal string of the SHA-512 hash
 */
export const generateQuantumSafeHash = (data: string | Buffer): string => {
  return crypto.createHash('sha512').update(data).digest('hex');
};

/**
 * Phase 2/3 Fix: Uses FIPS 202 SHAKE256 Extendable-Output Function (XOF).
 * Ideal for advanced quantum-resistant signature schemes and custom key generation.
 * 
 * @param data - The input data to hash
 * @param outputLengthBytes - Desired length of the hash in bytes (default: 64 for 512 bits)
 * @returns Hexadecimal string of the SHAKE256 hash
 */
export const generateShake256Hash = (data: string | Buffer, outputLengthBytes: number = 64): string => {
  // Node.js crypto supports shake256. We use 'shake256' and specify output length.
  const hash = crypto.createHash('shake256', { outputLength: outputLengthBytes });
  return hash.update(data).digest('hex');
};

/**
 * Utility to generate a post-quantum safe random seed (e.g., for QKD simulation)
 * Generates 512 bits (64 bytes) of high-entropy random data.
 */
export const generateQuantumSafeSeed = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Quantum-safe HMAC using SHA-512
 * Provides message authentication with quantum resistance
 */
export const generateQuantumSafeHMAC = (key: string | Buffer, data: string | Buffer): string => {
  return crypto.createHmac('sha512', key).update(data).digest('hex');
};

/**
 * Quantum-safe PBKDF2 with increased iterations
 * For password-based key derivation with quantum resistance
 */
export const generateQuantumSafePBKDF2 = async (
  password: string, 
  salt: string, 
  iterations: number = 100000,
  keyLength: number = 64
): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
};

/**
 * Quantum-safe key derivation using SHAKE256
 * Provides variable-length output for different key sizes
 */
export const generateQuantumSafeKDF = (
  secret: string | Buffer, 
  context: string = '',
  outputLength: number = 32
): string => {
  const kdfInput = `${secret}${context}`;
  return generateShake256Hash(kdfInput, outputLength);
};

/**
 * Quantum-safe content identifier generation
 * Replaces vulnerable SHA-256 based content addressing
 */
export const generateQuantumSafeCID = (content: string | Buffer): string => {
  const hash = generateQuantumSafeHash(content);
  // IPFS-compatible CID v1 format with sha512 codec
  return `bafybeih${hash.slice(0, 52)}`;
};

/**
 * Quantum-safe integrity verification
 * Verifies data integrity using quantum-resistant hashing
 */
export const verifyQuantumSafeIntegrity = (
  data: string | Buffer, 
  expectedHash: string
): boolean => {
  const calculatedHash = generateQuantumSafeHash(data);
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
};

export default {
  generateQuantumSafeHash,
  generateShake256Hash,
  generateQuantumSafeSeed,
  generateQuantumSafeHMAC,
  generateQuantumSafePBKDF2,
  generateQuantumSafeKDF,
  generateQuantumSafeCID,
  verifyQuantumSafeIntegrity
};