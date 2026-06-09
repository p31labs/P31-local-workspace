# Controlled Work Package — P31 Monetary & Revenue Automation Pipeline

| Field | Value |
|--------|--------|
| **CWP ID** | `CWP-P31-MAP-2026-01` |
| **Title** | End-to-end monetary pipeline (pay-in → webhooks → durable record → ops export → hub truth) |
| **Version** | 1.0.3 |
| **Effective date** | 2026-04-25 |
| **Status** | Issued for execution |
| **Applies to** | `software/donate-api/`, `phosphorus31.org/planetary-planet` (donate flow), `software/discord/p31-bot/` (webhook ingress), `p31ca` **registry/docs** (alignment only), Cloudflare (Workers, **optional** KV/D1, secrets), **external** Stripe + Ko-fi + GitHub dashboards — **not** a substitute for CPA / legal advice |

**Sister / related work packages (do not merge scope):**

| CWP | Scope |
|-----|--------|
| `CWP-P31-ECO-2026-01` | p31ca.org product catalog, ground truth, inventory — **R8** inventory must list **this** pipeline’s public URLs **once** |
| `CWP-P31-SC-2026-01` | SUPER-CENTAUR / phosphorus mesh — **orthogonal** to payments except shared **org** story |
| `p31ca` **DEPLOY.md** | **Pages** project rules — **never** deploy Hearing Ops or other `dist` to `p31ca` |

---

## 1. Purpose

Establish a **complete, reviewable, and automatable** pipeline that covers:

1. **Pay-in** — Donors can complete **Stripe** Checkout on `phosphorus31.org` and (optionally) **Ko-fi** and **GitHub Sponsors** with clear, minimal PCI scope.
2. **Ingestion** — **Signed** webhooks (Stripe) and **verified** Ko-fi posts hit **one** or **documented** ingress path(s) with no secret leakage in client bundles beyond publishable keys.
3. **Fan-out (existing)** — **Genesis Gate** (`/event` fire-and-forget) and **Discord** relay (`DISCORD_WEBHOOK_URL` / `webhook.p31ca.org`) **keep working**; failure modes are explicit.
4. **Durable record (gap today)** — A **single** internal store of **contribution events** (not full PAN; not raw full card) suitable for **reconciliation** and **audit** — pick **KV** and/or **D1** in the pipeline’s design phase, not ad hoc copies.
5. **Operator export (gap today)** — **Periodic** (monthly) **CSV / JSON** or bookkeeper handoff, **separate** from the hot path.
6. **Truth in the hub** — `registry.mjs` / about pages / `hub-landing` **match** the implementation (e.g. Ko-fi is **not** a separate CF Worker in `donate-api` today — it is **Discord** `p31-bot`).

7. **Compliance posture** — Document **EIN / 501(c)(3) status language** in **marketing** only as **operator-approved**; pipeline code **does not** grant tax advice.

**Non-goals for v1.0.0 of this CWP (unless a revision adds tasks):** replacing your bank, running payroll, or automating full **QuickBooks** two-way sync.

---

## 2. System context (as-built vs aspirational)

### 2.1 As-built (repo-verified)

| Component | Path / artifact | Role |
|------------|------------------|------|
| **Checkout UI** | `phosphorus31.org/planetary-planet/src/pages/donate.astro` | `fetch` → `https://donate-api.phosphorus31.org/create-checkout`, `Stripe.js` redirect |
| **Stripe session API** | `software/donate-api/src/worker.ts` | `POST /create-checkout` → Stripe REST; `POST /stripe-webhook` (HMAC verify) |
| **Secrets** | `donate-api/wrangler.toml` + `wrangler secret` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DISCORD_WEBHOOK_URL`, `ALLOWED_ORIGIN` |
| **Downstream (Stripe path)** | Same worker + env | `emitEvent` → `GENESIS_GATE_URL` + `/event`; forward raw event to `DISCORD_WEBHOOK_URL` |
| **Health** | `GET /health` on worker | Liveness |
| **Ko-fi** | `software/discord/p31-bot` — `webhookHandler` | `POST /webhook/kofi` — `KOFI_VERIFICATION_TOKEN`, **spoon ledger** + telemetry |
| **Stripe → Discord (alternate path)** | `p31-bot` | `POST /webhook/stripe` — `checkout.session.completed` → spoons + channel behavior |
| **Fleet UI** | `command-center` | **D-MAP-12:** `donate-api` + `p31-stripe-webhook` (legacy) both listed; `pingFleet` health includes **donate-api** |
| **Hub copy** | `p31ca` registry / about / `hub-landing` | **D-MAP-2** done for `donate` row; see registry |
| **P2 / Ko-fi** | ADR | **`docs/adr/MAP-KOFI-001.md`** — Ko-fi remains **Discord**; optional future Worker | Accepted |
| **ECO 0.1** | `p31ca` | **`docs/ECO-P0-1-SNAPSHOT.md`** + `diff-index-sources.mjs` | Snapshot |
| **Merge safety** | `p31ca` | **`docs/PARALLEL_AGENT_COORDINATION.md`** | Touch boundaries for multi-agent |

### 2.2 Target (this CWP)

```text
[Donor]
   │  Stripe Checkout
   ▼
