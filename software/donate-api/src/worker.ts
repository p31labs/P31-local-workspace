/**
 * donate-api — Cloudflare Worker
 *
 * Creates Stripe Checkout Sessions for phosphorus31.org/donate.
 * Secret key stored as CF secret (STRIPE_SECRET_KEY).
 *
 * Endpoints:
 *   POST /create-checkout  { amount, currency, mode, successUrl, cancelUrl [, p31_subject_id] }
 *   → { sessionId }
 */

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  DISCORD_WEBHOOK_URL: string;  // https://webhook.p31ca.org/webhook/stripe
  ALLOWED_ORIGIN: string;
  GENESIS_GATE_URL?: string;    // https://genesis.p31ca.org (R09)
  /** Optional KV for Stripe event idempotency (CWP-P31-MAP D-MAP-3/5). Omit in dev if unset. */
  DONATE_EVENTS?: KVNamespace;
  /**
   * Shared with p31-bot `P31_DISCORD_INGRESS_SECRET` — HMAC-SHA256 hex over the exact JSON body
   * forwarded to DISCORD_WEBHOOK_URL (`X-P31-Ingress-Signature: sha256=<hex>`).
   */
  P31_DISCORD_INGRESS_SECRET?: string;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// R09: Emit telemetry to Genesis Gate (fire-and-forget, never throws)
function emitEvent(env: Env, type: string, payload: Record<string, unknown>): void {
  const url = env.GENESIS_GATE_URL ?? 'https://genesis.p31ca.org';
  fetch(url + '/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'donate-api',
      type,
      payload,
      timestamp: new Date().toISOString(),
      session_id: 'worker-' + Math.random().toString(36).slice(2, 8),
    }),
  }).catch(() => { /* never block the response */ });
}

interface CheckoutRequest {
  amount: number;       // cents
  currency: string;     // "usd"
  mode: 'monthly' | 'once';
  successUrl: string;
  cancelUrl: string;
  /** Optional — `p31.subjectIdDerivation/0.1.0`: `u_[0-9a-f]{32}` or `guest_[0-9a-f]{20}` from passkey / guest mint (zero PII). Attached to Stripe Session metadata + client_reference_id. */
  p31_subject_id?: string;
}

/** Aligned with `p31ca/public/lib/p31-subject-id.js` (`p31.subjectIdDerivation/0.1.0`). */
const P31_SUBJECT_ID_PATTERN = /^u_[0-9a-f]{32}$|^guest_[0-9a-f]{20}$/;

function validatedSubjectId(raw: unknown): { ok: true; value: string | null } | { ok: false; message: string } {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  if (typeof raw !== 'string') return { ok: false, message: 'p31_subject_id must be a string' };
  const s = raw.trim();
  if (s.length === 0) return { ok: true, value: null };
  if (!P31_SUBJECT_ID_PATTERN.test(s)) {
    return {
      ok: false,
      message: 'Invalid p31_subject_id — expected p31.subjectIdDerivation/0.1.0 format (u_<32 hex> or guest_<20 hex>)',
    };
  }
  return { ok: true, value: s };
}

