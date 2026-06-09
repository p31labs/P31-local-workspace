# Payments down — donate-api triage

Short operator path when **monetary** glass is red or donors report checkout failures. Canonical deploy detail: **`DEPLOY.md`**. MAP static gate (home): **`npm run verify:map-pipeline`**. Live probes: **`P31_GLASS_STRICT=1 npm run ecosystem:glass`** (expects **donate-api-health** + **donate-api-health-workers-dev** UP).

---

## 1. Symptoms

- Glass: **donate-api-health** or **donate-api-health-workers-dev** not UP.
- **`GET /health`** not `200` or JSON missing `status: "ok"`.
- Donors see errors on **phosphorus31.org** / hub donate flows calling **`POST /create-checkout`**.
- Stripe Dashboard shows delivery failures for **`/stripe-webhook`**.

---

## 2. Checks (in order)

| Step | Command / action | Pass |
|------|------------------|------|
| A | `curl -sS -o /dev/null -w "%{http_code}\n" https://donate-api.phosphorus31.org/health` | `200` |
| B | Same for `https://donate-api.trimtab-signal.workers.dev/health` | `200` |
| C | Home repo: `npm run verify:constants` + `npm run verify:ecosystem` | exit 0 |
| D | Andromeda: `node scripts/verify-monetary-surface.mjs` (from `andromeda/`) | exit 0 |
| E | Worker logs (Cloudflare dashboard → **donate-api** → Logs) | No repeated 5xx on create-checkout or webhook |
| F | Stripe Dashboard → Developers → Webhooks → endpoint for this Worker | Recent deliveries; 4xx on **signature** → see §3 |

**Health semantics:** **`GET /health`** is **liveness only** (no Stripe round-trip). It does **not** prove **`STRIPE_SECRET_KEY`** is valid.

---

## 3. Webhook / signature failures

- **400 `Invalid signature`:** Wrong **`STRIPE_WEBHOOK_SECRET`**, altered body (proxy), or event **`t=`** outside **300s** tolerance (replay / clock skew).
- **400 `Webhook secret not configured`:** Secret missing in Worker env.
- **Idempotency:** With **`DONATE_EVENTS`** KV bound, duplicate **`event.id`** returns **`200`** + **`duplicate: true`** (Stripe retries are safe).

**Fix:** `npx wrangler secret put STRIPE_WEBHOOK_SECRET` (value from Stripe webhook signing secret), redeploy if needed; confirm endpoint URL matches production Worker route.

---

## 4. Rollback

1. Cloudflare Dashboard → **donate-api** → **Deployments** → roll back to last known-good version.
2. Re-run §2 checks A–B.
3. If custom domain broken but **workers.dev** healthy → DNS / route issue (see **`DEPLOY.md`** § Domain routing).

---

## 5. Comms template (internal)

> donate-api: [custom domain / workers.dev / both] degraded from [time]. Impact: [checkout / webhooks / health only]. Current: [rolled back to vX | investigating Stripe | DNS]. Next update: [time].

---

## Not covered by CI (manual)

- Live Stripe keys and real **`POST /create-checkout`** end-to-end.
- Webhook endpoint URL and signing secret rotation in Stripe Dashboard.
- Cloudflare Access / DNS for **`donate-api.phosphorus31.org`**.
- Genesis Gate / Discord forward from webhook (best-effort; failures are logged only).

CI **does** run: **`npm test`** in **`software/donate-api`** (mocked Stripe), and MAP **`verify-monetary-surface`** when wired from home **`verify:map-pipeline`**.
