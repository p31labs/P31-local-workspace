/**
 * DID Core v1.1 Resolver — W3C Candidate Recommendation Snapshot 2026-03-05
 * https://www.w3.org/TR/2026/CR-did-1.1-20260305/
 *
 * Supports did:key (Ed25519), did:jwk (ML-DSA-65 AKP, RFC 9964),
 * and did:web (HTTPS fetch per DID Core v1.1 §8.3).
 * CWP-2026-030 Phase 3: did:web resolution added.
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

// DID Core v1.1 §10.2 — Resolution Metadata
export interface DIDResolutionMetadata {
  contentType?: string;
  error?: string;
}

export interface DIDResolutionResult {
  didResolutionMetadata: DIDResolutionMetadata;
  didDocument: DIDDocument | null;
  didDocumentStream: string | null;
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
  const match = did.match(/^did:([a-z0-9]+):([a-zA-Z0-9._%-:]+)(\/[^\?#]*)?(\?[^\#]*)?(#.*)?$/);
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

export function base58btcEncode(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  if (num === 0n) return BASE58BTC_ALPHABET[0];
  let result = '';
  while (num > 0n) {
    result = BASE58BTC_ALPHABET[Number(num % 58n)] + result;
    num /= 58n;
  }
  return result;
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
    case 'web': return null; // did:web requires HTTP — use resolveDIDAsync
    default: return null;
  }
}

// ── did:web Resolution (CWP-2026-030 Phase 3) ──────────────────────────
// Per DID Core v1.1 §8.3: did:web:example.com:user:alice
// → https://example.com/user/alice/did.json
// Uses HTTP fetch — only available in async context.

async function resolveDidWeb(did: string): Promise<DIDDocument | null> {
  try {
    const remaining = did.replace('did:web:', '');
    const parts = remaining.split(':');
    const domain = parts[0];
    if (!domain) return null;

    // Detect port: if parts[1] is all digits, it's a port segment
    let host = domain;
    let pathParts: string[];
    if (parts.length > 1 && /^\d+$/.test(parts[1])) {
      host = `${domain}:${parts[1]}`;
      pathParts = parts.slice(2);
    } else {
      pathParts = parts.slice(1);
    }

    // Build path: host + (optional path segments joined by /) + /did.json
    const path = pathParts.length > 0
      ? `/${pathParts.join('/')}/did.json`
      : '/.well-known/did.json';

    const url = `https://${host}${path}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/did+json, application/did+ld+json' },
      // Short timeout for resolver
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const doc = await res.json() as DIDDocument;
    // Validate basic DID Document structure
    if (!doc['@context'] || !doc.id || !doc.verificationMethod) return null;
    return doc;
  } catch {
    return null;
  }
}

/**
 * Async resolver — supports all methods including did:web (requires fetch).
 */
export async function resolveDIDAsync(did: string): Promise<DIDDocument | null> {
  const parsed = parseDID(did);
  if (!parsed) return null;

  switch (parsed.method) {
    case 'key': return resolveDidKey(did);
    case 'jwk': return resolveDidJwk(did);
    case 'web': return resolveDidWeb(did);
    default: return null;
  }
}

// ── DID Core v1.1 §10.2 — Resolution Metadata Envelope ──────────────────

function wrapResult(doc: DIDDocument | null): DIDResolutionResult {
  if (doc) {
    return {
      didResolutionMetadata: { contentType: 'application/did+ld+json' },
      didDocument: doc,
      didDocumentStream: JSON.stringify(doc),
    };
  }
  return {
    didResolutionMetadata: { error: 'notFound' },
    didDocument: null,
    didDocumentStream: null,
  };
}

export async function resolveDIDWrapped(did: string): Promise<DIDResolutionResult> {
  const doc = await resolveDIDAsync(did);
  return wrapResult(doc);
}

// ── DID Signature Verification (dispatches by method) ────────────────────

export function didKeyType(did: string): 'ed25519' | 'mldsa65' | null {
  const parsed = parseDID(did);
  if (!parsed) return null;
  if (parsed.method === 'key') return 'ed25519';
  if (parsed.method === 'jwk') return 'mldsa65';
  return null;
}
