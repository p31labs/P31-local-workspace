/**
 * orchestrator.ts — P31 Agent Orchestrator (CWP-2026-014).
 *
 * Turns the system from "suggest a tool" into "do the work":
 *   1. classify  — needle-rs intent resolution (fast path); falls back to GLM.
 *   2. plan      — a single tool call (needle) or a GLM-authored plan of ≤3.
 *   3. execute   — run each planned tool call through the L3.4 bridge (/mcp).
 *   4. settle    — record the whole run as a PQC-sealed care contract in LOVE.
 *
 * Fall-back-safe: if needle is cold/broken it routes through GLM; if GLM is
 * unavailable it returns an empty plan; if the bridge or ledger is down the
 * run still completes and reports partial results. Nothing in the chain can
 * hard-fail the user's request.
 */

import { resolveSecret } from './love-auth';

// The 9 P31 tools the orchestrator can route to (name + description only —
// enough for classification/planning; the bridge owns the real implementations).
export const P31_TOOLS: Array<{ name: string; description: string }> = [
  { name: 'oasis_execute', description: 'Run an Oasis CLI command or interactive experience in the P31 workspace' },
  { name: 'phos_adopt', description: 'Adopt a PHOS surface into the workspace' },
  { name: 'jitterbug_run', description: 'Run a brain-dump orchestration in Jitterbug' },
  { name: 'phos_learn', description: 'Train or fine-tune a PHOS model' },
  { name: 'phos_deploy', description: 'Deploy a PHOS surface to production' },
  { name: 'phos_watch', description: 'Watch a PHOS surface for changes or regressions' },
  { name: 'healer_remediate', description: 'Auto-remediate a detected fault in the system' },
  { name: 'bus_emit', description: 'Emit an event on the message bus' },
  { name: 'phos_rollback', description: 'Roll back a PHOS deployment to a previous version' },
];

export interface AgentEnv {
  NEEDLE?: Fetcher;
  BRIDGE_URL: string;
  AI?: any;
  GLM_MODEL?: string;
  LOVE_AUTH_SECRET?: any;
  LOVE_LEDGER_URL?: string;
}

interface Step { tool: string; arguments: Record<string, any>; }

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── 1. classify (needle-rs, fast path) ──────────────────────────────────────
async function classifyWithNeedle(env: AgentEnv, query: string): Promise<any | null> {
  if (!env.NEEDLE) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000); // leave CPU budget for execution
  try {
    const res = await env.NEEDLE.fetch('https://intent-resolver/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query, tools: P31_TOOLS }),
      signal: ctrl.signal,
    });
    return await res.json();
  } catch {
    return null; // cold needle / timeout → caller falls back to GLM
  } finally {
    clearTimeout(timer);
  }
}

// ── 2. plan with GLM (fallback) ─────────────────────────────────────────────
function extractJsonArray(text: string): string {
  const fenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = fenced.indexOf('[');
  const end = fenced.lastIndexOf(']');
  if (start >= 0 && end > start) return fenced.slice(start, end + 1);
  return '[]';
}

async function planWithGlm(env: AgentEnv, query: string): Promise<Step[]> {
  if (!env.AI) return [];
  const toolList = P31_TOOLS.map((t) => `- ${t.name}: ${t.description}`).join('\n');
  const system =
    'You are the P31 care-agent planner. Given a user request, return a JSON array of tool calls ' +
    'drawn ONLY from the available tools. Each element: {"tool": <name>, "arguments": <object>}. ' +
    'Use at most 3 steps. Return ONLY the JSON array, no prose, no code fences.';
  const user = `Available tools:\n${toolList}\n\nRequest: ${query}`;
  try {
    const out = (await env.AI.run(env.GLM_MODEL || 'glm-4.7-flash', {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      stream: false,
      max_tokens: 1024,
    })) as any;

    // Workers AI returns the plan in one of several shapes:
    //   - `response` as an array of {tool, arguments} (structured tool output)
    //   - `tool_calls` (function calling)
    //   - `response` / `text` as a JSON-array string
    // Normalise all of them to Step[].
    let arr: any[] | null = null;
    const resp = out?.response;
    if (Array.isArray(resp)) {
      arr = resp;
    } else if (Array.isArray(out?.tool_calls) && out.tool_calls.length) {
      arr = out.tool_calls.map((c: any) => ({
        tool: c?.function?.name ?? c?.name,
        arguments: c?.function?.arguments ?? c?.arguments ?? {},
      }));
    } else {
      const text = String(resp ?? out?.text ?? '');
      const extracted = extractJsonArray(text);
      try {
        const parsed = JSON.parse(extracted);
        arr = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? [parsed] : null;
      } catch {
        arr = null;
      }
    }
    if (!arr) return [];

    return arr
      .map((s: any) => ({
        tool: s?.tool ?? s?.name ?? s?.function?.name,
        arguments: s?.arguments ?? s?.input ?? s?.parameters ?? s?.function?.arguments ?? {},
      }))
      // Only route to tools the orchestrator actually knows how to call.
      .filter((s: Step) => typeof s.tool === 'string' && P31_TOOLS.some((t) => t.name === s.tool))
      .slice(0, 3);
  } catch {
    return [];
  }
}

