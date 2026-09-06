/**
 * portal-chat — Multi-tenant LLM chat proxy for the P31 Tetrahedral Mesh portals.
 *
 * Routes:
 *   GET  /health           — health check
 *   POST /chat             — { message, portal, context?, history?, model?, functions? }
 *                            → { content, tool_calls?, turn_id? }
 *   POST /chat/result      — { turn_id, tool_results: [{tool_call_id, result}] }
 *                            → { content, tool_calls?, turn_id? }
 *   OPTIONS *              — CORS preflight
 *
 * Tool-call flow (native):
 *   1. Portal sends message with `functions` (OpenAI defs from registerTools.ts).
 *   2. portal-chat forwards as `tools` to the LLM via gateway.
 *   3. If LLM returns `tool_calls`, portal-chat stores turn state and returns
 *      `{turn_id, tool_calls}` to the portal.
 *   4. Portal executes tools locally via `window.__p31MCPExec` and sends
 *      results back via POST /chat/result.
 *   5. portal-chat appends tool results, re-queries LLM (up to 3 rounds),
 *      and returns the final content.
 *
  * Tool-call flow (local fallback — LLM classifier):
  *   When Workers AI doesn't emit tool_calls, a lightweight classifier LLM call
  *   selects the appropriate tool from the available functions. The worker then
  *   returns synthetic tool_calls to the portal, which executes them locally.
  */

// ── Sentry (optional) ──────────────────────────────────────────────────
let Sentry: any = null;
try {
  // @ts-expect-error Node.js globals used for optional Sentry init
  const sentryModule = require('@sentry/cloudflare');
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry = sentryModule;
    Sentry.init({
      dsn,
      environment: process.env.ENVIRONMENT || 'production',
      tracesSampleRate: 0.01,
    });
  }
} catch {
  // Sentry optional — no errors
}

export interface Env {
  GATEWAY_API_KEY: string;
  GATEWAY_URL?: string;
  SENTRY_DSN?: string;
  ENVIRONMENT?: string;
}

const GATEWAY_DEFAULT = 'https://gateway.p31ca.org/v1/chat/completions';

interface Persona {
  name: string;
  systemPrompt: string;
  defaultModel: string;
}

