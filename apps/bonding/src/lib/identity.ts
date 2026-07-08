// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Identity: pluggable user identity abstraction
//
// Primary: WebAuthn credential → DID:key derivation.
// Fallback: localStorage device ID (stable across sessions).
//
// getUserId() is synchronous to avoid breaking downstream
// callers (genesis.ts, telemetryClient.ts). The async
// upgradeToWebAuthn() is an opt-in path triggered by the UI.
// ═══════════════════════════════════════════════════════

const STORAGE_WEBAUTHN_CREDENTIAL_ID = 'p31-webauthn-credential-id';
const STORAGE_WEBAUTHN_PUBLIC_KEY = 'p31-webauthn-public-key';
const STORAGE_DEVICE_ID = 'p31-device-id';

function b64Encode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b58Encode(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let n = BigInt(0);
  for (const b of bytes) n = (n << 8n) + BigInt(b);
  if (n === 0n) return alphabet[0];
  let result = '';
  while (n > 0n) {
    result = alphabet[Number(n % 58n)] + result;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) result = alphabet[0] + result;
    else break;
  }
  return result;
}

/**
 * Synchronous ID resolution — no breaking change for downstream callers.
 * Returns existing WebAuthn credential ID, existing device ID, or creates one.
 */
export function getUserId(): string {
  const webAuthnId = localStorage.getItem(STORAGE_WEBAUTHN_CREDENTIAL_ID);
  if (webAuthnId) return webAuthnId;
  let deviceId = localStorage.getItem(STORAGE_DEVICE_ID);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_DEVICE_ID, deviceId);
  }
  return deviceId;
}

/**
 * Returns the current identifier without generating one.
 */
export function getUserIdOrNull(): string | null {
  return localStorage.getItem(STORAGE_WEBAUTHN_CREDENTIAL_ID) ||
         localStorage.getItem(STORAGE_DEVICE_ID);
}

/**
 * Opt-in WebAuthn upgrade. Call when user explicitly enables passkey
 * (e.g., during onboarding or in settings). Returns the credential ID
 * which becomes the canonical getUserId() going forward.
 */
export async function upgradeToWebAuthn(): Promise<string> {
  if (typeof navigator === 'undefined' || !navigator.credentials?.create) {
    throw new Error('WebAuthn not supported');
  }
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { id: window.location.hostname, name: 'P31 Labs' },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'p31-user',
        displayName: 'P31 User',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -8 }],
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    },
  }) as PublicKeyCredential;
  const credentialId = b64Encode(new Uint8Array(credential.rawId));
  localStorage.setItem(STORAGE_WEBAUTHN_CREDENTIAL_ID, credentialId);
  return credentialId;
}

/**
 * Derive a did:key from a WebAuthn public key (Ed25519).
 * Returns a string like "did:key:zQ3shokFTS3brHcDX..."
 */
export function deriveDIDFromPublicKey(publicKey: Uint8Array): string {
  const multicodec = new Uint8Array([0xed, 0x01]);
  const combined = new Uint8Array([...multicodec, ...publicKey]);
  return `did:key:z${b58Encode(combined)}`;
}

export function clearUserId(): void {
  localStorage.removeItem(STORAGE_WEBAUTHN_CREDENTIAL_ID);
  localStorage.removeItem(STORAGE_WEBAUTHN_PUBLIC_KEY);
  localStorage.removeItem(STORAGE_DEVICE_ID);
}
