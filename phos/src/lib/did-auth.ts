export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd length (${clean.length})`);
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64url(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function signPayload(
  privateKeyHex: string,
  data: string
): Promise<string> {
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const privateKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes as BufferSource,
    { name: 'Ed25519' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    new TextEncoder().encode(data) as BufferSource
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function generateAuthToken(
  did: string,
  privateKeyHex: string,
  payload?: string,
  nonce?: string
): Promise<string> {
  const pl = payload || JSON.stringify({ did, nonce: nonce || '', ts: Date.now() });
  const signature = await signPayload(privateKeyHex, pl);
  const token = { did, signature, payload: pl, nonce: nonce || undefined };
  const json = JSON.stringify(token);
  return base64url(new TextEncoder().encode(json));
}
