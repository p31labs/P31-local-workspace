/**
 * Cloudflare Access JWT validation, dependency-free.
 *
 * The repo's documented security posture lists Cloudflare Access (zero-trust)
 * as auth method #3. Access forwards the authenticated identity two ways:
 *   - the `CF_Authorization` cookie (sent automatically on every request,
 *     including the EventSource handshake — the only cookie path that works
 *     with SSE), and
 *   - the `Cf-Access-Jwt-Assertion` header.
 *
 * This validator verifies the JWT signature against Cloudflare's JWKS
 * (fetched once and cached), and checks issuer, audience, and expiry — the
 * same checks the Cloudflare Access Pages plugin performs, without the
 * dependency. The JWT's `sub` is the authenticated principal; the log's
 * writer identity derives from it.
 */
import type { PagesFunction } from '@cloudflare/workers-types';

interface AccessEnv {
  CLOUDFLARE_ACCESS_DOMAIN: string;
  CLOUDFLARE_ACCESS_AUD: string;
}

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function b64urlDecode(s: string): Uint8Array {
  const b = new Uint8Array(s.length);
  let acc = 0;
  let bits = 0;
  let n = 0;
  for (const c of s) {
    const v = B64URL.indexOf(c);
    if (v === -1) continue;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      b[n++] = (acc >> bits) & 0xff;
    }
  }
  return b.slice(0, n);
}

function jsonParse(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(bytes));
}

let cachedKeys: Array<{ kid: string; kty: string; n: string; e: string }> | null = null;

async function fetchKeys(domain: string): Promise<Array<{ kid: string; n: string; e: string }>> {
  if (cachedKeys) return cachedKeys;
  const res = await fetch(`${domain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access cert fetch failed: ${res.status}`);
  const json = (await res.json()) as { keys?: Array<{ kid: string; n: string; e: string }> };
  cachedKeys = json.keys ?? [];
  return cachedKeys;
}

/** Verify an RS256 JWT against the Access JWKS. Returns the payload or null. */
export async function verifyAccessJwt(token: string, env: AccessEnv): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const header = jsonParse(b64urlDecode(headerB64)) as { alg?: string; kid?: string };
    if (header.alg !== 'RS256' || !header.kid) return null;

    const keys = await fetchKeys(env.CLOUDFLARE_ACCESS_DOMAIN);
    const key = keys.find((k) => k.kid === header.kid);
    if (!key) return null;

    const jwk = {
      kty: 'RSA',
      n: key.n,
      e: key.e,
    };
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sig = b64urlDecode(sigB64);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sig, data);
    if (!valid) return null;

    const payload = jsonParse(b64urlDecode(payloadB64)) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== env.CLOUDFLARE_ACCESS_DOMAIN) return null;
    if (payload.aud !== env.CLOUDFLARE_ACCESS_AUD) return null;
    if (typeof payload.exp === 'number' && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Extract the Access JWT from the cookie or the assertion header. */
export function accessTokenFromRequest(request: Request): string | null {
  const header = request.headers.get('Cf-Access-Jwt-Assertion');
  if (header) return header;
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Pages Function middleware: require a valid Access JWT on every API call.
 *  Until Cloudflare Access is configured (CLOUDFLARE_ACCESS_AUD still a
 *  placeholder), the gate is OFF with a warning — an explicit interim posture
 *  so a first deploy is usable; configuring Access in the Zero Trust dashboard
 *  flips the gate on with no code change. */
export const accessGate: PagesFunction<AccessEnv> = async (context) => {
  const aud = context.env.CLOUDFLARE_ACCESS_AUD ?? '';
  if (!aud || aud.startsWith('REPLACE')) {
    console.warn('[access] Cloudflare Access not configured — gate OFF (interim)');
    return context.next();
  }
  const token = accessTokenFromRequest(context.request);
  if (!token) {
    // Localhost (wrangler pages dev) has no Cloudflare Access in the loop.
    if (context.request.url.startsWith('http://localhost') || context.request.url.startsWith('http://127.0.0.1')) {
      return context.next();
    }
    return new Response('Unauthorized', { status: 401 });
  }
  const payload = await verifyAccessJwt(token, context.env);
  if (!payload) return new Response('Unauthorized', { status: 401 });
  // Bind the authenticated principal so handlers can read the writer identity.
  const data = context.data as { access?: { payload: Record<string, unknown> } };
  data.access = { payload };
  return context.next();
};