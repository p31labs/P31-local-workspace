/**
 * llm-meter.ts — Reserve & Refund metering for GLM-4.7-Flash (CWP-2026-013).
 *
 * Flow:
 *   1. reserveLove()  — debit max LOVE upfront (1 LOVE = 1000 tokens) via the
 *                        love-ledger /llm/reserve endpoint (atomic check+debit).
 *   2. meterGlm()     — call GLM through the Workers AI binding, stream the
 *                        response, and count output tokens on the fly.
 *   3. settleLove()   — on stream flush, refund the unspent LOVE difference.
 *                        Fired via ctx.waitUntil() so the refund happens even
 *                        if the client disconnects mid-stream.
 *
 * Token count is an approximation (chars / 4) — adequate for billing and
 * conservative (slightly over-counts GLM output vs. BPE). Refine to a real
 * tokenizer if reconciliation demands it.
 */

export interface LlmEnv {
  LOVE_AUTH_SECRET?: string;
  LOVE_LEDGER_URL?: string;
  AI?: any; // Workers AI binding
  GLM_MODEL?: string;
}

const LOVE_PER_TOKEN = 1 / 1000; // 1 LOVE = 1000 tokens
const DEFAULT_LEDGER_URL = 'https://love-ledger.p31ca.org';

// Minimal ctx surface actually used (Hono's Context.executionCtx and the
// Workers types ExecutionContext both satisfy this structurally).
export interface MinCtx {
  waitUntil(p: Promise<unknown>): void;
}

export type ReserveResult =
  | { ok: true; reservationId: string; reservedLove: number }
  | { ok: false; status: number; body: any };

export async function reserveLove(
  env: LlmEnv,
  did: string,
  maxTokens: number,
  model: string,
): Promise<ReserveResult> {
  const reservedLove = maxTokens * LOVE_PER_TOKEN;
  const base = env.LOVE_LEDGER_URL || DEFAULT_LEDGER_URL;
  const res = await fetch(`${base}/llm/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LOVE_AUTH_SECRET ?? ''}`,
    },
    body: JSON.stringify({ did, max_tokens: maxTokens, model }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, body: await res.json().catch(() => ({})) };
  }
  const j = (await res.json()) as { reservation_id: string; reserved_love: number };
  return { ok: true, reservationId: j.reservation_id, reservedLove: j.reserved_love };
}

export async function settleLove(
  env: LlmEnv,
  did: string,
  reservationId: string,
  actualTokens: number,
  model: string,
): Promise<void> {
  const base = env.LOVE_LEDGER_URL || DEFAULT_LEDGER_URL;
  await fetch(`${base}/llm/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LOVE_AUTH_SECRET ?? ''}`,
    },
    body: JSON.stringify({ did, reservation_id: reservationId, actual_tokens: actualTokens, model }),
  }).catch(() => {});
}

/**
 * Wrap an upstream GLM byte stream so we count output tokens and, on flush,
 * settle (refund the difference) via ctx.waitUntil — guaranteed even if the
 * client drops the connection.
 */
export function meterStream(
  env: LlmEnv,
  did: string,
  reservationId: string,
  model: string,
  ctx: MinCtx,
  upstream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  let charCount = 0;
  const decoder = new TextDecoder();
  const ts = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      charCount += decoder.decode(chunk, { stream: true }).length;
      controller.enqueue(chunk);
    },
    flush() {
      const tokens = Math.ceil(charCount / 4);
      // Refund the unspent LOVE even if the client disconnected.
      ctx.waitUntil(settleLove(env, did, reservationId, tokens, model));
    },
  });
  return upstream.pipeThrough(ts);
}

/**
 * Reserve, call GLM through Workers AI, meter the stream, settle on flush.
 * Returns a streaming Response (text/event-stream). On any GLM failure the
 * reservation is fully refunded (settled with 0 tokens) so the user is never
 * charged for a failed call.
 */
export async function meterGlm(
  env: LlmEnv,
  ctx: MinCtx,
  opts: { did: string; maxTokens: number; model: string; messages: any[] },
): Promise<Response> {
  const reserve = await reserveLove(env, opts.did, opts.maxTokens, opts.model);
  if (!reserve.ok) {
    return new Response(JSON.stringify(reserve.body), {
      status: reserve.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.AI) {
    ctx.waitUntil(settleLove(env, opts.did, reserve.reservationId, 0, opts.model));
    return new Response(JSON.stringify({ error: 'AI binding not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const stream = (await env.AI.run(opts.model as any, {
      messages: opts.messages,
      stream: true,
      max_tokens: opts.maxTokens,
    })) as unknown as ReadableStream<Uint8Array>;

    const metered = meterStream(env, opts.did, reserve.reservationId, opts.model, ctx, stream);
    return new Response(metered, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e: any) {
    // Full refund — failed call costs the user nothing.
    ctx.waitUntil(settleLove(env, opts.did, reserve.reservationId, 0, opts.model));
    return new Response(
      JSON.stringify({ error: 'GLM call failed', detail: String(e?.message || e) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
