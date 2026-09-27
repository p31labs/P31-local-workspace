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

/** The env surface the Access gate needs. */
export interface AccessEnv {
  CLOUDFLARE_ACCESS_DOMAIN: string;
  CLOUDFLARE_ACCESS_AUD: string;
  /** Lumi's service-token credentials (stored as Pages secrets) — verified
   *  against the presented headers so a path bypass can't spoof them. */
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
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

let cachedKeys: Array<{ kid: string; n: string; e: string }> | null = null;

async function fetchKeys(domain: string): Promise<Array<{ kid: string; n: string; e: string }>> {
  if (cachedKeys) return cachedKeys;
  const res = await fetch(`${domain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access cert fetch failed: ${res.status}`);
  const json = (await res.json()) as { keys?: Array<{ kid: string; n: string; e: string }> };
  cachedKeys = json.keys ?? [];
  return cachedKeys ?? [];
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
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sig as BufferSource, data as BufferSource);
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
export function accessTokenFromRequest(request: { headers: Headers } | Request): string | null {
  const header = request.headers.get('Cf-Access-Jwt-Assertion');
  if (header) return header;
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** A minimal structural context — the real PagesFunction context is
 *  structurally assignable to this, and it keeps this module typecheckable
 *  under both the app tsconfig and the functions/worker tsconfig (the ambient
 *  PagesFunction only exists in the wrangler-generated types). */
export interface AccessGateContext {
  request: Request;
  env: AccessEnv;
  data: Record<string, unknown>;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

/** Constant-time string comparison (Cloudflare's documented pattern). Do NOT
 *  return early on a length mismatch — that leaks the secret's length through
 *  response timing. When lengths differ, compare against self and negate.
 *  `crypto.subtle.timingSafeEqual` is a Workers extension (not in DOM/Node
 *  webcrypto), so fall back to an XOR fold on runtimes that lack it. */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const subtle = crypto.subtle as unknown as { timingSafeEqual?: (x: Uint8Array, y: Uint8Array) => boolean };
  const eq = subtle.timingSafeEqual
    ? (x: Uint8Array, y: Uint8Array) => subtle.timingSafeEqual!(x, y)
    : (x: Uint8Array, y: Uint8Array) => {
        let result = 0;
        for (let i = 0; i < x.byteLength; i++) result |= x[i] ^ y[i];
        return result === 0;
      };
  if (aBytes.byteLength !== bBytes.byteLength) {
    return !eq(aBytes, aBytes);
  }
  return eq(aBytes, bBytes);
}

/**
 * Public read-only allowlist. These GET endpoints are tamper-evidence surfaces:
 * they recompute the chain and return aggregate state (hashes), never raw
 * payloads. They are meant to be reachable WITHOUT an Access token once the
 * edge policy is un-gated, so a third party can verify the chain with no
 * account. The raw log stays gated at /api/loom/events and /api/loom/event.
 *
 * The edge (Cloudflare Access) remains the real control; this bypass only
 * relaxes the middleware's own token requirement so the app-layer answers
 * public verification requests. Read-only is structural — none of these routes
 * have write handlers.
 */
export function isPublicReadOnly(request: Request): boolean {
  if (request.method !== 'GET') return false;
  const { pathname } = new URL(request.url);
  return (
    pathname === '/api/loom/verify' ||
    pathname === '/api/loom/refusals/verify' ||
    pathname.startsWith('/api/loom/provenance/') ||
    pathname === '/api/loom-public/verify'
  );
}

/** Pages Function middleware: require a valid Access JWT (or a matching Lumi
 *  service token) on every API call. Until Cloudflare Access is configured
 *  (CLOUDFLARE_ACCESS_AUD still a placeholder), the gate is OFF with a warning
 *  — an explicit interim posture so a first deploy is usable; configuring
 *  Access in the Zero Trust dashboard flips the gate on with no code change. */
export const accessGate: (context: AccessGateContext) => Promise<Response> = async (context) => {
  const aud = context.env.CLOUDFLARE_ACCESS_AUD ?? '';
  // Service-token principal (Lumi's server-side writes). Cloudflare Access
  // validates the token at the edge before the request reaches us; we ALSO
  // verify the presented credentials against the stored Pages secrets
  // (belt-and-suspenders) so a path bypass can't spoof the headers. The
  // principal is bound as sub so the writer identity flows like any other.
  const clientId = context.request.headers.get('CF-Access-Client-Id');
  const clientSecret = context.request.headers.get('CF-Access-Client-Secret');
  if (clientId && clientSecret && timingSafeEqual(clientId, context.env.CF_ACCESS_CLIENT_ID ?? '') && timingSafeEqual(clientSecret, context.env.CF_ACCESS_CLIENT_SECRET ?? '')) {
    context.data.principal = `service:${clientId}`;
    context.data.access = { payload: { sub: `service:${clientId}`, service: true } };
    // Pages' Access integration can strip the CF-Access-* headers and clobber
    // context.data between the middleware and the handler on the production
    // alias — so re-inject the principal via a header the integration doesn't
    // touch, on a copied request passed to next().
    const headers = new Headers(context.request.headers);
    headers.set('X-Loom-Principal', `service:${clientId}`);
    return context.next(new Request(context.request, { headers }));
  }

  if (!aud || aud.startsWith('REPLACE')) {
    console.warn('[access] Cloudflare Access not configured — gate OFF (interim)');
    return context.next();
  }

  // Public read-only allowlist — chain verification surfaces need no token
  // (edge Access policy decides real reachability; see isPublicReadOnly).
  if (isPublicReadOnly(context.request)) {
    context.data.principal = 'public';
    context.data.access = { payload: { sub: 'public', service: false } };
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