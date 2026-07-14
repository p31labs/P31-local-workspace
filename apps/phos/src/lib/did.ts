/**
 * DID Core v1.1 Resolver — W3C Candidate Recommendation Snapshot 2026-03-05
 * https://www.w3.org/TR/2026/CR-did-1.1-20260305/
 *
 * Supports did:key (Ed25519) and did:jwk (ML-DSA-65 AKP, RFC 9964).
 * No network fetch required — both methods are self-resolving.
 */

import { fromBase64Url } from './crypto';

// ── DID Core v1.1 Types ──────────────────────────────────────────────────

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: Service[];
  alsoKnownAs?: string[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: Record<string, string>;
}

export interface Service {
  id: string;
  type: string | string[];
  serviceEndpoint: string | Record<string, string>;
}

export type DIDMethod = 'key' | 'jwk' | 'web';

// ── DID Parsing ──────────────────────────────────────────────────────────

export interface ParsedDID {
  method: DIDMethod;
  id: string;
  fragment?: string;
  query?: string;
  path?: string;
  full: string;
}

export function parseDID(did: string): ParsedDID | null {
  const match = did.match(/^did:([a-z0-9]+):([a-zA-Z0-9._%-]+)(\/[^\?#]*)?(\?[^\#]*)?(#.*)?$/);
  if (!match) return null;
  const method = match[1] as DIDMethod;
  if (!['key', 'jwk', 'web'].includes(method)) return null;
  return {
    method,
    id: match[2],
    path: match[3]?.slice(1),
    query: match[4]?.slice(1),
    fragment: match[5]?.slice(1),
    full: did,
  };
}

// ── did:key Resolution (Ed25519, multibase base58btc) ────────────────────

// Multibase base58btc decode ( Bitcoin alphabet, no check ).
const BASE58BTC_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58btcDecode(input: string): Uint8Array {
  let result = 0n;
  for (const char of input) {
    const index = BASE58BTC_ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base58btc character: ${char}`);
    result = result * 58n + BigInt(index);
  }
  const hex = result.toString(16).padStart(2, '0');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function resolveDidKey(did: string): DIDDocument | null {
  try {
    const raw = did.replace('did:key:', '');
    // Multibase: strip 'z' prefix (base58btc), then decode
    if (!raw.startsWith('z')) return null;
    const decoded = base58btcDecode(raw.slice(1));
    // Multicodec: Ed25519 pubkey = 0xed 0x01 prefix (2 bytes)
    if (decoded[0] !== 0xed || decoded[1] !== 0x01) return null;
    const publicKeyBytes = decoded.slice(2);
    const publicKeyMultibase = 'z' + raw;

    return {
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
      id: did,
      verificationMethod: [{
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase,
      }],
      authentication: [`${did}#key-1`],
      assertionMethod: [`${did}#key-1`],
    };
  } catch {
    return null;
  }
}

// ── did:jwk Resolution (ML-DSA-65 AKP, RFC 9964) ────────────────────────

function resolveDidJwk(did: string): DIDDocument | null {
  try {
    const b64url = did.replace('did:jwk:', '');
    const jwkBytes = fromBase64Url(b64url);
    const jwk = JSON.parse(new TextDecoder().decode(jwkBytes));

    if (jwk.kty !== 'AKP' || !jwk.pub) return null;

    const alg = jwk.alg || 'ML-DSA-65';
    const kid = jwk.kid || `${did}#key-1`;

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/jwk/v1',
      ],
      id: did,
      verificationMethod: [{
        id: kid,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk: {
          kty: jwk.kty,
          alg,
          kid: jwk.kid || '',
          pub: jwk.pub,
        },
      }],
      authentication: [kid],
      assertionMethod: [kid],
    };
  } catch {
    return null;
  }
}

// ── Main Resolver ────────────────────────────────────────────────────────

export function resolveDID(did: string): DIDDocument | null {
  const parsed = parseDID(did);
  if (!parsed) return null;

  switch (parsed.method) {
    case 'key': return resolveDidKey(did);
    case 'jwk': return resolveDidJwk(did);
    case 'web': return null; // did:web requires HTTP fetch — not implemented here
    default: return null;
  }
}

// ── DID Signature Verification (dispatches by method) ────────────────────

export function didKeyType(did: string): 'ed25519' | 'mldsa65' | null {
  const parsed = parseDID(did);
  if (!parsed) return null;
  if (parsed.method === 'key') return 'ed25519';
  if (parsed.method === 'jwk') return 'mldsa65';
  return null;
}
