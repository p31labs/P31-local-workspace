import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Types matching the worker ──────────────────────────────────────────────
interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  DISCORD_WEBHOOK_URL: string;
  ALLOWED_ORIGIN: string;
  P31_DISCORD_INGRESS_SECRET?: string;
}

const env: Env = {
  STRIPE_SECRET_KEY: 'sk_test_fake',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_fake',
  DISCORD_WEBHOOK_URL: 'https://example.com/webhook',
  ALLOWED_ORIGIN: 'https://phosphorus31.org',
};

// ── Import worker after mocking global fetch ───────────────────────────────
// The worker uses the global fetch for Stripe API calls, so we mock it.
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

// Lazy import so vi.stubGlobal runs first
async function getWorker() {
  const mod = await import('../worker');
  return mod.default;
}

// ── CORS preflight ─────────────────────────────────────────────────────────
describe('OPTIONS preflight', () => {
  it('returns 204 with CORS headers', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'OPTIONS',
      headers: { Origin: 'https://phosphorus31.org' },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});

// ── GET /health (MAP + glass liveness) ─────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 JSON with status ok and worker id', async () => {
    const worker = await getWorker();
    const req = new Request('https://donate-api.phosphorus31.org/health', { method: 'GET' });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; worker: string; map: { checkoutSubjectBind: boolean } };
    expect(body.status).toBe('ok');
    expect(body.worker).toBe('donate-api');
    expect(body.map.checkoutSubjectBind).toBe(true);
  });
});

// ── 404 for unknown routes ─────────────────────────────────────────────────
describe('unknown routes', () => {
  it('returns 404 for GET /', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/', { method: 'GET' });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown path', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/unknown', { method: 'POST' });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
  });
});

// ── POST /create-checkout validation ──────────────────────────────────────
describe('POST /create-checkout — validation', () => {
  it('rejects amount below minimum ($1 = 100 cents)', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50, currency: 'usd', mode: 'once',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/minimum/i);
  });

  it('rejects amount above maximum', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100_000_000, currency: 'usd', mode: 'once',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
  });

  it('reflects Origin https://p31ca.org for CORS (MAP hub donate page)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_from_hub' }), { status: 200 }),
    );

    const worker = await getWorker();
    const req = new Request('https://donate-api.phosphorus31.org/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://p31ca.org',
      },
      body: JSON.stringify({
        amount: 500,
        currency: 'usd',
        mode: 'once',
        successUrl: 'https://example.com/s',
        cancelUrl: 'https://example.com/c',
      }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://p31ca.org');
  });

  it('rejects invalid p31_subject_id', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 500,
        currency: 'usd',
        mode: 'once',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        p31_subject_id: 'not-a-subject',
      }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/Invalid p31_subject_id|subjectIdDerivation/i);
  });

  it('accepts valid u_* subject id and passes Stripe metadata + client_reference_id', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_test_subj' }), { status: 200 }),
    );
    const sid =
      'u_' + 'a'.repeat(32);
    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 500,
        currency: 'usd',
        mode: 'once',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        p31_subject_id: sid,
      }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);

    const callArgs = mockFetch.mock.calls[0];
    const stripeBody = callArgs[1].body as string;
    const parsed = new URLSearchParams(stripeBody);
    expect(parsed.get('metadata[p31_subject_id]')).toBe(sid);
    expect(parsed.get('client_reference_id')).toBe(sid);
  });

  it('rejects missing amount', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: 'usd', mode: 'once' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
  });
});

// ── POST /create-checkout — Stripe integration ────────────────────────────
describe('POST /create-checkout — Stripe call', () => {
  it('creates one-time checkout session and returns sessionId', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_test_abc123' }), { status: 200 }),
    );

    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500, currency: 'usd', mode: 'once',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json() as { sessionId: string };
    expect(body.sessionId).toBe('cs_test_abc123');
  });

  it('sends monthly mode as subscription to Stripe', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_test_monthly' }), { status: 200 }),
    );

    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, currency: 'usd', mode: 'monthly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel' }),
    });
    await worker.fetch(req, env);

    const callArgs = mockFetch.mock.calls[0];
    const body = callArgs[1].body as string;
    expect(body).toContain('mode=subscription');
    expect(body).toContain('recurring%5D%5Binterval%5D=month');
  });

  it('returns 500 if Stripe API fails', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('{"error": {"message": "invalid key"}}', { status: 401 }),
    );

    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500, currency: 'usd', mode: 'once',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(500);
  });
});

