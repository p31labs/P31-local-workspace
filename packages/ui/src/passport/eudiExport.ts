// EUDI Wallet Export — W3C VC 2.0 + SD-JWT VC envelope
// Additive module; does not modify eudi.ts behaviour.

import type { CognitivePassport } from './schema';

export interface EUDIVC {
  '@context': string[];
  type: string[];
  issuer: string;
  validFrom: string;
  validUntil: string;
  credentialSubject: {
    id: string;
    [key: string]: unknown;
  };
  credentialSchema: {
    id: string;
    type: string;
  };
  credentialStatus: {
    id: string;
    type: string;
  };
  proof:
    | {
        type: string;
        jwt: string;
      }
    | {
        type: string[];
        jwt_payload: object;
        proof_values: {
          ed25519: string;
          ml_dsa?: string;
        };
      };
}

const STATUS_LIST_URL = 'https://federation.p31ca.org/credential/revocation/list';

const EUROPEAN_CONTEXT = [
  'https://www.w3.org/2018/credentials/v1',
  'https://www.w3.org/2018/credentials/v2',
  'https://w3id.org/security/suites/ed25519-2020/v1',
];

const SCHEMA_ID = 'https://p31ca.org/credential-types/cognitive-passport/v2';

function isISODateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

function isValidDID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('did:');
}

export function buildEUDIVC(passport: CognitivePassport, issuerDid: string): EUDIVC {
  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const credentialId = `urn:uuid:${crypto.randomUUID()}`;

  return {
    '@context': EUROPEAN_CONTEXT,
    type: ['VerifiableCredential', 'CognitivePassportCredential'],
    issuer: issuerDid,
    validFrom: now.toISOString(),
    validUntil: oneYear.toISOString(),
    credentialSubject: {
      id: passport.did,
      displayName: passport.identity?.displayName,
      pronouns: passport.identity?.pronouns,
      role: passport.identity?.role,
      cognition: passport.cognition,
      accessibility: passport.accessibility,
    },
    credentialSchema: {
      id: SCHEMA_ID,
      type: 'JsonSchemaValidator2018',
    },
    credentialStatus: {
      id: `${STATUS_LIST_URL}/${credentialId}`,
      type: 'StatusList2021Entry',
      statusPurpose: 'revocation',
      statusListIndex: '0',
      statusListCredential: STATUS_LIST_URL,
    },
  };
}

export async function exportEUDIVC(
  passport: CognitivePassport,
  issuerDid: string,
  signingFunction?: (payload: object) => Promise<string>,
): Promise<EUDIVC> {
  const vc = buildEUDIVC(passport, issuerDid);

  if (!signingFunction) {
    return vc;
  }

  const jwt = await signingFunction(vc);

  const proof = {
    type: 'JwtProof2020',
    jwt,
  };

  return {
    ...vc,
    proof,
  };
}

export async function exportEUDISDJWT(
  passport: CognitivePassport,
  issuerDid: string,
  ed25519Signer: (payload: object) => Promise<string>,
  mlDsaSigner?: (payload: object) => Promise<string>,
): Promise<EUDIVC> {
  const vc = buildEUDIVC(passport, issuerDid);

  const jwtPayload = vc;
  const ed25519Jwt = await ed25519Signer(jwtPayload);
  const proof_values: { ed25519: string; ml_dsa?: string } = {
    ed25519: ed25519Jwt,
  };

  if (mlDsaSigner) {
    try {
      proof_values.ml_dsa = await mlDsaSigner(jwtPayload);
    } catch {
      // ML-DSA signer unavailable — Ed25519-only proof
    }
  }

  return {
    ...vc,
    proof: {
      type: ['JwtProof2020', 'PQCProof2026'],
      jwt_payload: jwtPayload,
      proof_values,
    },
  };
}

export function validateEUDIVC(vc: EUDIVC): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!vc['@context'] || !Array.isArray(vc['@context'])) {
    errors.push('Missing or invalid @context');
  } else {
    const hasVcV1 = vc['@context'].some(
      (c) => c === 'https://www.w3.org/2018/credentials/v1',
    );
    const hasVcV2 = vc['@context'].some(
      (c) => c === 'https://www.w3.org/2018/credentials/v2',
    );
    if (!hasVcV1 && !hasVcV2) {
      errors.push('@context must include W3C VC 1.1 or 2.0 context');
    }
  }

  if (!vc.type || !Array.isArray(vc.type)) {
    errors.push('Missing or invalid type');
  } else if (!vc.type.includes('VerifiableCredential')) {
    errors.push('type must include "VerifiableCredential"');
  }

  if (!vc.issuer) {
    errors.push('Missing issuer');
  } else if (!isValidDID(vc.issuer)) {
    errors.push('Issuer must be a valid DID');
  }

  if (!vc.validFrom) {
    errors.push('Missing validFrom');
  } else if (!isISODateString(vc.validFrom)) {
    errors.push('validFrom must be a valid ISO date string');
  }

  if (!vc.validUntil) {
    errors.push('Missing validUntil');
  } else if (!isISODateString(vc.validUntil)) {
    errors.push('validUntil must be a valid ISO date string');
  }

  if (new Date(vc.validFrom) >= new Date(vc.validUntil)) {
    errors.push('validFrom must be before validUntil');
  }

  if (!vc.credentialSubject || !vc.credentialSubject.id) {
    errors.push('credentialSubject must have an id');
  }

  if (!vc.credentialSchema) {
    errors.push('Missing credentialSchema');
  } else {
    if (!vc.credentialSchema.id) errors.push('credentialSchema must have an id');
    if (!vc.credentialSchema.type) errors.push('credentialSchema must have a type');
  }

  if (!vc.credentialStatus) {
    errors.push('Missing credentialStatus');
  } else {
    if (!vc.credentialStatus.id) errors.push('credentialStatus must have an id');
    if (vc.credentialStatus.type !== 'StatusList2021Entry') {
      errors.push('credentialStatus type must be StatusList2021Entry');
    }
    if (!vc.credentialStatus.id.includes(STATUS_LIST_URL)) {
      errors.push('credentialStatus id must reference the P31 StatusList2021 endpoint');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
