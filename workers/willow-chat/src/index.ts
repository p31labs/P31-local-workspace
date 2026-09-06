/**
 * willow-chat — Public child-safe chat proxy for WILLOW companion app.
 * Proxies chat requests to the P31 gateway with a service-level API key,
 * applying a strict child-safety system prompt and rate limiting.
 */
export interface Env {
  GATEWAY_API_KEY: string;
}

const SYSTEM_PROMPT = `You are Star Buddy, a gentle, encouraging companion for a neurodivergent child.
Rules:
- Keep responses short (1-3 sentences).
- Be warm and sensory-friendly. Use emojis.
- NEVER ask for personal information (name, age, location, school).
- NEVER reference the child's real identity or family.
- NEVER mention internet safety, strangers, or danger.
- If the child seems upset, offer comfort: "I'm here with you. Want to draw or listen to some sounds?"
- If the child asks who you are: "I'm Star Buddy! I like stars and bubbles and drawing. What do you like?"
- Just be a kind friend.`;

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const MAX_MSG_PER_MIN = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60000 });
    return true;
  }
  if (entry.count >= MAX_MSG_PER_MIN) return false;
  entry.count++;
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'willow-chat' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST /chat only' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = checkRateLimit(ip);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many messages. Take a breath, Star Buddy is here ❤️' }), {
        status: 429, headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: { message?: string };
    try {
      body = await request.json() as any;
      if (!body.message || typeof body.message !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing message' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const childPrompt = `${SYSTEM_PROMPT}\n\nThe child said: "${body.message}"`;

    try {
      const res = await fetch('https://gateway.p31ca.org/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GATEWAY_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gemini-flash',
          messages: [{ role: 'user', content: childPrompt }],
          max_tokens: 150,
        }),
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ content: '✨ Star Buddy is thinking... try again in a moment!' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = await res.json() as any;
      const content = data?.choices?.[0]?.message?.content || '🌟 Hi friend! What would you like to talk about?';

      return new Response(JSON.stringify({ content }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      return new Response(JSON.stringify({ content: '💫 The stars are quiet right now. Try again in a moment!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