// ── POST /stripe-webhook ───────────────────────────────────────────────────
describe('POST /stripe-webhook', () => {
  it('rejects request with no stripe-signature header', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/stripe-webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
  });

  it('rejects invalid signature', async () => {
    const worker = await getWorker();
    const req = new Request('https://example.com/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1234,v1=badhash' },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
  });

  it('rejects signature when event timestamp is outside tolerance (replay / clock skew)', async () => {
    const secret = 'whsec_replay_test';
    const localEnv = { ...env, STRIPE_WEBHOOK_SECRET: secret };
    const payload = JSON.stringify({ type: 'checkout.session.completed', id: 'evt_old', data: {} });
    const oldTs = Math.floor(Date.now() / 1000) - 400;
    const signedPayload = `${oldTs}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const v1 = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const worker = await getWorker();
    const req = new Request('https://example.com/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${oldTs},v1=${v1}` },
      body: payload,
    });
    const res = await worker.fetch(req, localEnv);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toMatch(/Invalid signature/i);
  });

  it('returns 400 Invalid JSON when body is not JSON after valid signature', async () => {
    const secret = 'whsec_json_fail';
    const localEnv = { ...env, STRIPE_WEBHOOK_SECRET: secret };
    const payload = '{"type":"checkout.session.completed","broken":';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const v1 = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const worker = await getWorker();
    const req = new Request('https://example.com/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${timestamp},v1=${v1}` },
      body: payload,
    });
    const res = await worker.fetch(req, localEnv);
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/Invalid JSON/i);
  });

  it('returns 400 when webhook secret is not configured', async () => {
    const worker = await getWorker();
    const localEnv = { ...env, STRIPE_WEBHOOK_SECRET: '' };
    const req = new Request('https://example.com/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=ab' },
      body: '{}',
    });
    const res = await worker.fetch(req, localEnv);
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/Webhook secret not configured/i);
  });

  it('accepts a valid HMAC-SHA256 signature and returns 200', async () => {
    // Build a real Stripe-Signature header using Web Crypto
    const secret = 'whsec_test_valid';
    const localEnv = { ...env, STRIPE_WEBHOOK_SECRET: secret };
    const payload = JSON.stringify({ type: 'checkout.session.completed', data: {} });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${payload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const v1 = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Mock Discord webhook call (best-effort forward)
    mockFetch.mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const worker = await getWorker();
    const req = new Request('https://example.com/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${timestamp},v1=${v1}` },
      body: payload,
    });
    const res = await worker.fetch(req, localEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as { received: boolean };
    expect(body.received).toBe(true);
  });

  it('forwards Discord ingress HMAC when P31_DISCORD_INGRESS_SECRET is set', async () => {
    const whsec = 'whsec_test_valid';
    const ingress = 'ingress_shared_test_secret';
    const localEnv = { ...env, STRIPE_WEBHOOK_SECRET: whsec, P31_DISCORD_INGRESS_SECRET: ingress };
    const payload = JSON.stringify({
      id: 'evt_ingress_1',
      type: 'checkout.session.completed',
      data: { object: {} },
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(whsec),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signedPayload),
    );
    const v1 = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    mockFetch.mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const worker = await getWorker();
    const req = new Request('https://example.com/stripe-webhook', {
      method: 'POST',
      headers: { 'stripe-signature': `t=${timestamp},v1=${v1}` },
      body: payload,
    });
    await worker.fetch(req, localEnv);

    const discordCall = mockFetch.mock.calls.find((c) => c[0] === env.DISCORD_WEBHOOK_URL);
    expect(discordCall).toBeDefined();
    const init = discordCall![1] as { headers: Record<string, string>; body: string };
    expect(init.body).toBe(payload);
    expect(init.headers['X-P31-Ingress-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
  });
});

// ── CORS origin handling ───────────────────────────────────────────────────
describe('CORS origin', () => {
  it('allows localhost dev origin', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_test' }), { status: 200 }),
    );
    const worker = await getWorker();
    const req = new Request('https://example.com/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4321',
      },
      body: JSON.stringify({ amount: 200, currency: 'usd', mode: 'once',
        successUrl: 'https://example.com/s', cancelUrl: 'https://example.com/c' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4321');
  });
});

// ── Stripe webhook idempotency (DONATE_EVENTS KV) ───────────────────────────
describe('POST /stripe-webhook — idempotency', () => {
  function signedPost(body: string, secret: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${body}`;
    return crypto.subtle
      .importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then((key) => crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload)))
      .then((sig) => {
        const v1 = Array.from(new Uint8Array(sig))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        return new Request('https://example.com/stripe-webhook', {
          method: 'POST',
          headers: { 'stripe-signature': `t=${timestamp},v1=${v1}` },
          body,
        });
      });
  }

  it('second delivery of same Stripe event id returns duplicate:true', async () => {
    const storage = new Map<string, string>();
    const mockKV = {
      async get(k: string) {
        return storage.get(k) ?? null;
      },
      async put(k: string, v: string) {
        storage.set(k, v);
      },
    } as KVNamespace;

    mockFetch.mockResolvedValue(new Response('ok', { status: 200 }));

    const secret = 'whsec_idem_test';
    const localEnv = {
      ...env,
      STRIPE_WEBHOOK_SECRET: secret,
      DONATE_EVENTS: mockKV,
    };
    const payload = JSON.stringify({
      id: 'evt_idem_1',
      type: 'checkout.session.completed',
      data: { object: {} },
    });

    const worker = await getWorker();
    const req = await signedPost(payload, secret);
    const r1 = await worker.fetch(req, localEnv);
    expect(r1.status).toBe(200);
    const j1 = await r1.json() as { received: boolean; duplicate?: boolean };
    expect(j1.received).toBe(true);
    expect(j1.duplicate).toBeUndefined();

    const req2 = await signedPost(payload, secret);
    const r2 = await worker.fetch(req2, localEnv);
    expect(r2.status).toBe(200);
    const j2 = await r2.json() as { received: boolean; duplicate?: boolean };
    expect(j2.duplicate).toBe(true);
  });
});
