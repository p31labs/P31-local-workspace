# Phase 1: IAM Integration (Cloudflare Access + JWT Validation)
**Status:** In Progress  
**Owner:** Security  
**ETA:** 4 days  

## 1. Cloudflare Access Setup

### 1.1 What is Cloudflare Access?
- Replaces custom JWT middleware with Cloudflare's Zero Trust network access
- Enforces SAML/OIDC (Google Workspace, Okta, Azure AD) at the edge
- MFA policies evaluated *before* request reaches your Worker
- JWT token (`CF-Access-Jwt-Assertion`) automatically injected on valid sessions

### 1.2 Setup Steps (Cloudflare Dashboard)
1. Go to **Zero Trust** → **Settings** → **Authentication**
2. Add identity provider:
   - **Google Workspace:** SAML or OIDC (recommended for P31 Labs)
   - **Okta:** OIDC
3. Configure **Applications** → **Add application** → **Self-hosted**
   - **App name:** `P31 EPCP Command Center`
   - **Domain:** `command-center.trimtab-signal.workers.dev`
   - **Path:** `/` (entire app)
   - **Allowed IdP:** Google Workspace
   - **Policies:** 
     - *Admin group:* `p31-admin@phosphorus31.org`
     - *Operator group:* `p31-operator@phosphorus31.org`
     - *Legal group:* `p31-legal@phosphorus31.org`
     - *Reader group:* `p31-reader@phosphorus31.org`

### 1.3 JWT Validation in Worker

```typescript
// Ephemeral public key cache (refreshed every 5 min)
let cfJwks: Record<string, string> = {};
let lastJwksFetch = 0;

async function getCfPublicKey(kid: string, env: Env): Promise<string> {
  const now = Date.now();
  if (now - lastJwksFetch > 300_000 || !cfJwks[kid]) {
    const resp = await fetch('https://<your-team>.cloudflareaccess.com/cdn-cgi/access/certs');
    const jwks = await resp.json();
    for (const key of jwks.keys) {
      cfJwks[key.kid] = key.x5c[0]; // PEM cert
    }
    lastJwksFetch = now;
  }
  return cfJwks[kid];
}

export interface AccessToken {
  sub: string;      // user email
  name: string;
  email: string;
  groups: string[];  // from IdP
  exp: number;
  iat: number;
}

export async function validateAccessJwt(request: Request, env: Env): Promise<AccessToken | null> {
  const jwt = request.headers.get('CF-Access-Jwt-Assertion') || '';
  if (!jwt) return null;

  const [headerB64, payloadB64, sigB64] = jwt.split('.');
  const kid = JSON.parse(atob(headerB64)).kid;

  const publicKeyPem = await getCfPublicKey(kid, env);
  const isValid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    await crypto.subtle.importKey('spki', pemToDer(publicKeyPem), { name: 'RSASSA-PKCS1-v1_5' }, false, ['verify']),
    base64urlToUint8Array(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );

  if (!isValid) return null;
  const payload = JSON.parse(atob(payloadB64));
  if (payload.exp * 1000 < Date.now()) return null;
  return payload as AccessToken;
}

// Helper: base64url → Uint8Array
function base64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

// Helper: PEM → DER (strip headers)
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '');
  return base64urlToUint8Array(b64).buffer;
}
```

## 2. Role-Based Access Control (RBAC)

### 2.1 Role Definitions
| Role | Group Email | Permissions |
|------|-------------|-------------|
| `reader` | `p31-reader@phosphorus31.org` | GET /api/status, /api/cf/summary |
| `operator` | `p31-operator@phosphorus31.org` | +POST /api/status, panic buttons, rollback |
| `admin` | `p31-admin@phosphorus31.org` | +Deploy gates, budget changes, legal hold toggle |
| `legal` | `p31-legal@phosphorus31.org` | Export audits, legal hold toggle, read-only during hold |

### 2.2 Enforcing Roles in Worker
```typescript
// Map Cloudflare Access groups to internal roles
function getRole(token: AccessToken): string {
  const groups = token.groups || [];
  if (groups.includes('p31-admin@phosphorus31.org')) return 'admin';
  if (groups.includes('p31-legal@phosphorus31.org')) return 'legal';
  if (groups.includes('p31-operator@phosphorus31.org')) return 'operator';
  if (groups.includes('p31-reader@phosphorus31.org')) return 'reader';
  return 'none';
}

// Middleware wrapper
async function withAccess(
  request: Request,
  env: Env,
  requiredRole: string,
  handler: (token: AccessToken) => Promise<Response>
): Promise<Response> {
  const token = await validateAccessJwt(request, env);
  if (!token) {
    return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="EPCP"' } });
  }
  const role = getRole(token);
  const roleLevel = { none: 0, reader: 1, operator: 2, legal: 2, admin: 3 };
  if ((roleLevel as any)[role] < (roleLevel as any)[requiredRole]) {
    return new Response('Forbidden', { status: 403 });
  }
  return handler(token);
}

// Usage in fetch():
if (url.pathname === '/api/status' && request.method === 'POST') {
  return withAccess(request, env, 'operator', async (token) => {
    // ... handle status write
    // Log event to D1 with token.sub as actor
  });
}
```

