# Bonding → LOVE Bridge

**Version:** 1.0 (draft)
**Date:** 2026-07-11

## 1. Overview

The bonding game (`bonding.p31ca.org`) currently computes LOVE tokens from gameplay (10 per molecule, 1 per atom, 5 per ping) but stores them only in IndexedDB – they vanish on page refresh.

This document specifies how to bridge the bonding telemetry relay to the LOVE ledger, minting real LOVE credits via `/withdraw` (CBS blind signatures) at session end.

## 2. Design Decisions

- **Endpoint:** `/withdraw` (CBS, private) – bonding gameplay is a care interaction (parent-child collaborative play). Blind signature preserves privacy.
- **Trigger:** At the end of a bonding session (when the user leaves the room or the room is destroyed), the telemetry relay calls `/withdraw`.
- **Amount:** The total LOVE earned during the session (sum of all gameplay LOVE).
- **Account:** The family DID (the parent's DID) receives the LOVE.

## 3. Implementation

### `software/bonding/src/index.ts`

Add a new route: `POST /d1/mint`

**Request:**
```json
{
  "sessionId": "uuid",
  "did": "did:key:abc123",
  "totalLove": 45,
  "msg": "bonding|session-uuid|..."
}
```

**Flow:**
1. The bonding relay calls `/blind-pubkey` on love-ledger to get `{ X, R, t }`.
2. It blinds the message locally (using the CBS WASM) and calls `/blind-sign` to get `s`.
3. It unblinds to get `sPrime`, then calls `/withdraw` with the blind signature.
4. The LOVE ledger mints the credits and records the `love_chain` entry.

**Code snippet (pseudo):**
```typescript
// In bonding relay
const msg = `bonding:${sessionId}:${totalLove}`;
const { X, R, t } = await fetch(`${LOVE_LEDGER}/blind-pubkey`).then(r => r.json());
const a = randomBytes(32), b = randomBytes(32);
const { c, cPrime } = blind(msg, a, b, R, X);
const { s } = await fetch(`${LOVE_LEDGER}/blind-sign`, { method: 'POST', body: JSON.stringify({ c, t }) }).then(r => r.json());
const sPrime = unblind(s, a);
await fetch(`${LOVE_LEDGER}/withdraw`, {
  method: 'POST',
  body: JSON.stringify({ did, amount: totalLove, msg, cPrime, sPrime })
});
```

## 4. Dependencies

- The bonding relay must have the CBS WASM loader (same as love-ledger) to perform blinding/unblinding.
- It needs the love-ledger URL and authentication (LOVE_AUTH_SECRET) for the `/withdraw` call.

## 5. Rollout

1. Add the CBS WASM loader to the bonding relay.
2. Add the `/d1/mint` route.
3. Call it from the BondingRoomDO when a session ends.
4. Test with a family pilot.
