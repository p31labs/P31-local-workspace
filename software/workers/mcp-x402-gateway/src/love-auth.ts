// Axis-6 (LOVE path security): HMAC-SHA256 proof that an
// `X-Creation-Unit: love` request originated from the trusted
// first-party renderer (shared LOVE_AUTH_SECRET), not an external caller
// spoofing the header to reach paid tools for free.
//
// Skipped when the secret is not configured (backward-compatible:
// e.g. local testnet). Constant-time compare.

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function verifyLoveHmac(
  macHeader: string | null,
  tsHeader: string | null,
  secret: string,
  ttlMs = 60_000,
): Promise<boolean> {
  if (!macHeader || !tsHeader) return false;
  const ts = Number(tsHeader);
  if (!Number.isFinite(ts) || Date.now() - ts > ttlMs) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const expected = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`love:${ts}`)),
    );
    const got = hexToBytes(macHeader);
    if (expected.length !== got.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ got[i];
    return diff === 0;
  } catch {
    return false;
  }
}