## 3. Fallback: Legacy STATUS_TOKEN (Transition Period)

During transition, support both Cloudflare Access JWT **and** legacy `STATUS_TOKEN`:

```typescript
async function authenticate(request: Request, env: Env): Promise<AccessToken | { sub: string; role: string } | null> {
  // Try Cloudflare Access first
  const accessToken = await validateAccessJwt(request, env);
  if (accessToken) return accessToken;

  // Fallback: legacy token (for scripts / CI)
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (token && token === env.STATUS_TOKEN) {
    return { sub: 'system:legacy-token', role: 'admin' };
  }
  return null;
}
```

## 4. Session Management (Frontend)

### 4.1 Detecting Cloudflare Access Session
```javascript
// In EPCP UI (React)
async function checkSession() {
  try {
    const resp = await fetch('/api/whoami', { credentials: 'include' });
    if (resp.ok) {
      const { sub, name, email, role } = await resp.json();
      return { authenticated: true, ...{ sub, name, email, role } };
    }
  } catch (_) {}
  return { authenticated: false };
}

// If not authenticated, redirect to Cloudflare Access login
function redirectToLogin() {
  window.location.href = 'https://<your-team>.cloudflareaccess.com/cdn-cgi/access/login?redirect_url=' + encodeURIComponent(window.location.href);
}
```

### 4.2 `/api/whoami` Endpoint
```typescript
if (url.pathname === '/api/whoami') {
  const token = await validateAccessJwt(request, env);
  if (!token) return jsonResponse({ authenticated: false }, 401);
  return jsonResponse({
    authenticated: true,
    sub: token.sub,
    name: token.name,
    email: token.email,
    role: getRole(token),
    groups: token.groups,
  });
}
```

## 5. Security Hardening

### 5.1 CSP Headers (add to all responses)
```typescript
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net", // for Three.js
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
].join('; ');

// Apply in fetch():
return new Response(body, {
  ...init,
  headers: {
    ...init?.headers,
    'Content-Security-Policy': CSP,
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
});
```

### 5.2 Rate Limiting (Durable Objects)
```typescript
// Durable Object for per-IP rate limiting
export class RateLimiter {
  state: DurableObjectState;
  constructor(state: DurableObjectState) { this.state = state; }

  async fetch(request: Request) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `ratelimit:${ip}`;
    let count = parseInt(await this.state.storage.get(key) || '0');
    if (count > 100) return new Response('Rate limited', { status: 429 });
    await this.state.storage.put(key, String(count + 1));
    await this.state.storage.setAlarm(Date.now() + 60_000); // reset in 1 min
    return new Response('OK');
  }
}
```

## 6. Testing Checklist

- [ ] Cloudflare Access app created with Google Workspace IdP
- [ ] JWT validation working (test with `curl -H "CF-Access-Jwt-Assertion: ..."`)
- [ ] Role mapping correct (reader/operator/admin/legal)
- [ ] Legacy STATUS_TOKEN fallback works
- [ ] CSP headers present on all responses
- [ ] Rate limiting active (Durable Object)
- [ ] `/api/whoami` returns correct role
- [ ] Unauthenticated users redirected to Cloudflare Access login
- [ ] Session persists across page reloads (cookie-based)

## 7. Rollout Plan

1. **Day 1-2:** Set up Cloudflare Access in dashboard + configure IdP
2. **Day 3:** Implement JWT validation in Worker (feature flag: `USE_CF_ACCESS=true`)
3. **Day 4:** Test with real Google Workspace accounts; verify roles
4. **Day 5:** Enable for 10% of users; monitor errors
5. **Day 6:** Enable for 50%; fix issues
6. **Day 7:** 100% rollout; deprecate legacy token (but keep as emergency backup)

## 8. Cost Impact

- **Cloudflare Access:** $3/user/month (first 50 users free) → ~$0/mo for P31 (small team)
- **Durable Objects (rate limiting):** ~$0.005/GB-month + $0.15/mo per 10M requests → negligible
- **JWT validation (CPU):** ~0.1ms per request → well within Cloudflare Workers free tier (10ms/request)

**Total additional cost:** ~$0/month for current scale.

---

**Phase 1 Status:** Ready for implementation.  
**Next:** Phase 2 (D1 schema migration + R2 routing).