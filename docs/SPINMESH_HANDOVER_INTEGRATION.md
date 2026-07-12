# Spin-Mesh Handover Integration

**Version:** 1.0 (draft)
**Date:** 2026-07-11

## 1. Overview

The spin-mesh barter system's HandoverDO is supposed to mint LOVE on successful physical handover. Currently, it only logs a `console.log` stub.

This document specifies how to wire HandoverDO to call `/transfer` on love-ledger with `type='barter_completion'`, recording the handover as a separate ledger event.

## 2. Design Decisions

- **Endpoint:** `/transfer` (transparent, court-admissible) – barter is a distinct activity from care withdrawal. Using `/transfer` with a custom type keeps the semantic separation.
- **Type:** `type='barter_completion'` – different from `'love_withdraw'` and `'transfer'`.
- **Amount:** The agreed barter value in LOVE (negotiated via the barter system).
- **Accounts:** The handover is between two DIDs (giver and receiver). The transfer records both.

## 3. Implementation

### `software/spin-mesh/logistics-do/src/index.ts`

When a handover is completed, call:

```typescript
await fetch(`${LOVE_LEDGER}/transfer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVE_AUTH_SECRET}` },
  body: JSON.stringify({
    from: giverDid,
    to: receiverDid,
    amount: barterValue,
    type: 'barter_completion',
    metadata: { handoverId, itemId, negotiationId }
  })
});
```

### Authentication

The transfer endpoint already accepts Bearer token (LOVE_AUTH_SECRET) for service-to-service calls. The spin-mesh worker needs the `LOVE_AUTH_SECRET` secret set.

## 4. Rollout

1. Add the `LOVE_AUTH_SECRET` secret to the spin-mesh logistics worker.
2. Add the fetch call in HandoverDO.
3. Test with a mock barter negotiation.
4. Deploy the logistics worker.

## 5. Querying Barter Events

Barter completions can be queried via `GET /chain?type=barter_completion` or via the Arcade dashboard (which will show them as a separate metric).