[phosphorus31.org /donate] ──POST──► [donate-api Worker]
   │                                    │
   │                                    ├─► Stripe (session + webhook)
   │                                    ├─► (optional) Durable store ◄── D-MAP-3
   │                                    ├─► Genesis Gate /event
   │                                    └─► Discord forward (receipt/ops)
   │
[Ko-fi] ──POST──► [Discord p31-bot] ◄── ADR MAP-KOFI-001 (alt: future donate-api route)
   │
[GitHub Sponsors / future] ──► [ledger + MAP-5]
   │
[Monthly export] ◄── D-MAP-4 (operator / finance)
```

---

## 3. Assumptions and constraints

- **A1** — `ALLOWED_ORIGIN` is **`https://phosphorus31.org`** for production; local dev ports are allow-listed in `donate-api` code.
- **A2** — **Stripe** is the only card rail in current production code; **no** card data touches P31 origin servers.
- **A3** — **PII** (e-mail in Stripe object) is handled only inside **signed** webhooks and **operator-approved** exports — **minimize** what is **logged** in Workers (see D-MAP-10).
- **A4** — **p31ca.org** does **not** host checkout; it may **link** to `phosphorus31.org/donate` or programs — no merge of **Pages** projects in this CWP.
- **A5** — **Fork PRs** must not require production Stripe secrets; tests use **mocks** (MAP-6).

---

## 4. Deliverables (outcomes)

| ID | Deliverable | Verify |
|----|-------------|--------|
| **D-MAP-1** | **Single source of truth** document: `docs/MONETARY-PIPELINE-AS-BUILT.md` (or this CWP **§2** extracted) with **Mermaid/ASCII** flow + every **URL** and **secret name** (not values) | Review |
| **D-MAP-2** | **Registry + about + `hub-landing`:** `donate` row = MAP as-built (v1.0.2). Remaining: ECO data-driven `index.astro` if still duplicated. | `hub:verify` **OK**; human spot-check `donate-about.html` |
| **D-MAP-3** | **Durable event log** (choose **one** of: Worker **KV** namespace, or **D1** table, or **both** with clear split: hot vs report) for **idempotent** `checkout.session.completed` (and optional Ko-fi normalized row) with **no** full card numbers | Staging test + schema doc |
| **D-MAP-4** | **`donate-api/scripts/pipeline-export.mjs`** (operator `wrangler kv key list` handoff) — full CSV automation **TBD** | `npm run export:pipeline` in **donate-api** |
| **D-MAP-5** | **Idempotency** for Stripe: **optional** **`DONATE_EVENTS` KV** stores `stripe:event:{id}` after first success; replay returns `{ duplicate: true }` | **Implemented** in `donate-api` + **vitest**; operator binds KV in `wrangler.toml` when ready |
| **D-MAP-6** | **Failure behavior**: if Discord/Genesis `fetch` fails, **return 200** to Stripe but **log** and **re-queue** to KV (DLQ list) or **alert** (email/Discord once) | Chaos test in staging |
| **D-MAP-7** | **Ko-fi** ingress = **Discord** (ADR **MAP-KOFI-001**). Dashboard URL: operator sets in **Ko-fi** → Discord webhook. | ADR + registry |
| **D-MAP-8** | **GitHub Sponsors** (if used): **manual ledger row** in export **or** webhook stub — document which | Ops |
| **D-MAP-9** | **`vitest` tests** in `donate-api` for **HMAC** verification + a **gold fixture** for webhook body (from Stripe test mode) | `pnpm test` in `donate-api` |
| **D-MAP-10** | **Logging policy** — `console` in production worker **redacts** e-mail and payment details | Code review |
| **D-MAP-11** | **`scripts/verify-monetary-surface.mjs`**: `donate-api` **name**, **donate.astro** contract, no **`sk_*`** in public trees | Root **`pnpm run quality`** + **monorepo-verify** + **donate-api** workflow |
| **D-MAP-12** | **`command-center` + `status.json`:** `donate-api` (`/health`); **`p31-stripe-webhook`** kept as **legacy/alt** until CF confirms removal | **Merged** (code comment in `index.js`) |
| **D-MAP-13** | **Runbook** `docs/MONETARY-RUNBOOK.md` — how to **rotate** Stripe secret, re-point Ko-fi, verify webhook in 5 min | New doc |
| **D-MAP-14** | **CI**: **`.github/workflows/donate-api.yml`** — `npm ci` + `vitest` + **`scripts/verify-monetary-surface.mjs`** on path changes | Green Actions |