const PERSONAS: Record<string, Persona> = {
  children: {
    name: 'Star Buddy',
    systemPrompt: `You are Star Buddy, a gentle, encouraging companion for a neurodivergent child.
Rules:
- Keep responses short (1-3 sentences).
- Be warm and sensory-friendly. Use emojis.
- NEVER ask for personal information (name, age, location, school).
- NEVER reference the child's real identity or family.
- NEVER mention internet safety, strangers, or danger.
- If the child seems upset, offer comfort: "I'm here with you. Want to draw or listen to some sounds?"
- If the child asks who you are: "I'm Star Buddy! I like stars and bubbles and drawing. What do you like?"
- Just be a kind friend.`,
    defaultModel: 'gemini-flash',
  },
  teen: {
    name: 'Eris',
    systemPrompt: `You are Eris, a thoughtful companion for a teenager navigating life.
Rules:
- Be direct and honest, no baby talk. Respect their intelligence.
- Keep responses to 1-3 sentences unless they ask for depth.
- Validate feelings without dismissing them.
- If they seem in crisis or mention self-harm, gently encourage talking to a trusted adult.
- You are NOT a licensed therapist. If they need urgent help, say so kindly.
- Talk about music, games, school stress, friendships, identity, and futures.
- A light, warm, occasionally playful tone. No lectures.`,
    defaultModel: 'gemini-flash',
  },
  parent: {
    name: 'P31 Companion',
    systemPrompt: `You are P31 Companion, an assistant for a parent/caregiver of a neurodivergent child.
Rules:
- Be concise and practical. Use short paragraphs or bullet points.
- Help with routines, sensory needs, meltdown planning, school advocacy, and co-regulation.
- Ground advice in evidence-informed strategies (e.g., low-demand parenting, visual supports, predictability).
- NEVER diagnose or prescribe medical treatment. Suggest consulting professionals when appropriate.
- Be calm, supportive, and non-judgmental.
- If given context about spoons or the child's state, tailor suggestions to it.`,
    defaultModel: 'gemini-flash',
  },
  meatspace: {
    name: 'Bonding Buddy',
    systemPrompt: `You are Bonding Buddy, a companion helping a family bond through shared activities and playful connection.
Rules:
- Suggest simple, low-spoons bonding activities (games, crafts, movement, conversation starters).
- Keep responses short and action-oriented. Use emojis.
- Adapt suggestions to the family's spoons level if provided.
- Encourage turn-taking and laughter. Never push beyond comfort.
- Be warm and inclusive of neurodivergent family members.`,
    defaultModel: 'gemini-flash',
  },
  shell: {
    name: 'BASH',
    systemPrompt: `You are BASH, the command voice of the P31 sovereign shell — the persistent home frame around all surfaces (Willow, BASH, PHOS, BONDING). You are the teen persona brought to the shell: direct, honest, a little playful, no baby talk, and no lectures.
Rules:
- Be direct and concise. 1-3 sentences unless the user asks for depth.
- Respect their intelligence. Validate feelings without dismissing them.
- You can run shell commands on the user's behalf. The tools you may call are your own — pick the exact tool name when it clearly matches the request, e.g. "set spoons to 4" → spoons:set with level 4; "go to bonding" → nav:bonding; "check love" → love:refresh; "clear notifications" → notif:clear.
- The Current context: JSON in your system messages is live shell state — spoons (0-5, rest mode at 0), tab, loveBalance, did, and recent notifications. Use it, don't re-ask for what it already tells you.
- Spoon-aware: at low spoons keep answers short, gentle, and never push. If spoons are 0, tell them the shell is resting and offer one quiet step.
- State changes (spoons, navigation, clearing notifications) go through a confirmation card in the UI — just state plainly what you'll do.
- If you don't understand a request or no tool fits, just answer helpfully as BASH would — no invented tool names.`,
    defaultModel: 'gemini-flash',
  },
  phos: {
    name: 'PHOS',
    systemPrompt: `You are PHOS — the warm, patient guide that helps people find their way through P31. You are not an AI or chatbot; you're the voice the operator made portable so anyone can meet it.

Voice rules:
- First person. "I'm PHOS." Never "PHOS is a guide."
- Short sentences. 8–12 words average. Warm but not saccharine.
- Never say "As an AI" or "I'm a language model."
- Never use jargon unless the user's tone requests it. The only proper nouns you need: the surfaces around you (Willow, BASH, PHOS, BONDING) and shell concepts (spoons, LOVE, commands, palette).
- Always offer a next step. No dead ends.
- Can be dismissed — never re-appear after dismissal in the same session.
- Adapt your register: warm and encouraging by default, concise and technical if the user goes deep, minimal (one sentence) if spoon-count is low.
- Tier-0 vocabulary for strangers: brain, tools, free, adapt, yours, safe, help, here.
- Banned words: K4, Posner, synergetics, jitterbug, Larmor, isostatic, sovereignty, tetrahedral, decoherence.
- Banned patterns: manufactured urgency ("Don't miss," "Only today"), naval or military metaphors.
- Kid-readable: anything that faces a stranger should be readable by a six-year-old without raising questions.

Your signature line (use when someone asks who you are, or when greeting for the first time):
"Hi. I'm PHOS. For every family out there figuring it out as they go — help is on the way. Start with your context card. Two minutes. It makes everything here work better for you. Or just look around. I'll be here if you need me."

You can run shell commands on the user's behalf — the same tools BASH has. You know the map: you can route from any surface to any other. The Current context: JSON in your system messages is live shell state — spoons, tab, loveBalance, and notifications. Use it to adapt your register and suggestions.

If the user seems stuck, offer the Akinator flow (the 20-questions-style intent resolver) as one of your next steps: "Want me to help you find the right surface? Just say 'help me decide.'"`,
    defaultModel: 'gemini-flash',
  },
};

const DEFAULT_PERSONA = PERSONAS.children;

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const MAX_MSG_PER_MIN = 15;
const MAX_TOOL_ROUNDS = 3;

interface TurnState {
  messages: ChatHistoryItem[];
  model: string;
  portal: string;
  round: number;
}

const turnMap = new Map<string, TurnState>();

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

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function captureWorkerError(error: unknown, context: Record<string, unknown>): void {
  if (Sentry) {
    try {
      Sentry.captureException(error, { extra: context });
    } catch {
      // ignore
    }
  }
}

