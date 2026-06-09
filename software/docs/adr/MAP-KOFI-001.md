# ADR MAP-KOFI-001 — Ko-fi ingress vs Stripe (donate-api)

| Field | Value |
|--------|--------|
| **Status** | Accepted |
| **Date** | 2026-04-25 |
| **Context** | `CWP-P31-MAP-2026-01` Phase 2 (Ko-fi path unification) |

## Context

- **Stripe:** `software/donate-api` Worker on `donate-api.phosphorus31.org` — Checkout session API + signed `/stripe-webhook`, optional `DONATE_EVENTS` KV idempotency.
- **Ko-fi:** webhook posts to **Discord `p31-bot`** (`/webhook/kofi`, verification token), spoon ledger + telemetry — **not** the same Worker as `donate-api`.
- **Legacy:** `p31-stripe-webhook.trimtab-signal.workers.dev` may still exist in Cloudflare; **command-center** lists both **donate-api** (canonical) and **p31-stripe-webhook** until operator confirms retirement.

## Decision

1. **Keep Ko-fi on Discord** for this release train — no requirement to move Ko-fi into `donate-api` unless ops want a **single** HTTP ingress for all rails.
2. **Document** in registry / MAP (done); **do not** claim “Ko-fi → donate-api KV.”
3. **Future (non-blocking):** optional `POST /kofi-webhook` on `donate-api` that normalizes events + writes the same KV as Stripe, then forwards to Discord — only if product needs one edge surface.

## Consequences

- ECO **inventory** lists **Discord** for Ko-fi verification, **donate-api** domain for Stripe (see **D-SC7** alignment with host tables).
- Parallel work on **SUPER-CENTAUR** / **phosphorus** does not need to change Ko-fi unless that CWP explicitly adds a server route.

## References

- `docs/CONTROLLED-WORK-PACKAGE-MONETARY-PIPELINE.md`
- `software/discord/p31-bot` — `webhookHandler.ts`