---

## 5. Work breakdown structure (WBS)

### Phase 0 — Baseline, truth, and safety

| Task | Description | Out |
|------|-------------|-----|
| **0.1** | Author **D-MAP-1** from live Dashboard + this repo; include Stripe webhook **endpoint URL** and **signing secret** rotation procedure. | `MONETARY-PIPELINE-AS-BUILT.md` |
| **0.2** | **Grep** for `sk_live` / `sk_test` in **client** bundles (fail if in repo); **optional** gitleaks in CI. | Grep report / job |
| **0.3** | Confirm **`pk_live_…`** in `donate.astro` is only publishable; document **key rotation** in D-MAP-13. | Note in runbook |
| **0.4** | Fix **D-MAP-2** — registry, `generate-about-pages` source, `build-landing-data` if needed, **one** PR. | Merged |
| **0.5** | **Operator** sign-off: **EIN** and “501(c)(3) pending / determined” string on public pages. | E-mail or ticket id in CM |

### Phase 1 — Stripe hardening (donate-api)

| Task | Description | Out |
|------|-------------|-----|
| **1.1** | Implement **D-MAP-5** (idempotency store — may use D-MAP-3 store). | Code |
| **1.2** | Implement **D-MAP-6** dead-letter or retry policy. | Code |
| **1.3** | **D-MAP-10** logging redaction. | Code |
| **1.4** | **D-MAP-9** tests + **coverage** threshold in `vitest.config`. | Green tests |
| **1.5** | **Deploy**; verify in Stripe **Dashboard** → **Developers** → **Webhooks** → last delivery **2xx**. | Screenshot in CM (optional) |

### Phase 2 — Ko-fi path unification

| Task | Description | Out |
|------|-------------|-----|
| **2.1** | Decision: **keep Ko-fi on Discord** **or** add **`/kofi-webhook`** to `donate-api` and forward to same internal queue as Stripe (optional). | ADR in `docs/adr/MAP-KOFI-001.md` |
| **2.2** | If migrate: **normalize** event shape for **D-MAP-3**; if keep: **D-MAP-4** must export from **spoon/telemetry** or new **log** (document gap). | Plan |
| **2.3** | **D-MAP-7** checklist complete. | Done |

### Phase 3 — Durable record & export (MAP core)

| Task | Description | Out |
|------|-------------|-----|
| **3.1** | Design **D-MAP-3** schema: `id`, `source` (`stripe` \| `kofi` \| `github`), `ts`, `amount_cents?`, `currency`, `idempotency_key`, `pii_tier` (none \| hashed \| sealed export). | `schema.sql` or KV key doc |
| **3.2** | Implement **write** in worker path(s); **migrations** if D1. | Deployed |
| **3.3** | **D-MAP-4** export script + **.gitignore** for `exports/`. | Script |
| **3.4** | **PII review** with operator: what leaves the edge. | Sign-off |

### Phase 4 — UI & fleet alignment

| Task | Description | Out |
|------|-------------|-----|
| **4.1** | **D-MAP-12** — **command-center** + registry entries for `p31-stripe-webhook` vs `donate-api`. | PR |
| **4.2** | **D-MAP-11** — verify script + CI hook. | Green |

### Phase 5 — Optional rails

| Task | Description | Out |
|------|-------------|-----|
| **5.1** | **D-MAP-8** GitHub Sponsors. | Doc or stub |
| **5.2** | Open Collective / HCB — **reference only** in runbook, no code in v1. | Note |

### Phase 6 — CI, closure, CM

