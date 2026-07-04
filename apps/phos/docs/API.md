# API Reference

## love-ledger

### `GET /balance`

Returns LOVE balance for a DID.

**Query Parameters:**
- `did` (required): The DID to query

**Response:**
```json
{
  "did": "did:key:...",
  "balance": 100,
  "staked": 50,
  "earned": 10,
  "reputation": 75
}
```

### `POST /transfer`

Transfer LOVE between DIDs.

**Headers:**
- `X-Signature` (required): Ed25519 signature of the JSON request body

**Body:**
```json
{
  "from": "did:key:...",
  "to": "did:key:...",
  "amount": 10
}
```

**Response:**
```json
{
  "transactionId": "uuid",
  "newBalance": 90,
  "timestamp": 1710000000000
}
```

---

## contract-engine

### `GET /contract`

Fetch a contract by ID.

**Query Parameters:**
- `contractId` (required): The contract ID

**Response:**
```json
{
  "contract": {
    "id": "uuid",
    "type": "ROCCA",
    "status": "draft|active|fulfilled|dissolved",
    "title": "Contract Title",
    "parties": ["did:key:...", "did:key:..."],
    "terms": [],
    "stakes": [],
    "createdAt": 1710000000000
  }
}
```

### `POST /contract/initiate`

Create a new contract.

**Headers:**
- `X-Signature` (required): Ed25519 signature from `partyADid`

**Body:**
```json
{
  "partyADid": "did:key:...",
  "partyBDid": "did:key:...",
  "title": "Contract Title",
  "description": "...",
  "terms": [],
  "stakes": [],
  "archetype": "provider_consumer"
}
```

### `POST /contract/sign`

Sign an existing contract.

**Headers:**
- `X-Signature` (required): Ed25519 signature from `partyId`

---

## governance-engine

### `GET /proposals`

List all proposals.

**Query Parameters:**
- `status` (optional): `all|draft|active|passed|failed`

**Response:**
```json
{
  "proposals": [
    {
      "id": "uuid",
      "title": "Proposal Title",
      "description": "...",
      "status": "active",
      "actionType": "AMEND_CONSTITUTION",
      "author": "did:key:...",
      "quorum": 0.2,
      "supermajority": 0.66,
      "votesFor": 10,
      "votesAgainst": 3,
      "createdAt": 1710000000000,
      "votingEndsAt": 1710003600000
    }
  ]
}
```

### `POST /vote`

Cast a vote on a proposal.

**Headers:**
- `X-Signature` (required): Ed25519 signature from `voterDid`

**Body:**
```json
{
  "proposalId": "uuid",
  "voterDid": "did:key:...",
  "choice": "for|against|abstain",
  "idempotencyKey": "optional-uuid"
}
```

### `GET /proposals/:id/tally`

Get delegation-aware vote tally.

**Response:**
```json
{
  "proposalId": "uuid",
  "rawVotes": { "for": 10, "against": 3, "abstain": 2 },
  "weightedVotes": { "for": 15, "against": 3, "abstain": 2 },
  "totalWeighted": 20,
  "quorumReached": true,
  "passed": true
}
```

### `POST /delegate`

Delegate voting power to another DID.

**Headers:**
- `X-Signature` (required): Ed25519 signature from `delegatorDid`

**Body:**
```json
{
  "delegatorDid": "did:key:...",
  "delegateDid": "did:key:...",
  "expiresAt": 1234567890
}
```

### `POST /proposal/resolve`

Resolve a proposal after voting ends.

**Headers:**
- `X-Signature` (required): Ed25519 signature from `author`