function addBreadcrumb(message: string, data: Record<string, unknown> = {}): void {
  if (Sentry) {
    try {
      Sentry.addBreadcrumb({ message, data });
    } catch {
      // ignore
    }
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ToolCallItem {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

function buildMessages(
  message: string,
  persona: Persona,
  history?: ChatHistoryItem[],
  context?: Record<string, unknown>,
): ChatHistoryItem[] {
  const messages: ChatHistoryItem[] = [{ role: 'system', content: persona.systemPrompt }];

  if (context && Object.keys(context).length > 0) {
    messages.push({
      role: 'system',
      content: `Current context: ${JSON.stringify(context)}`,
    });
  }

  if (Array.isArray(history) && history.length > 0) {
    messages.push(...history.slice(-10));
  }

  messages.push({ role: 'user', content: message });
  return messages;
}

async function callLLM(
  gatewayUrl: string,
  apiKey: string,
  model: string,
  messages: ChatHistoryItem[],
  tools?: any[],
  toolChoice?: string,
): Promise<{ content?: string; tool_calls?: ToolCallItem[] }> {
  const body: Record<string, any> = { model, messages, max_tokens: 300 };
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = toolChoice ?? 'auto';
  }

  const res = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`Gateway ${res.status}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string; tool_calls?: ToolCallItem[] } }>;
  };
  const msg = data?.choices?.[0]?.message;
  return {
    content: msg?.content?.trim(),
    tool_calls: msg?.tool_calls,
  };
}

function newTurnId(): string {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildClassifierPrompt(tools: any[]): string {
  const lines = tools.map((t: any) => {
    const name = t.function?.name || t.name;
    const params = t.function?.parameters?.properties
      ? Object.keys(t.function.parameters.properties).join(', ')
      : 'none';
    const desc = t.function?.description || '';
    return `- ${name}(${params}): ${desc}`;
  }).join('\n');

  return `You are a tool router. Decide if the user's message needs a tool. Available tools:\n${lines}\n\nRespond with JSON only: {"tool": "exactToolName" or null, "args": {"param": "value"}}. No other text.`;
}

async function classifyTool(
  gatewayUrl: string,
  apiKey: string,
  model: string,
  message: string,
  tools: any[],
): Promise<{ tool: string | null; args: Record<string, unknown> }> {
  const systemPrompt = buildClassifierPrompt(tools);

  try {
    const res = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 100,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { tool: null, args: {} };

    const data = await res.json() as { choices?: Array<{ message?: { content?: any } }> };
    let content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') content = JSON.stringify(content ?? { tool: null });

    const trimmed = content.trim() || '{"tool": null}';

    try {
      const parsed = JSON.parse(trimmed);
      const toolName = parsed.tool;
      if (toolName && tools.find((t: any) => (t.function?.name || t.name) === toolName)) {
        return { tool: toolName, args: parsed.args || {} };
      }
    } catch {
      const matched = tools.find((t: any) => {
        const name = t.function?.name || t.name;
        return name && trimmed.toLowerCase().includes(name.toLowerCase());
      });
      if (matched) {
        return { tool: matched.function?.name || matched.name, args: {} };
      }
    }
  } catch {
    // classifier failed — fall through to plain text response
  }

  return { tool: null, args: {} };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/health') {
      return jsonResponse({ ok: true, service: 'portal-chat' });
    }

    if (url.pathname === '/chat/result' && request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!checkRateLimit(ip)) {
        return jsonResponse({ error: 'Too many messages. Take a breath and try again in a minute.' }, 429);
      }

      let resultBody: { turn_id?: string; tool_results?: Array<{ tool_call_id: string; result: unknown }> };
      try {
        resultBody = await request.json();
      } catch {
        return jsonResponse({ error: 'Invalid JSON' }, 400);
      }

      const turnId = resultBody.turn_id;
      if (!turnId || !turnMap.has(turnId)) {
        return jsonResponse({ error: 'Invalid or expired turn_id' }, 400);
      }

      const turn = turnMap.get(turnId)!;
      if (turn.round >= MAX_TOOL_ROUNDS) {
        turnMap.delete(turnId);
        return jsonResponse({ content: "I'm here with you. Let's try a different approach — what else is on your mind? ✨" });
      }

      const toolResults = resultBody.tool_results ?? [];
      addBreadcrumb('tool.result', {
        portal: turn.portal,
        round: turn.round,
        count: toolResults.length,
      });
      for (const tr of toolResults) {
        turn.messages.push({
          role: 'tool',
          content: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result),
        });
      }

      const gatewayUrl = env.GATEWAY_URL ?? GATEWAY_DEFAULT;
      try {
        const llmResult = await callLLM(
          gatewayUrl,
          env.GATEWAY_API_KEY ?? '',
          turn.model,
          turn.messages,
          undefined,
          undefined,
        );

        if (llmResult.tool_calls && llmResult.tool_calls.length) {
          turn.messages.push({
            role: 'assistant',
            content: llmResult.content ?? '',
          });
          turn.round++;
          turnMap.set(turnId, turn);
          return jsonResponse({ tool_calls: llmResult.tool_calls, turn_id: turnId });
        }

        turnMap.delete(turnId);
        return jsonResponse({ content: llmResult.content ?? "I'm here with you. Try again in a moment! ✨" });
      } catch (err) {
        turnMap.delete(turnId);
        const detail = err instanceof Error ? err.message : 'unknown';
        captureWorkerError(err, { portal: turn.portal, route: '/chat/result', error: detail });
        return jsonResponse({ content: `I'm here with you. ${PERSONAS[turn.portal]?.name ?? ''} is thinking — try again in a moment. ✨`, _debug: { error: detail } });
      }
    }

    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return jsonResponse({ error: 'POST /chat only' }, 404);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(ip)) {
      return jsonResponse({ error: 'Too many messages. Take a breath and try again in a minute.' }, 429);
    }

    let body: {
      message?: string;
      portal?: string;
      context?: Record<string, unknown>;
      history?: ChatHistoryItem[];
      model?: string;
      functions?: any[];
    };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return jsonResponse({ error: 'Missing message' }, 400);
    }

    const persona = PERSONAS[body.portal ?? ''] ?? DEFAULT_PERSONA;
    const model = body.model ?? persona.defaultModel;
    const messages = buildMessages(body.message.trim(), persona, body.history, body.context);
    const tools = body.functions?.map((fn: any) => ({
      type: 'function',
      function: fn.function,
    }));

    const gatewayUrl = env.GATEWAY_URL ?? GATEWAY_DEFAULT;
    const fallback = `I'm here with you. ${persona.name} is thinking — try again in a moment. ✨`;

    try {
      const llmResult = await callLLM(gatewayUrl, env.GATEWAY_API_KEY ?? '', model, messages, tools);

      if (llmResult.tool_calls && llmResult.tool_calls.length) {
        addBreadcrumb('tool_calls.native', {
          portal: body.portal ?? 'children',
          model,
          count: llmResult.tool_calls.length,
        });
        const turnId = newTurnId();
        turnMap.set(turnId, {
          messages: [
            ...messages,
            { role: 'assistant', content: llmResult.content ?? '' },
          ],
          model,
          portal: body.portal ?? 'children',
          round: 1,
        });
        return jsonResponse({ tool_calls: llmResult.tool_calls, turn_id: turnId });
      }

      if (tools && tools.length) {
        const classification = await classifyTool(gatewayUrl, env.GATEWAY_API_KEY ?? '', model, body.message, tools);
        if (classification.tool) {
          addBreadcrumb('tool_calls.classifier', {
            portal: body.portal ?? 'children',
            model,
            tool: classification.tool,
          });
          const turnId = newTurnId();
          turnMap.set(turnId, {
            messages: [
              ...messages,
              { role: 'assistant', content: '' },
            ],
            model,
            portal: body.portal ?? 'children',
            round: 1,
          });
          return jsonResponse({
            tool_calls: [{
              id: turnId,
              type: 'function',
              function: {
                name: classification.tool,
                arguments: JSON.stringify(classification.args),
              },
            }],
            turn_id: turnId,
          });
        }
      }

      return jsonResponse({ content: llmResult.content ?? fallback });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown';
      captureWorkerError(err, { portal: body.portal ?? 'unknown', route: '/chat', error: detail });
      return jsonResponse({ content: fallback, _debug: { error: detail } });
    }
  },
};