| Task | Description | Out |
|------|-------------|-----|
| **6.1** | **D-MAP-14** — workflow path filter for `software/donate-api/**`. | YAML |
| **6.2** | **D-MAP-13** runbook. | File |
| **6.3** | **CWP closure**: set **Status** to `Complete`, **Version** `1.1.0`, **Change log** with PR links. | This file |

---

## 6. Verification matrix

| Code | How |
|------|-----|
| **V-MAP-1** | `cd software/donate-api && pnpm|npm test` + `wrangler deploy` dry-run in CI (no secrets) |
| **V-MAP-2** | `cd p31ca && npm run hub:ci` after registry change |
| **V-MAP-3** | Staging: Stripe **test** mode webhook → one row in KV/D1, **no** duplicate on replay |
| **V-MAP-4** | Operator reviews redacted **CSV** |
| **V-MAP-5** | `verify-monetary-surface` or `quality` includes new script |

---

## 7. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **Wrong Pages project** deploy | `enterprise-deploy-guard` + D-MAP-11; **p31ca** = hub only (R1) |
| **Double charge / double post** to Discord | D-MAP-5 + Stripe idempotency |
| **PII in logs** | D-MAP-10 + periodic log review in CF |
| **Webhook secret rotation** | D-MAP-13; dual-active window < 1h with **both** secrets in env only during rotation (prefer Stripe **rolling** as documented) |
| **Fork** PR exfil of secrets | CI uses **mocks** only; no **live** keys in Action env for PRs from forks |

---

## 8. Rollback

1. **Worker** — `wrangler versions` or redeploy **previous** `donate-api` in CF dashboard.
2. **Stripe** — Re-point webhook to **previous** URL only if you keep a stable dual deploy (avoid unless emergency).
3. **Hub** — Revert **registry** PR; `npm run hub:ci` in `p31ca`.
4. **D1/KV** — Last resort: restore from D1 **backup** (if enabled) or **accept** gap in export for that month; document in CM.

---

## 9. Configuration management

| Change | Action |
|--------|--------|
| New **Stripe** secret | `wrangler secret put …`; D-MAP-13; **test** in Stripe CLI |
| New **inbound** rail (e.g. Open Collective) | New **CWP** revision or addendum; **D-MAP-3** schema version |
| **EIN** / tax status public copy | **Operator**-approved text only; not in `donate-api` business logic |
| This CWP | **Version** + **Change log** (below) |

### Change log

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-04-25 | Initial issue — full MAP WBS, deliverables, and sister-CWP table |
| 1.0.1 | 2026-04-25 | **Automated:** `verify-monetary-surface.mjs`, optional **KV** idempotency in **donate-api**, **vitest** idempotency case, **donate-api** **GitHub Action**, `quality` + **monorepo-verify** hook, `pipeline-export` stub |
| 1.0.2 | 2026-04-25 | **D-MAP-2 (donate):** `registry.mjs` + `generate-about-pages.mjs` aligned; `hub:build` + `hub:about:generate`; no false “Ko-fi → donate-api KV” claim |
| 1.0.3 | 2026-04-25 | **D-MAP-12** command-center + **status**; **ADR MAP-KOFI-001**; **ECO 0.1** snapshot; **PARALLEL_AGENT_COORDINATION** (multi-agent) |

---

## 10. Exclusions (non-goals)

- Implementing **bank API** (Plaid, etc.) in this CWP.
- **HCB** / **Fiscal** sponsor **application** process — **out of code**; runbook may **link** to external.
- Merging **phosphorus31.org** and **p31ca** deploys — see **CWP-P31-ECO-2026-01** / **P31-ROOT-MAP.md**.
- **Legal** **structuring** of donations beyond **operator** + **licensed** professional — **this document** is **engineering** and **ops** only.

---

## 11. Primary references (read order)

1. `software/donate-api/DEPLOY.md` — custom domain, curl smoke.
2. `software/donate-api/src/worker.ts` — canonical Stripe behavior.
3. `phosphorus31.org/planetary-planet/src/pages/donate.astro` — browser → API.
4. `software/discord/p31-bot` — `webhookHandler.ts`, `/webhook/kofi`, `/webhook/stripe`.
5. `P31-ROOT-MAP.md` (P31 home) — multi-site layout.
6. `CWP-P31-ECO-2026-01` — inventory **R8** / **D-SC7** must list **donate-api** and **webhook** hosts **consistently** with this CWP.
7. `p31ca/DEPLOY.md` — what **not** to deploy to **p31ca** Pages.

---

*End of CWP `CWP-P31-MAP-2026-01`*
