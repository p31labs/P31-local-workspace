# LoveTransactionDO — Atomic Spend Transactions

## Problem: TOCTOU Race Condition

Current worker code in `handleTransaction` checks balance THEN deducts:

```typescript
// NOT ATOMIC — race condition possible
const balance = await env.LOVE_D1.prepare(`
  SELECT balance FROM balances WHERE user_id = ?
`).bind(body.userId).first<{ balance: number }>();

if (balance.balance < body.amount) {
  return err('Insufficient balance', 400);
}
// Gap here — another request could spend in between
await env.LOVE_D1.prepare(`
  UPDATE balances SET balance = balance - ? WHERE user_id = ?
`).bind(body.amount, body.userId).run();
```

Two concurrent spend requests could both pass the balance check and double-spend.

## Solution: Cloudflare Durable Object

Durable Objects provide **serialized execution** — only one request processes at a time per instance. We route all spend requests for a user through their dedicated DO instance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Worker fetch()                               │
│                                                                 │
│   /api/love/spend ──┬──► Find user's DO by userId             │
│                     │                                           │
│                     └──► DO.fetch(request) ──► Serialized      │
│                                                     processing │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Add DO binding to wrangler.toml

```toml
[[d1_databases]]
binding = "LOVE_D1"
database_name = "love-ledger"
database_id = "..."

[[durable_objects.bindings]]
name = "LOVE_TRANSACTION"
class_name = "LoveTransactionDO"
```

### 2. Implement Durable Object class

```typescript
// workers/love-ledger.ts — add after existing code

export class LoveTransactionDO {
  async fetch(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'spend':
        return this.handleSpend(request);
      case 'balance':
        return this.handleBalance(request);
      default:
        return new Response('Unknown action', { status: 400 });
    }
  }

  private async handleSpend(request: Request): Promise<Response> {
    const body = await request.json() as {
      userId: string;
      amount: number;
      spendType: string;
    };

    // Atomic balance check + deduction
    const result = await this.env.LOVE_D1.prepare(`
      UPDATE balances 
      SET balance = balance - ?,
          updated_at = ?
      WHERE user_id = ? 
        AND balance >= ?
      RETURNING balance
    `).bind(
      body.amount,
      Date.now(),
      body.userId,
      body.amount
    ).first<{ balance: number }>();

    if (!result) {
      // Either user doesn't exist OR insufficient balance
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance or user not found' 
      }), { status: 400 });
    }

    // Log the spend transaction
    await this.env.LOVE_D1.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, metadata, created_at)
      VALUES (?, ?, 'spend', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      body.userId,
      body.amount,
      body.spendType || 'SPEND',
      '{}',
      Date.now()
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      newBalance: result.balance,
      timestamp: Date.now()
    }));
  }

  private async handleBalance(request: Request): Promise<Response> {
    const body = await request.json() as { userId: string };
    const result = await this.env.LOVE_D1.prepare(`
      SELECT balance FROM balances WHERE user_id = ?
    `).bind(body.userId).first<{ balance: number }>();

    return new Response(JSON.stringify({ 
      balance: result?.balance ?? 0 
    }));
  }
}
```

### 3. Update Worker fetch to route to DO

```typescript
// In main fetch(), replace spend handling:
if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'spend') {
  if (request.method === 'POST') {
    // Route to Durable Object for atomic processing
    const body = await request.json() as { userId: string };
    const id = this.env.LOVE_TRANSACTION.idFromName(body.userId);
    const stub = this.env.LOVE_TRANSACTION.get(id);
    return stub.fetch(new URL('?action=spend', request.url), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
```

### 4. Add GET /balance endpoint (optional, uses DO)

```typescript
// Also route balance queries through DO for consistency
if (pathParts[0] === 'api' && pathParts[1] === 'love' && pathParts[2] === 'balance') {
  if (request.method === 'GET') {
    const userId = pathParts[3];
    const id = this.env.LOVE_TRANSACTION.idFromName(userId);
    const stub = this.env.LOVE_TRANSACTION.get(id);
    return stub.fetch(new URL('?action=balance', request.url), {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }
}
```

## Key Benefits

| Benefit | How |
|---------|-----|
| **Atomic spend** | Single SQL UPDATE with WHERE balance >= ? — no race condition |
| **Serialized per-user** | Each user has their own DO instance — different users can spend in parallel |
| **Consistent reads** | DO state is single-threaded — no stale reads |
| **Automatic retries** | Cloudflare retries failed DO requests |

## Trade-offs

- **Latency**: DO adds ~5-15ms per request (usually negligible)
- **Cost**: DO has separate billing (compute + storage)
- **Complexity**: More code to maintain

## Testing the Race Condition Fix

```typescript
// Test: Concurrent spends should not double-spend
it('atomic spend prevents double-spend', async () => {
  // Setup: user has 10 LOVE
  await db.prepare('UPDATE balances SET balance = 10 WHERE user_id = ?')
    .bind('user-1').run();

  // Fire two concurrent spend requests of 10 LOVE each
  const [result1, result2] = await Promise.all([
    doStub.fetch('/?action=spend', { 
      method: 'POST', 
      body: JSON.stringify({ userId: 'user-1', amount: 10, spendType: 'TEST' }) 
    }),
    doStub.fetch('/?action=spend', { 
      method: 'POST', 
      body: JSON.stringify({ userId: 'user-1', amount: 10, spendType: 'TEST' }) 
    }),
  ]);

  const r1 = await result1.json();
  const r2 = await result2.json();

  // One should succeed, one should fail
  expect([r1.success, r2.success].filter(Boolean)).toHaveLength(1);
});
```

## Migration Path

1. Add DO class to worker (this file)
2. Update wrangler.toml with DO binding
3. Test locally with `wrangler dev`
4. Deploy to preview, test race condition
5. Deploy to production

## Notes

- DO storage is optional — we use D1 for persistence (DO is just the transaction coordinator)
- The current "stub below" in the worker can now be implemented
- DO ID uses `idFromName(userId)` — deterministic, same user always routes to same DO