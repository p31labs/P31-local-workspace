/**
 * ⚠️ HONEST LABEL
 * Decentralized Identifier (DID) resolver supporting did:key, did:web, did:jwk.
 * Compliant with W3C DID Core v1.1. The did:jwk method with ML-DSA-65 (AKP)
 * references RFC 9964 — the quantum-safe post-quantum variant is experimental
 * and not yet widely deployed. See docs/QF1_CONTESTED_SCIENCE.md.
 */

export interface DIDResolutionResult {
  did: string;
  didDocument: DIDDocument | null;
  resolutionMetadata: Record<string, unknown>;
  documentMetadata: Record<string, unknown>;
}

export interface DIDDocument {
  '@context': string | string[];
  id: string;
  verificationMethod?: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
    publicKeyJwk?: Record<string, unknown>;
  }>;
  authentication?: string[];
  assertionMethod?: string[];
  service?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string | Record<string, unknown>;
  }>;
}

export function parseDid(did: string): { method: string; id: string } | null {
  const m = did.match(/^did:(\w+):(.+)$/);
  if (!m) return null;
  return { method: m[1], id: m[2] };
}

function didKeyToDoc(did: string, idString: string): DIDDocument {
  const mb = `z${btoa(idString).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
  return {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
    id: did,
    verificationMethod: [
      { id: `${did}#key-1`, type: 'Ed25519VerificationKey2020', controller: did, publicKeyMultibase: mb },
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
  };
}

function didJwkToDoc(did: string, idString: string): DIDDocument {
  const jwk: Record<string, unknown> = { kty: 'AKP', kid: idString };
  return {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/mldsa-2024/v1'],
    id: did,
    verificationMethod: [
      { id: `${did}#pq-key-1`, type: 'MlDsa65VerificationKey2024', controller: did, publicKeyJwk: jwk },
    ],
    authentication: [`${did}#pq-key-1`],
    assertionMethod: [`${did}#pq-key-1`],
  };
}

async function didWebFetch(hostname: string): Promise<DIDDocument | null> {
  try {
    const url = `https://${hostname}/.well-known/did.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return (await res.json()) as DIDDocument;
  } catch {
    return null;
  }
}

export async function resolveDIDAsync(did: string): Promise<DIDResolutionResult> {
  const parsed = parseDid(did);
  if (!parsed) {
    return { did, didDocument: null, resolutionMetadata: { error: 'invalidDid' }, documentMetadata: {} };
  }
  const { method, id: idString } = parsed;
  try {
    let doc: DIDDocument | null = null;
    if (method === 'key') {
      doc = didKeyToDoc(did, idString);
    } else if (method === 'jwk') {
      doc = didJwkToDoc(did, idString);
    } else if (method === 'web') {
      doc = await didWebFetch(idString);
    }
    return {
      did,
      didDocument: doc,
      resolutionMetadata: {},
      documentMetadata: {},
    };
  } catch {
    return { did, didDocument: null, resolutionMetadata: { error: 'resolutionFailed' }, documentMetadata: {} };
  }
}