function corsHeaders(originHeader: string, env: Env): Record<string, string> {
  const primary = (env.ALLOWED_ORIGIN || 'https://phosphorus31.org').replace(/\/$/, '');
  const o = originHeader.replace(/\/$/, '');
  const list = new Set([
    primary,
    'https://p31ca.org',
    'https://www.p31ca.org',
    'http://localhost:4321',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://localhost:8080',
    'http://localhost:5173',
  ]);
  let acao = primary;
  if (o !== '' && (list.has(o) || /^https:\/\/[a-z0-9-]+\.p31ca\.pages\.dev$/i.test(o))) {
    acao = o;
  }
  return {
    'Access-Control-Allow-Origin': acao,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);

    if (url.pathname === '/create-checkout' && request.method === 'POST') {
      try {
        const body = await request.json() as CheckoutRequest;

        const subjectCheck = validatedSubjectId(body.p31_subject_id);
        if (!subjectCheck.ok) {
          return Response.json({ error: subjectCheck.message }, { status: 400, headers });
        }

        // Validate
        if (!body.amount || body.amount < 100) {
          return Response.json({ error: 'Minimum donation is $1' }, { status: 400, headers });
        }
        if (body.amount > 99999900) {
          return Response.json({ error: 'Amount too large' }, { status: 400, headers });
        }

        // Determine payment mode (subscription for monthly, payment for one-time)
        const paymentMode = body.mode === 'monthly' ? 'subscription' : 'payment';

        // Create Stripe Checkout Session via REST API (no SDK needed)
        const params = new URLSearchParams();
        params.append('mode', paymentMode);
        params.append('line_items[0][price_data][currency]', body.currency || 'usd');
        params.append('line_items[0][price_data][product_data][name]', 'Donation to P31 Labs');
        params.append('line_items[0][price_data][product_data][description]', 'Supporting free assistive technology for neurodivergent families');
        params.append('line_items[0][price_data][unit_amount]', String(body.amount));
        params.append('line_items[0][quantity]', '1');

        // Add recurring interval for monthly donations
        if (body.mode === 'monthly') {
          params.append('line_items[0][price_data][recurring][interval]', 'month');
        }

        params.append('success_url', body.successUrl || 'https://phosphorus31.org/donate?success=1');
        params.append('cancel_url', body.cancelUrl || 'https://phosphorus31.org/donate');
        // submit_type only valid for mode=payment (not subscription)
        if (body.mode !== 'monthly') {
          params.append('submit_type', 'donate');
        }

        const subjectTag = subjectCheck.value;
        if (subjectTag) {
          params.append('metadata[p31_subject_id]', subjectTag);
          params.append('client_reference_id', subjectTag);
        }

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!stripeRes.ok) {
          const err = await stripeRes.text();
          console.error('Stripe error:', err);
          return Response.json({ error: 'Failed to create checkout session' }, { status: 500, headers });
        }

        const session = await stripeRes.json() as { id: string };
        return Response.json({ sessionId: session.id }, { headers });

      } catch (e) {
        console.error('Worker error:', e);
        return Response.json({ error: 'Internal error' }, { status: 500, headers });
      }
    }

    if (url.pathname === '/stripe-webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env);
    }

    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      // Liveness only: does not call Stripe. Glass / MAP expect 200 + JSON with status ok.
      return Response.json({
        status: 'ok',
        worker: 'donate-api',
        version: '1.2.0',
        map: { checkoutSubjectBind: true, subjectIdSchema: 'p31.subjectIdDerivation/0.1.0' },
        timestamp: new Date().toISOString(),
      }, { headers });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers });
  },
};

// ── Stripe webhook handler ──────────────────────────────────────────────────

async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const sig = request.headers.get('stripe-signature');
  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 400 });
  }

  const rawBody = await request.text();

  // Verify HMAC-SHA256 signature (no SDK — Web Crypto API)
  const isValid = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Invalid signature', { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventId = typeof event.id === 'string' ? event.id : null;
  if (env.DONATE_EVENTS && eventId) {
    const dedupKey = `stripe:event:${eventId}`;
    const seen = await env.DONATE_EVENTS.get(dedupKey);
    if (seen) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // R09: Emit donation_processed to Genesis Gate (no amount — privacy). Include subject binding when present.
  if (event.type === 'checkout.session.completed') {
    const data = event.data as Record<string, unknown> | undefined;
    const obj = data?.object as Record<string, unknown> | undefined;
    const meta = obj?.metadata as Record<string, unknown> | undefined;
    const fromMeta = typeof meta?.p31_subject_id === 'string' ? meta.p31_subject_id : undefined;
    const fromRef = typeof obj?.client_reference_id === 'string' ? obj.client_reference_id : undefined;
    const p31_subject_id = fromMeta || fromRef;
    emitEvent(env, 'donation_processed', {
      source: 'stripe',
      mode: (obj?.mode as string) ?? 'unknown',
      ...(p31_subject_id ? { p31_subject_id } : {}),
    });
  }

  // Forward checkout.session.completed to the Discord bot webhook (best-effort)
  if (event.type === 'checkout.session.completed' && env.DISCORD_WEBHOOK_URL) {
    try {
      const body = JSON.stringify(event);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (env.P31_DISCORD_INGRESS_SECRET) {
        const hex = await hmacSha256Hex(env.P31_DISCORD_INGRESS_SECRET, body);
        headers['X-P31-Ingress-Signature'] = `sha256=${hex}`;
      }
      await fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers,
        body,
      });
    } catch (e) {
      console.error('Failed to forward to Discord bot:', e);
      // Don't fail the Stripe webhook — just log
    }
  }

  if (env.DONATE_EVENTS && eventId) {
    try {
      await env.DONATE_EVENTS.put(`stripe:event:${eventId}`, new Date().toISOString(), {
        expirationTtl: 60 * 60 * 24 * 90, // 90d — Stripe replays are short; this is for audit overlap
      });
    } catch (e) {
      console.error('DONATE_EVENTS put failed:', e);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Seconds; Stripe recommends rejecting payloads outside ~5 minutes to limit replay. */
const STRIPE_WEBHOOK_TOLERANCE_SEC = 300;

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    // Parse t= and v1= from the Stripe-Signature header
    const parts = Object.fromEntries(
      sigHeader.split(',').map(p => p.split('=') as [string, string])
    );
    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) return false;

    const tsNum = parseInt(timestamp, 10);
    if (Number.isNaN(tsNum)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - tsNum) > STRIPE_WEBHOOK_TOLERANCE_SEC) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computed === v1;
  } catch {
    return false;
  }
}