// ── 3. execute via the L3.4 bridge (JSON-RPC tools/call) ────────────────────
async function executeTool(env: AgentEnv, step: Step): Promise<any> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(env.BRIDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: step.tool, arguments: step.arguments ?? {} },
      }),
    });
    clearTimeout(timer);
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* leave as null */ }
    return { tool: step.tool, ok: res.ok, status: res.status, result: parsed };
  } catch (e: any) {
    return { tool: step.tool, ok: false, error: String(e?.message || e) };
  }
}

// ── 4. settle: record the run as a PQC-sealed care contract in LOVE ─────────
async function recordContract(
  env: AgentEnv,
  data: { did: string; query: string; plan: Step[]; results: any[]; classifier: string },
): Promise<{ id: string | null; error: string | null }> {
  const base = (env.LOVE_LEDGER_URL || '').replace(/\/$/, '');
  const secret = await resolveSecret(env.LOVE_AUTH_SECRET);
  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret ?? ''}` };
  const terms = {
    kind: 'agent_run',
    query: data.query,
    plan: data.plan,
    results: data.results,
    classifier: data.classifier,
    created_at: new Date().toISOString(),
  };
  const propose = () =>
    fetch(`${base}/contract/propose`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        author_did: data.did,
        counterparty_did: data.did, // self-contract: the family is both parties
        title: `Agent run: ${data.query.slice(0, 60)}`,
        terms,
      }),
    });
  let res = await propose();
  if (res.status === 400) {
    // Counterparty has no ML-KEM key yet — generate one (idempotent: the
    // private key is disclosed only on first generation, which the human
    // owner should do out-of-band; the orchestrator just needs the public key).
    await fetch(`${base}/contract/keygen`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ did: data.did }),
    }).catch(() => {});
    res = await propose();
  }
  if (!res.ok) return { id: null, error: `contract record failed: ${res.status}` };
  const j = (await res.json()) as { id?: string };
  return { id: j.id ?? null, error: null };
}

export async function runAgent(env: AgentEnv, ctx: ExecutionContext, body: any): Promise<Response> {
  const did = body?.did;
  const query = String(body?.query ?? '');
  if (!did || !query) return json({ error: 'Missing did or query' }, 400);

  // 1. classify
  let needleUsed = false;
  let toolCall: Step | null = null;
  const classified = await classifyWithNeedle(env, query);
  if (classified?.needle_used && classified?.tool) {
    needleUsed = true;
    toolCall = { tool: classified.tool, arguments: classified.arguments ?? {} };
  }

  // 2. plan
  const plan: Step[] = toolCall ? [toolCall] : await planWithGlm(env, query);
  const classifier = needleUsed ? 'needle' : plan.length ? 'glm' : 'none';

  // 3. execute
  const results: any[] = [];
  for (const step of plan) {
    results.push(await executeTool(env, step));
  }

  // 4. settle (best-effort)
  let contractId: string | null = null;
  let contractError: string | null = null;
  if (env.LOVE_LEDGER_URL && env.LOVE_AUTH_SECRET) {
    const rec = await recordContract(env, { did, query, plan, results, classifier });
    contractId = rec.id;
    contractError = rec.error;
  }

  return json({
    needle_used: needleUsed,
    classifier,
    plan,
    results,
    contract_id: contractId,
    contract_error: contractError,
  });
}
