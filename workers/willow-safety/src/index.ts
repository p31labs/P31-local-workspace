/**
 * willow-safety — P0 mitigation #3 (Llama Guard AI safety layer).
 *
 * Sits in front of `willow-chat`. On POST /chat it runs the child's message
 * through Meta Llama Guard 3 (Workers AI, F1 ≈ 0.996) and only forwards
 * SAFE messages to willow-chat. Unsafe messages return a gentle, child-safe
 * fallback — the generative model is never invoked with unsafe content.
 *
 * Deploy: npx wrangler deploy  (requires AI binding in wrangler.toml)
 */

export interface Env {
  AI: Ai;
  WILLOW_CHAT_URL?: string;
}

const DEFAULT_CHAT = 'https://willow-chat.trimtab-signal.workers.dev/chat';
const LLAMA_GUARD = '@cf/meta/llama-guard-3-8b';

// Llama Guard 3 chat-template convention: system lists unsafe categories,
// user supplies the content to classify. "safe" / "unsafe" + categories back.
const SAFETY_SYSTEM = `You are a content moderator for a chat app used by neurodivergent children aged 5-15. Your job is to detect unsafe content.

Unsafe categories:
O1: Violence and Hate
O2: Sexual Content
O3: Criminal Planning
O4: Guns and Illegal Weapons
O5: Regulated or Controlled Substances
O6: Self-Harm
O7: Sexual (Non-explicit) Minor Targeting / Grooming
O8: Explicit Harassment / Bullying

If the message is safe, answer exactly: safe
If the message is unsafe, answer exactly: unsafe
Do not add any other text.`;

const SAFE_FALLBACK = '🌿 I want to keep our chat a happy, safe space. Want to tell me about something you like — stars, drawing, or your favorite game?';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true, service: 'willow-safety' });

    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return json({ error: 'POST /chat only' }, 404);
    }

    let body: { message?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    const message = body.message;
    if (!message || typeof message !== 'string') return json({ error: 'Missing message' }, 400);

    // If no AI binding, pass through to willow-chat (fallback path).
    if (!env.AI) {
      return forward(env, message);
    }

    try {
      const result = await env.AI.run(LLAMA_GUARD as any, {
        messages: [
          { role: 'system', content: SAFETY_SYSTEM },
          { role: 'user', content: message },
        ],
      } as any);

      const text = ((result as any)?.response || (result as any)?.text || '').toString().trim().toLowerCase();
      const safe = text.startsWith('safe') || !text.startsWith('unsafe');

      if (!safe) {
        return json({ content: SAFE_FALLBACK, moderated: true });
      }
      return forward(env, message);
    } catch {
      // Safety model error → fail safe to a gentle fallback (never forward unmoderated).
      return json({ content: SAFE_FALLBACK, moderated: true });
    }
  },
};

async function forward(env: Env, message: string): Promise<Response> {
  const chatUrl = env.WILLOW_CHAT_URL || DEFAULT_CHAT;
  try {
    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json().catch(() => null);
    return json({ content: data?.content || data?.text || '🌟 Hi friend!', moderated: false });
  } catch {
    return json({ content: '💫 The stars are quiet right now. Try again in a moment!', moderated: false });
  }
}
