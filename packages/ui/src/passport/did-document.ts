/**
 * @file did-document.ts — W3C DID Core v1.0 DID Document generation.
 * Supports Ed25519 + optional ML-DSA-65 verification methods.
 */

export interface DIDDocument {
  '@context': string;
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }>;
  authentication: string[];
  assertionMethod: string[];
}

export function generateDIDDocument(
  did: string,
  publicKeyBase58: string,
  pqDid?: string,
  pqPublicKeyBase58?: string
): DIDDocument {
  const methods: DIDDocument['verificationMethod'] = [
    {
      id: `${did}#key-1`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyMultibase: publicKeyBase58,
    },
  ];

  const authMethods = [`${did}#key-1`];
  const assertionMethods = [`${did}#key-1`];

  if (pqDid && pqPublicKeyBase58) {
    methods.push({
      id: `${did}#pq-key-1`,
      type: 'MlDsa65VerificationKey2024',
      controller: did,
      publicKeyMultibase: pqPublicKeyBase58,
    });
    assertionMethods.push(`${did}#pq-key-1`);
  }

  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
    verificationMethod: methods,
    authentication: authMethods,
    assertionMethod: assertionMethods,
  };
}

export function exportDIDDocumentJSON(doc: DIDDocument): string {
  return JSON.stringify(doc, null, 2);
}
