import { describe, it, expect } from 'vitest';
import { verifyLoveHmac } from '../../../software/workers/mcp-x402-gateway/src/love-auth';

// Sign with Node webcrypto (global `crypto.subtle`) for test setup only.
async function sign(secret: string, ts: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`love:${ts}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('Axis-6: LOVE path HMAC', () => {
  it('accepts a valid MAC within TTL', async () => {
    const ts = Date.now();
    const mac = await sign('shared-secret', ts);
    expect(await verifyLoveHmac(mac, String(ts), 'shared-secret')).toBe(true);
  });

  it('rejects a wrong secret', async () => {
    const ts = Date.now();
    const mac = await sign('shared-secret', ts);
    expect(await verifyLoveHmac(mac, String(ts), 'nope')).toBe(false);
  });

  it('rejects an expired timestamp', async () => {
    const ts = Date.now() - 120_000;
    const mac = await sign('shared-secret', ts);
    expect(await verifyLoveHmac(mac, String(ts), 'shared-secret')).toBe(false);
  });

  it('rejects missing headers', async () => {
    expect(await verifyLoveHmac(null, null, 'shared-secret')).toBe(false);
  });
});
