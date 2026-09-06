# Donate API Deployment Guide

**Monetary pipeline (full WBS, durable store, export, CI):** see **`../docs/CONTROLLED-WORK-PACKAGE-MONETARY-PIPELINE.md`** (`CWP-P31-MAP-2026-01`).

## Ground truth (this deployment)

| Surface | Value |
|--------|--------|
| **Default `workers.dev`** | `https://donate-api.trimtab-signal.workers.dev` (Worker name + account subdomain) |
| **Custom domain** | `donate-api.phosphorus31.org` |
| **Route** | `donate-api.phosphorus31.org/*` |

Health checks and glass probes use the **custom domain** URL: `https://donate-api.phosphorus31.org/health` (see home `p31-constants.json` / `p31-ecosystem.json`).

**`GET /health` semantics:** Returns **`200`** and JSON **`{ status: "ok", worker: "donate-api", … }`**. This is **liveness only** — it does not verify Stripe credentials. Strict glass (`P31_GLASS_STRICT=1 npm run ecosystem:glass`) treats monetary probes as required when enabled.

**Incident triage:** **`RUNBOOK-PAYMENTS-DOWN.md`** (symptom → checks → webhook → rollback → comms).

## Secrets and env (runtime)

| Name | Kind | Role |
|------|------|------|
| `STRIPE_SECRET_KEY` | wrangler secret | **`POST /create-checkout`** → Stripe Checkout Sessions API |
| `STRIPE_WEBHOOK_SECRET` | wrangler secret | HMAC verify on **`POST /stripe-webhook`** (`Stripe-Signature`); missing → **400** |
| `DISCORD_WEBHOOK_URL` | wrangler secret / var | Optional; forwards **`checkout.session.completed`** (best-effort) |
| `ALLOWED_ORIGIN` | `[vars]` in `wrangler.toml` | Primary CORS origin (default phosphorus31.org) |
| `DONATE_EVENTS` | KV binding (optional) | Idempotency: **`stripe:event:{eventId}`**, 90d TTL |
| `GENESIS_GATE_URL` | optional var | Fire-and-forget **`donation_processed`** telemetry |

**Webhook:** Signature verification uses **HMAC-SHA256** over **`t.payload`**. Requests with **`t`** more than **300 seconds** from Worker time fail verification (**400**), limiting replay. Valid duplicate **`event.id`** with KV returns **200** + **`duplicate: true`**.

## Quick Deploy

```bash
cd software/donate-api

# Deploy to Cloudflare Workers
npx wrangler deploy
```

## Domain routing (Cloudflare Dashboard)

After deploying, attach the org hostname to this Worker (same **Workers & Pages** flow you used):

1. **Workers & Pages** → **`donate-api`** → **Domains & Routes** (or **Triggers** + custom domain, depending on UI version).
2. **Custom domain:** `donate-api.phosphorus31.org` — should show a route like **`donate-api.phosphorus31.org/*`** to this Worker.
3. **Zone DNS** (`phosphorus31.org`): If Cloudflare does not auto-create a record, add a CNAME for **`donate-api`** → target **`donate-api.trimtab-signal.workers.dev`**, **Proxied** (orange cloud). (Do **not** use a generic `donate-api.workers.dev` target; the account-scoped `*.trimtab-signal.workers.dev` host matches the default Worker URL.)

4. The **`workers.dev`** host (`donate-api.trimtab-signal.workers.dev`) is for default-subdomain access; production clients and **MAP** verification should use **`https://donate-api.phosphorus31.org`**.

## Verify Deployment

**Static MAP gate (Andromedia repo root):** `node scripts/verify-monetary-surface.mjs` — `wrangler.toml`, worker routes, Phosphorus `donate.astro`, no `sk_*` in public trees, optional `../p31/p31-constants.json` cross-checks.

```bash
# Liveness (must match p31-constants payment.donateApiHealthUrl)
curl -sS -o /dev/null -w "%{http_code}\n" https://donate-api.phosphorus31.org/health
```

```bash
# Test the worker
curl -X POST https://donate-api.phosphorus31.org/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 2500, "currency": "usd", "mode": "once", "successUrl": "https://phosphorus31.org/donate?success=1", "cancelUrl": "https://phosphorus31.org/donate"}'
```

Expected response: `{"sessionId": "cs_..."}`

**Subject-bound donation (MAP Track C):** optionally pass `p31_subject_id` (same string as `localStorage.p31_subject_id`) — `p31.subjectIdDerivation/0.1.0` shape: `u_<32 hex>` or `guest_<20 hex>`. The Worker attaches **`metadata[p31_subject_id]`** on the Stripe Checkout Session and **`client_reference_id`** for Dashboard search; webhooks and Genesis Gate `donation_processed` payloads may include **`p31_subject_id`** when present (no card data).

## Troubleshooting

- **Error 524:** Worker timeout - check worker logs in Cloudflare dashboard
- **CORS errors:** Verify ALLOWED_ORIGIN matches your domain exactly
- **404 on API:** Ensure you included `/create-checkout` in the URL

## Stripe Checkout Session

The worker creates Stripe Checkout Sessions. Make sure:
- Stripe secret key is set: `npx wrangler secret put STRIPE_SECRET_KEY`
- Use `sk_live_...` for production (starts with `sk_live_`)

## Optional: webhook idempotency (KV)

To deduplicate Stripe retries, create a KV namespace and uncomment `[[kv_namespaces]]` in `wrangler.toml`, then redeploy. Keys: `stripe:event:{eventId}` (90-day TTL).

**Package tests:** `npm test` in `software/donate-api`.
