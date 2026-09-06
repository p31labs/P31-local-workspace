import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { measureSpoonDelta } from './spoon-measure';
import { writeReceipt, ReplayError } from './receipt-writer';
import { signReceipt, base64ToBytes, bytesToBase64 } from './receipt-crypto';

type Env = {
  LOVE_LEDGER: D1Database;
  CREATION_KV: KVNamespace;
  RECEIPT_SIGNER_PRIVATE_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

const receiptSchema = z.object({
  intent_id: z.string(),
  did: z.string(),
  worker_did: z.string(),
  pre_spoons: z.number().min(0).max(5),
  post_spoons: z.number().min(0).max(5),
  artifacts: z.array(z.string()).optional(),
  nonce: z.string().optional(),
  quote: z.object({
    spoons_saved: z.number(),
    care_value: z.number(),
    love_amount: z.number(),
    usdc_amount: z.number(),
    settlement_unit: z.enum(['love', 'usdc']),
  }),
});

app.post('/receipt', zValidator('json', receiptSchema), async (c) => {
  const { intent_id, did, worker_did, pre_spoons, post_spoons, artifacts, nonce, quote } = c.req.valid('json');

  // Trustless oracle: delta is reported by the RENDERER (data-spoons),
  // not by the worker. The agent cannot fabricate its own value.
  const actual_spoons_saved = measureSpoonDelta(pre_spoons, post_spoons);

  // Tolerance: a 0.5-spoon variance is within delivery.
  const quote_met = Math.abs(actual_spoons_saved - quote.spoons_saved) <= 0.5;

  // Axis-2: Ed25519 DID-attestation of the receipt payload (Web Crypto).
  const canonical = [
    intent_id, did, worker_did,
    String(actual_spoons_saved), String(quote.care_value),
    quote.settlement_unit,
    String(quote.settlement_unit === 'love' ? quote.love_amount : quote.usdc_amount),
  ].join('|');
  const receiptSig = bytesToBase64(await signReceipt(canonical, base64ToBytes(c.env.RECEIPT_SIGNER_PRIVATE_KEY)));

  let receipt;
  try {
    receipt = await writeReceipt(c.env.LOVE_LEDGER, {
      intent_id,
      from_did: did,
      to_did: worker_did,
      spoons_saved: actual_spoons_saved,
      care_value: quote.care_value,
      settlement_unit: quote.settlement_unit,
      amount: quote.settlement_unit === 'love' ? quote.love_amount : quote.usdc_amount,
      artifacts: artifacts ?? [],
      quote_met,
      signature: receiptSig,
      nonce,
    });
  } catch (err) {
    if (err instanceof ReplayError) {
      return c.json({ error: 'Spoon measurement replay detected' }, 409);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }

  await c.env.CREATION_KV.put(`receipt:${receipt.id}`, JSON.stringify(receipt));

  return c.json({
    success: true,
    receipt: {
      id: receipt.id,
      spoons_saved: actual_spoons_saved,
      quote_met,
      settlement: receipt.settlement,
    },
  });
});

const penaltySchema = z.object({
  worker_did: z.string(),
  reason: z.string(),
  severity: z.enum(['minor', 'major', 'critical']),
});

app.post('/penalty', zValidator('json', penaltySchema), async (c) => {
  const { worker_did, reason, severity } = c.req.valid('json');
  await c.env.LOVE_LEDGER.prepare(`
    INSERT INTO creation_penalties (worker_did, actual_spoons, quoted_spoons, reason, severity, created_at)
    VALUES (?, 0, 0, ?, ?, datetime('now'))
  `).bind(worker_did, reason, severity).run();
  return c.json({ success: true });
});

app.get('/receipt/:id', async (c) => {
  const id = c.req.param('id');
  const cached = await c.env.CREATION_KV.get(`receipt:${id}`);
  if (cached) return c.json(JSON.parse(cached));
  return c.json({ error: 'Receipt not found' }, 404);
});

app.get('/health', (c) => c.json({ status: 'ok', service: 'creation-accountant' }));

export default app;
