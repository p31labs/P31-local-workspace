// @p31/sovereign — UCAN capability delegation

export interface UCANPayload {
  iss: string;
  aud: string;
  att: Array<{ can: string; with: string }>;
  exp: number;
  prf: string[];
}

export interface SignedUCAN {
  payload: UCANPayload;
  signature: string;
}

export const P31_CAPABILITIES = {
  TELEMETRY_RECORD: 'telemetry/record',
  MESH_TRANSMIT: 'mesh/transmit',
  EVIDENCE_SIGN: 'evidence/sign',
  HAPTIC_TRIGGER: 'haptic/trigger',
  STORAGE_READ: 'storage/read',
  STORAGE_WRITE: 'storage/write',
} as const;

export type P31Capability = typeof P31_CAPABILITIES[keyof typeof P31_CAPABILITIES];

export function createDelegation(
  hardwareDid: string,
  browserDid: string,
  capabilities: P31Capability[],
  ttlSeconds: number = 86400
): UCANPayload {
  return {
    iss: hardwareDid,
    aud: browserDid,
    att: capabilities.map(can => ({ can, with: 'p31:*' })),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    prf: [],
  };
}

export async function signUCAN(
  payload: UCANPayload,
  signingKey: CryptoKey
): Promise<SignedUCAN> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign('Ed25519', signingKey, payloadBytes);
  return { payload, signature: arrayBufferToBase64(signature) };
}

export async function verifyUCAN(
  ucan: SignedUCAN,
  publicKey: CryptoKey
): Promise<boolean> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(ucan.payload));
  const signature = base64ToArrayBuffer(ucan.signature);
  return crypto.subtle.verify('Ed25519', publicKey, signature, payloadBytes);
}

export function hasCapability(ucan: SignedUCAN | null, capability: P31Capability): boolean {
  if (!ucan) return false;
  const now = Math.floor(Date.now() / 1000);
  if (ucan.payload.exp <= now) return false;
  return ucan.payload.att.some(attr => attr.can === capability);
}

export function getCapabilities(ucan: SignedUCAN | null): P31Capability[] {
  if (!ucan) return [];
  const now = Math.floor(Date.now() / 1000);
  if (ucan.payload.exp <= now) return [];
  return ucan.payload.att.map(attr => attr.can as P31Capability);
}

export async function createDevelopmentUCAN(
  hardwareDid: string,
  browserDid: string,
  signingKey: CryptoKey
): Promise<SignedUCAN> {
  const payload = createDelegation(
    hardwareDid, browserDid,
    [P31_CAPABILITIES.TELEMETRY_RECORD, P31_CAPABILITIES.EVIDENCE_SIGN, P31_CAPABILITIES.STORAGE_READ, P31_CAPABILITIES.STORAGE_WRITE],
    86400 * 7
  );
  return signUCAN(payload, signingKey);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
