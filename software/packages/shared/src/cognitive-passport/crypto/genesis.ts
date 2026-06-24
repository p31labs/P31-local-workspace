export interface GenesisAttestation {
  hash_sha256: string;
  iso_timestamp: string;
  schema_id: string;
  input_length: number;
}

export async function computeGenesisHash(
  payload: unknown,
  schemaId: string = 'p31.cognitivePassport/1.1.0',
): Promise<GenesisAttestation> {
  const json = JSON.stringify(payload, Object.keys(payload as object).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    hash_sha256: hashHex,
    iso_timestamp: new Date().toISOString(),
    schema_id: schemaId,
    input_length: data.byteLength,
  };
}

export async function verifyGenesisHash(
  payload: unknown,
  expectedHash: string,
): Promise<boolean> {
  const json = JSON.stringify(payload, Object.keys(payload as object).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return actualHash === expectedHash;
}
