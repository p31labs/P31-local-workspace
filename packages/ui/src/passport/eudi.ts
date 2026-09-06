/**
 * ⚠️ HONEST LABEL
 * EUDI Wallet SD-JWT VC (Selective Disclosure JWT Verifiable Credential)
 * envelope per draft-ietf-oauth-sd-jwt-vc-17. This implements the structural
 * envelope only — the P31 EUDI credential is NOT EBSI-certified, NOT issued
 * by an EU member state, and NOT recognized under eIDAS 2.0. It is a
 * self-issued care credential for the P31 ecosystem. See
 * docs/QF1_CONTESTED_SCIENCE.md and docs/EUDI-READINESS.md.
 */

import type { CognitivePassport } from './schema';
import type { StoredIdentity } from './store';

export interface SDJWTVCEnvelope {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  validFrom?: string;
  validUntil?: string;
  credentialSubject: Record<string, unknown>;
  credentialSchema?: {
    id: string;
    type: string;
  };
  credentialStatus?: {
    id: string;
    type: string;
    statusPurpose: string;
    statusListIndex: string;
    statusListCredential: string;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function createSDJWTVC(
  passport: CognitivePassport,
  holderDid: string,
  issuerDid: string,
): SDJWTVCEnvelope {
  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const credentialId = `urn:uuid:${crypto.randomUUID()}`;

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/v2',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: credentialId,
    type: ['VerifiableCredential', 'CognitivePassportCredential'],
    issuer: issuerDid,
    issuanceDate: now.toISOString(),
    expirationDate: oneYear.toISOString(),
    validFrom: now.toISOString(),
    validUntil: oneYear.toISOString(),
    credentialSchema: {
      id: 'https://p31ca.org/credential-types/cognitive-passport/v2',
      type: 'JsonSchemaValidator2018',
    },
    credentialStatus: {
      id: `https://federation.p31ca.org/credential/revocation/${credentialId}`,
      type: 'StatusList2021Entry',
      statusPurpose: 'revocation',
      statusListIndex: '0',
      statusListCredential: 'https://federation.p31ca.org/credential/revocation/list',
    },
    credentialSubject: {
      id: holderDid,
      displayName: passport.identity?.displayName,
      pronouns: passport.identity?.pronouns,
      cognition: passport.cognition,
      accessibility: passport.accessibility,
    },
  };
}

export async function signSDJWTVC(
  vc: SDJWTVCEnvelope,
  privateKeyJwk: JsonWebKey,
  mlDsaKeypair?: { secretKey: Uint8Array; publicKey: Uint8Array },
): Promise<string> {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'EdDSA', typ: 'dc+sd-jwt' })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify(vc)));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'Ed25519' }, false, ['sign']);
  const sig = await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(signingInput));
  const ed25519Jwt = `${signingInput}.${b64url(sig)}`;

  // ML-DSA-65 co-signature (appended as SD-JWT unencoded payload per CWP-2026-029)
  if (mlDsaKeypair) {
    try {
      const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa');
      const pqSig = ml_dsa65.sign(
        new TextEncoder().encode(signingInput),
        mlDsaKeypair.secretKey,
      );
      const pqSigB64 = b64url(pqSig);
      const pqPubB64 = b64url(mlDsaKeypair.publicKey);
      return `${ed25519Jwt}~pq:${pqSigB64}:${pqPubB64}`;
    } catch {
      // ML-DSA-65 not available — return Ed25519-only JWT
    }
  }

  return ed25519Jwt;
}

function sha256Base64url(msg: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg)).then(b64url);
}

async function createDisclosures(claims: Record<string, unknown>): Promise<string[]> {
  const disclosures: string[] = [];
  for (const [key, value] of Object.entries(claims)) {
    const salt = hex(await crypto.subtle.digest('SHA-256', crypto.getRandomValues(new Uint8Array(16))));
    const disclosure = JSON.stringify([salt, key, value]);
    disclosures.push(b64url(new TextEncoder().encode(disclosure)));
  }
  return disclosures;
}

export async function createSDJWTWithDisclosures(
  vc: SDJWTVCEnvelope,
  privateKeyJwk: JsonWebKey,
  disclosableClaims?: Record<string, unknown>,
): Promise<string> {
  if (!disclosableClaims) return signSDJWTVC(vc, privateKeyJwk);

  const disclosures = await createDisclosures(disclosableClaims);
  const sdHashes = await Promise.all(disclosures.map((d) => sha256Base64url(d)));

  const sdVC = {
    ...vc,
    credentialSubject: {
      ...vc.credentialSubject,
      ...Object.fromEntries(Object.keys(disclosableClaims).map((k, i) => [`_sd_${k}`, sdHashes[i]])),
      _sd_alg: 'sha-256',
    },
  };

  const jwt = await signSDJWTVC(sdVC, privateKeyJwk);
  return `${jwt}~${disclosures.join('~')}~`;
}

export async function exportEUDIWallet(
  passport: CognitivePassport,
  identity: StoredIdentity,
): Promise<string> {
  const vc = createSDJWTVC(passport, passport.did, passport.did);

  // Attempt to load ML-DSA-65 keypair for dual co-signature
  let mlDsaKeypair: { secretKey: Uint8Array; publicKey: Uint8Array } | undefined;
  try {
    const stored = localStorage.getItem('p31-ml-dsa-65-keypair');
    if (stored) {
      const kp = JSON.parse(stored) as { secretKey: string; publicKey: string };
      mlDsaKeypair = {
        secretKey: Uint8Array.from(Buffer.from(kp.secretKey, 'hex')),
        publicKey: Uint8Array.from(Buffer.from(kp.publicKey, 'hex')),
      };
    }
  } catch {
    // ML-DSA-65 keypair not available — Ed25519-only signing
  }

  return signSDJWTVC(vc, identity.privateKeyJwk, mlDsaKeypair);
}

export {
  type EUDIVC,
  buildEUDIVC,
  exportEUDIVC,
  exportEUDISDJWT,
  validateEUDIVC,
} from './eudiExport';

export function serializeEUDIWallet(jwt: string): string {
  return jwt;
}

export function parseSDJWT(jwt: string): { payload: Record<string, unknown>; disclosures: string[]; pqProof?: { signature: string; publicKey: string } } | null {
  const parts = jwt.split('~');
  const jws = parts[0];
  const tailParts = parts.slice(1).filter(Boolean);

  // Separate disclosures from ML-DSA-65 co-signature (prefixed with "pq:")
  const disclosures: string[] = [];
  let pqProof: { signature: string; publicKey: string } | undefined;
  for (const part of tailParts) {
    if (part.startsWith('pq:')) {
      const [, sig, pub] = part.split(':');
      if (sig && pub) pqProof = { signature: sig, publicKey: pub };
    } else {
      disclosures.push(part);
    }
  }

  const jwsParts = jws.split('.');
  if (jwsParts.length !== 3) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(jwsParts[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
    ));
    return { payload, disclosures, pqProof };
  } catch {
    return null;
  }
}
