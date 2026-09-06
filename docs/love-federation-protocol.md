# LOVE Ledger Federation Protocol — Design Document

**Status:** Draft v0.1  
**Date:** 2026-07-22  
**Author:** P31 Labs

---

## 1. Problem Statement

The LOVE Ledger currently operates as a single-instance system. All attestations, DRRP counters, and care receipts are stored in one shared D1 database served by the federation-bridge Worker at `federation.p31ca.org`.

This works for the 18 pilot families but does not scale to a Network Nation where:

- Multiple communities (other DAOs, gaming guilds, care networks) want to run their own LOVE Ledger instances with independent governance.
- Attestations between members of different instances need to be recognized across boundaries.
- DRRP (Diminishing Returns on Repeated Pairings) needs to work across instances — if Alice helps Bob on instance A and later helps Bob on instance B, the decay should accumulate, not reset.

## 2. Design Goals

| Goal | Rationale |
|------|-----------|
| **Cross-instance attestation** | Alice (instance A) helps Bob (instance B) → both ledgers record it |
| **Global DRRP** | Pair decay accumulates across instances, not resetting per instance |
| **Sovereignty per instance** | Each instance controls its own governance, reward rates, membership |
| **No central authority** | No single registry that all instances must trust |
| **Eventually consistent** | Attestations propagate asynchronously; DRRP is approximate, not exact |
| **Minimal overhead** | Lightweight protocol that doesn't require L1 blockchain fees |

## 3. Architecture

### 3.1 Instance Identity

Each LOVE Ledger instance has:

- A `did:web` identifier (e.g., `did:web:love.phos.p31ca.org`)
- An Ed25519 keypair for signing attestations
- A known endpoint for federation: `https://{instance}/.well-known/love-federation.json`

The `.well-known/love-federation.json` file exposes:

```json
{
  "id": "did:web:love.phos.p31ca.org",
  "name": "PHOS Care Mesh",
  "version": "1.0",
  "endpoints": {
    "attest": "/federation/attest",
    "query": "/federation/query",
    "sync": "/federation/sync"
  },
  "publicKey": "MCowBQYDK2VwAyEA...",
  "baseRewards": {
    "bonding_complete": 25,
    "bonding_assist": 10,
    "bashball_assist": 15,
    "bashball_teamwork": 10
  }
}
```

### 3.2 Cross-Instance Attestation Flow

```
Alice (instance A) helps Bob (instance B)
   ↓
1. Instance A creates local attestation:
   - pair_id = normalize(Alice_DID, Bob_DID)
   - multiplier = local DRRP(pair_id)
   - reward = baseReward * multiplier
   - Append to love_chain
   
2. Instance A broadcasts attestation to Instance B:
   POST https://instance-b/federation/attest
   {
     "local_instance": "did:web:love.instance-a",
     "attestation": {
       "giver_did": "did:key:z6Alice",
       "receiver_did": "did:key:z6Bob",
       "action": "bonding_complete",
       "reward": 25,
       "multiplier": 1.0,
       "pair_id": "did:key:z6alice:did:key:z6bob",
       "timestamp": 1784683076,
       "hash": "abc123..."
     },
     "signature": "ed25519_sig_from_instance_a"
   }

3. Instance B verifies:
   - Signature from instance A's public key (from .well-known)
   - Hash integrity
   - Timestamp within acceptable window (±60s)
   
4. Instance B records:
   - Upserts local attestations counter (increments pair_id count)
   - This affects future DRRP calculations for this pair on instance B
   - Does NOT append to instance B's love_chain (avoids double-counting)
```

### 3.3 Global DRRP Model

Each instance maintains its own `attestations` table. When a cross-instance attestation arrives:

1. The local `count` for that `pair_id` is incremented.
2. Future local attestations for that pair use the updated count in DRRP calculation.

**Tradeoff:** DRRP is approximate across instances because attestations propagate asynchronously. Two instances may have different counts for the same pair at any moment. However, because DRRP is logarithmic (each additional interaction has diminishing marginal impact), the error is bounded and converges quickly.

