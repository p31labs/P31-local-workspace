# Two-Pool in Worker — Sovereignty/Performance Split

## Context

The `@p31/love-ledger` package implements a two-pool wallet where every LOVE earned is split 50/50:
- **Sovereignty Pool** (50%): Immutable, non-spendable record of care given/received
- **Performance Pool** (50%): Liquid based on Care Score (0-1, locked at CS=0, fully accessible at CS=1)

The worker currently stores a single `balance` column. This plan adds support for the two-pool model.

## Current Worker Schema

```sql
CREATE TABLE balances (
  user_id TEXT PRIMARY KEY,
  balance REAL NOT NULL DEFAULT 0,      -- Single total
  updated_at INTEGER NOT NULL
);
```

## Target Schema

```sql
CREATE TABLE balances (
  user_id TEXT PRIMARY KEY,
  total_earned REAL NOT NULL DEFAULT 0,      -- All-time earned
  sovereignty_pool REAL NOT NULL DEFAULT 0,  -- Immutable half
  performance_pool REAL NOT NULL DEFAULT 0,   -- Liquid half (controlled by care_score)
  care_score REAL NOT NULL DEFAULT 0.5,       -- 0-1, modulates performance pool access
  updated_at INTEGER NOT NULL
);
```

## Implementation

### 1. Schema Migration

Add new columns to existing table (non-breaking):

```sql
ALTER TABLE balances ADD COLUMN total_earned REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN sovereignty_pool REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN performance_pool REAL DEFAULT 0;
ALTER TABLE balances ADD COLUMN care_score REAL DEFAULT 0.5;
```

Migrate existing `balance` to the new columns (50/50 split):

```sql
UPDATE balances SET 
  total_earned = balance,
  sovereignty_pool = balance * 0.5,
  performance_pool = balance * 0.5,
  care_score = 0.5;
```

### 2. Update Worker Transaction Logic

**On Earn:**

```typescript
async handleEarn(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as TransactionRequest & { transactionType?: string };
  
  // Get canonical amount
  const amount = getCanonicalAmount(body.transactionType);
  
  // Calculate split
  const sovereigntyAmount = amount * 0.5;
  const performanceAmount = amount * 0.5;
  
  // Atomic update
  await env.LOVE_D1.prepare(`
    UPDATE balances SET
      total_earned = total_earned + ?,
      sovereignty_pool = sovereignty_pool + ?,
      performance_pool = performance_pool + ?,
      updated_at = ?
    WHERE user_id = ?
  `).bind(
    amount,
    sovereigntyAmount,
    performanceAmount,
    Date.now(),
    body.userId
  ).run();
  
  // ... rest of earn logic
}
```

**On Spend:**

```typescript
// Check performance pool availability based on care score
const result = await env.LOVE_D1.prepare(`
  SELECT performance_pool, care_score FROM balances WHERE user_id = ?
`).bind(body.userId).first<{ performance_pool: number; care_score: number }>();

const availableBalance = result.performance_pool * result.care_score;
if (availableBalance < body.amount) {
  return err('Insufficient available balance', 400);
}

// Deduct from performance pool only
await env.LOVE_D1.prepare(`
  UPDATE balances SET
    performance_pool = performance_pool - ?,
    updated_at = ?
  WHERE user_id = ?
`).bind(body.amount, Date.now(), body.userId).run();
```

**On Care Score Update:**

```typescript
// Endpoint: POST /api/love/care-score
async handleCareScore(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { userId: string; careScore: number };
  
  // Validate 0-1 range
  const score = Math.max(0, Math.min(1, body.careScore));
  
  await env.LOVE_D1.prepare(`
    UPDATE balances SET care_score = ?, updated_at = ? WHERE user_id = ?
  `).bind(score, Date.now(), body.userId).run();
  
  return json({ success: true, careScore: score });
}
```

### 3. Update Response Schema

All endpoints return new structure:

```typescript
// GET /api/love/balance/{userId}
{
  "userId": "...",
  "totalEarned": 100,
  "sovereigntyPool": 50,
  "performancePool": 50,
  "careScore": 0.75,
  "availableBalance": 37.5,  // performancePool * careScore
  "frozenBalance": 12.5      // performancePool * (1 - careScore)
}

// GET /api/love/transactions now returns pool-annotated transactions
{
  "transactions": [
    {
      "id": "...",
      "type": "earn",
      "amount": 10,
      "sovereigntyAmount": 5,
      "performanceAmount": 5,
      ...
    }
  ]
}
```

### 4. New Endpoints

```typescript
// POST /api/love/care-score
// Update user's care score (0-1)
// Body: { userId: string, careScore: number }

// GET /api/love/pool-details/{userId}
// Returns full pool breakdown
```

## Care Score Sources

Care Score is computed from transaction ratio (matching ledger.ts logic):

```typescript
// Compute from transactions (done client-side via ledger.ts)
// Or store computed value in user metadata and update periodically

// Sources that affect careScore:
// - CARE_RECEIVED (from peer state sync)
// - CARE_GIVEN (to peer)
// Higher ratio = higher careScore
```

## API Compatibility

| Endpoint | Change |
|----------|--------|
| GET /balance | Now returns full pool breakdown |
| POST /earn | Splits amount 50/50 to pools |
| POST /spend | Only spends from performance pool based on careScore |
| POST /care-score | NEW — update care score |

## Testing

```typescript
// Test split on earn
it('earn splits 50/50 between pools', async () => {
  const before = await getBalance(userId);
  await earn(userId, 'PING', 1); // 1 LOVE
  
  const after = await getBalance(userId);
  expect(after.sovereigntyPool).toBe(before.sovereigntyPool + 0.5);
  expect(after.performancePool).toBe(before.performancePool + 0.5);
});

// Test spend from performance pool only
it('spend cannot touch sovereignty pool', async () => {
  // User has 50 sovereignty, 50 performance, careScore=1.0 (all available)
  const result = await spend(userId, 60); // Try to spend more than available
  expect(result.status).toBe(400); // Should fail
});

// Test care score modulates available balance
it('careScore=0.5 locks half of performance pool', async () => {
  await updateCareScore(userId, 0.5);
  const balance = await getBalance(userId);
  
  expect(balance.availableBalance).toBe(balance.performancePool * 0.5);
  expect(balance.frozenBalance).toBe(balance.performancePool * 0.5);
});
```

## Files to Modify

1. `software/workers/love-ledger.ts` — transaction logic, new endpoints
2. `software/workers/D1_MIGRATION.md` — add schema migration commands
3. `software/spaceship-earth/src/hooks/useProtocolLoveSync.ts` — update to read new pool fields
4. `software/spaceship-earth/src/components/rooms/BridgeRoom.tsx` — display full pool breakdown

## Dependencies

- D1 Migration Script must run first (REAL columns)
- LoveTransactionDO provides atomic spend (recommended but not required)

## Notes

- Sovereignty pool is intentionally **immutable** — never decreases
- Care Score starts at 0.5 (50% of performance pool available)
- Maximum available balance = performancePool × careScore
- When careScore = 0, performance pool is completely frozen (anti-abuse)
- When careScore = 1, full performance pool is liquid