**Example:**
- Alice and Bob interact 5 times on instance A, 3 times on instance B.
- Instance A's count: 5 (local) + 0 (not yet received from B) = 5
- Instance B's count: 3 (local) + 5 (received from A via federation) = 8
- After sync, both instances have count ≈ 8.
- DRRP multiplier difference: `1/(1+log2(6)) = 0.28` vs `1/(1+log2(9)) = 0.23` — negligible difference for reward calculation.

### 3.4 Instance Discovery

Instances discover each other via:

1. **Static configuration:** Each instance has a `FEDERATION_PEERS` list in its wrangler.toml or D1.
2. **Well-known crawl:** Periodically scan `.well-known/love-federation.json` on known peers.
3. **Gossip:** When instance A receives an attestation from instance C (which it didn't know about), it adds C to its peer list.

No central registry. Discovery is decentralized.

### 3.5 Sync Protocol

For new instances joining the network or recovering from downtime:

```
GET https://instance-b/federation/sync?since=1784683000&pair_ids=did:key:alice:did:key:bob,did:key:alice:did:key:charlie

Response:
{
  "instance": "did:web:love.instance-b",
  "attestations": [
    {
      "pair_id": "did:key:alice:did:key:bob",
      "count": 5,
      "last_action": "bonding_complete",
      "last_at": 1784683076
    }
  ],
  "cursor": "1784683076"
}
```

The requesting instance upserts the counts into its local `attestations` table.

## 4. D1 Schema Changes

### 4.1 New Tables

```sql
-- Federation peers
CREATE TABLE IF NOT EXISTS federation_peers (
  id TEXT PRIMARY KEY,
  did TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  public_key TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cross-instance attestation log (for audit)
CREATE TABLE IF NOT EXISTS federation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_instance TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reward REAL NOT NULL,
  signature TEXT NOT NULL,
  received_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fed_log_pair ON federation_log (pair_id, received_at);
CREATE INDEX IF NOT EXISTS idx_fed_log_source ON federation_log (source_instance, received_at);
```

### 4.2 Modified Columns

The `attestations` table gains a `cross_instance_count` column to track cross-instance interactions separately from local ones:

```sql
ALTER TABLE attestations ADD COLUMN cross_instance_count INTEGER NOT NULL DEFAULT 0;
```

Total count for DRRP = `count + cross_instance_count`.

## 5. API Endpoints

### 5.1 `GET /.well-known/love-federation.json`

Returns instance metadata, public key, endpoints. Cached for 1 hour.

### 5.2 `POST /federation/attest`

Accepts a signed attestation from a peer instance. Verifies signature, upserts local counter.

### 5.3 `GET /federation/query`

Query DRRP state for a list of pair_ids. Used by peer instances before minting.

### 5.4 `GET /federation/sync`

Bulk sync endpoint. Returns all attestations since a given timestamp cursor, optionally filtered by pair_ids.

### 5.5 `POST /federation/peer`

Register or update a federation peer. Requires admin signature.

## 6. Implementation Phases

| Phase | Scope | Effort |
|-------|-------|--------|
| **Phase 1** | `.well-known/love-federation.json` endpoint + peer registry | 2h |
| **Phase 2** | Cross-instance attestation (POST /federation/attest) | 3h |
| **Phase 3** | Sync protocol (GET /federation/sync) | 2h |
| **Phase 4** | Gossip discovery + peer health checks | 2h |
| **Total** | | **9h** |

## 7. Security Considerations

| Threat | Mitigation |
|--------|-----------|
| **Fake attestation from untrusted peer** | Signature verification against `.well-known` public key |
| **Replay attack** | Attestation includes timestamp; reject if outside ±60s window |
| **DRRP manipulation** | Cross-instance count tracked separately; local instance cannot reduce cross_instance_count |
| **Peer impersonation** | `did:web` verification (HTTPS fetch of DID document) |
| **Denial of service** | Rate limiting per peer; exponential backoff on failed syncs |

## 8. Dependencies

- **Existing:** `federation-bridge` Worker, `LOVE_DB` D1 database, `attestations` table
- **New:** `federation_peers` table, `federation_log` table, `cross_instance_count` column
- **External:** None. No blockchain, no third‑party service.

## 9. References

- DID Core v1.0 (W3C Recommendation)
- Ed25519 signatures (RFC 8032)
- ActivityPub federation model (W3C) — inspiration for peer discovery
