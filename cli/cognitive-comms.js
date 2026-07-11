#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// P31 Cognitive Comms MCP Server
// Neurodivergent-friendly communication + collaboration tools.
// Pure Node built-ins — no external dependencies, runs/tests offline.
// Stdio JSON-RPC pattern mirrors cli/cognitive-prosthetic.js.
// ═══════════════════════════════════════════════════════════════════════════

const TOOLS = [
  {
    name: 'email_subject',
    description: 'Craft a clear, scannable email subject line.',
    inputSchema: { type: 'object', properties: { topic: { type: 'string' }, action: { type: 'string', description: 'What you need' } }, required: ['topic'] },
  },
  {
    name: 'say_no',
    description: 'Template to decline a request kindly and without over-apology.',
    inputSchema: { type: 'object', properties: { what: { type: 'string' }, alt: { type: 'string', description: 'Optional alternative you can offer' } }, required: ['what'] },
  },
  {
    name: 'set_boundary',
    description: 'Assert a personal or work boundary clearly.',
    inputSchema: { type: 'object', properties: { need: { type: 'string' } }, required: ['need'] },
  },
  {
    name: 'request_accommodation',
    description: 'Ask for a neurodivergent-friendly accommodation.',
    inputSchema: { type: 'object', properties: { accommodation: { type: 'string' }, context: { type: 'string' } }, required: ['accommodation'] },
  },
  {
    name: 'follow_up',
    description: 'Nudge a stalled thread without guilt.',
    inputSchema: { type: 'object', properties: { on_what: { type: 'string' }, since: { type: 'string' } }, required: ['on_what'] },
  },
  {
    name: 'ask_clarify',
    description: 'Ask a precise clarifying question.',
    inputSchema: { type: 'object', properties: { about: { type: 'string' }, missing: { type: 'string' } }, required: ['about'] },
  },
  {
    name: 'summarize_thread',
    description: 'Condense a message thread to the open points.',
    inputSchema: { type: 'object', properties: { thread: { type: 'string' } }, required: ['thread'] },
  },
  {
    name: 'async_reference',
    description: 'Suggest moving a conversation to async.',
    inputSchema: { type: 'object', properties: { topic: { type: 'string' }, why: { type: 'string' } }, required: ['topic'] },
  },
  {
    name: 'decline_meeting',
    description: 'Decline a meeting invite while staying warm.',
    inputSchema: { type: 'object', properties: { meeting: { type: 'string' }, reason: { type: 'string' } }, required: ['meeting'] },
  },
  {
    name: 'negotiate_deadline',
    description: 'Propose a realistic deadline with rationale.',
    inputSchema: { type: 'object', properties: { task: { type: 'string' }, realistic_by: { type: 'string' } }, required: ['task', 'realistic_by'] },
  },
  {
    name: 'express_capacity',
    description: 'State your current capacity (spoons 1–5) to a collaborator.',
    inputSchema: { type: 'object', properties: { capacity: { type: 'number', description: '1–5' }, today: { type: 'string' } }, required: ['capacity'] },
  },
  {
    name: 'thank_you_note',
    description: 'Write a brief gratitude note.',
    inputSchema: { type: 'object', properties: { to: { type: 'string' }, for_what: { type: 'string' } }, required: ['to', 'for_what'] },
  },
  {
    name: 'intro_message',
    description: 'Draft an intro to a new contact.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, context: { type: 'string' } }, required: ['name'] },
  },
  {
    name: 'feedback_delivery',
    description: 'Deliver kind, specific feedback (observation + impact).',
    inputSchema: { type: 'object', properties: { to: { type: 'string' }, observation: { type: 'string' }, impact: { type: 'string' } }, required: ['to', 'observation', 'impact'] },
  },
  {
    name: 'conflict_phrase',
    description: 'Offer de-escalating phrasing for a tense situation.',
    inputSchema: { type: 'object', properties: { situation: { type: 'string' } }, required: ['situation'] },
  },
  {
    name: 'status_brief',
    description: 'Compose a one-line status for a channel.',
    inputSchema: { type: 'object', properties: { done: { type: 'array', items: { type: 'string' } }, blocker: { type: 'string' } }, required: ['done'] },
  },
  {
    name: 'meeting_agenda',
    description: 'Build a tight agenda from a goal.',
    inputSchema: { type: 'object', properties: { goal: { type: 'string' }, slots: { type: 'number', description: 'Number of agenda items' } }, required: ['goal'] },
  },
  {
    name: 'read_receipt_reply',
    description: 'Reply to a message that was read but unanswered.',
    inputSchema: { type: 'object', properties: { original: { type: 'string' } }, required: ['original'] },
  },
  {
    name: 'escalation_guard',
    description: 'Flag whether to escalate now or wait.',
    inputSchema: { type: 'object', properties: { issue: { type: 'string' }, waited: { type: 'string', description: 'How long you have waited' } }, required: ['issue'] },
  },
  {
    name: 'co_work_invite',
    description: 'Invite collaboration on a piece of work.',
    inputSchema: { type: 'object', properties: { who: { type: 'string' }, on_what: { type: 'string' } }, required: ['who', 'on_what'] },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function splitSentences(text) {
  if (!text) return [];
  const m = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g);
  return m ? m.map((s) => s.trim()).filter(Boolean) : [];
}

// ─── Handlers ──────────────────────────────────────────────────────────────

const HANDLERS = {
  email_subject({ topic, action }) {
    const a = action ? ` — ${action}` : '';
    return { subject: `${topic}${a}`.slice(0, 80), note: 'Front-load the verb; under 80 chars.' };
  },

  say_no({ what, alt }) {
    const body = `Thanks for thinking of me. I am not able to take on ${what} right now.`;
    return { draft: alt ? `${body} I could ${alt} instead — want me to?` : `${body} I hope it goes well.`, note: 'No over-apology; a crisp "not now".' };
  },

  set_boundary({ need }) {
    return { draft: `I need ${need}. That helps me do my best work — thanks for respecting it.`, note: 'State the need, not the excuse.' };
  },

  request_accommodation({ accommodation, context }) {
    return { draft: `For ${context || 'our work together'}, I do better with ${accommodation}. Is that workable?`, note: 'Name the function, not the diagnosis.' };
  },

  follow_up({ on_what, since }) {
    const when = since ? ` (last touch: ${since})` : '';
    return { draft: `Hi — gentle nudge on ${on_what}${when}. No rush, just want to keep it moving.`, note: 'Assume good intent; no guilt.' };
  },

  ask_clarify({ about, missing }) {
    return { draft: `On ${about}, could you clarify ${missing || 'the specific outcome you want'}? That helps me respond well.`, note: 'One precise ask.' };
  },

  summarize_thread({ thread }) {
    const lines = (thread || '').split(/\n/).map((l) => l.trim()).filter(Boolean);
    const open = lines.filter((l) => /(\?$|todo|action|by |need|waiting|follow)/i.test(l));
    return { open_points: open.length ? open : lines.slice(-3), count: open.length, note: 'Filtered to questions + actions.' };
  },

  async_reference({ topic, why }) {
    return { draft: `Could we handle ${topic} async${why ? ' (' + why + ')' : ''}? A doc/thread lets me reply when focused.`, note: 'Protect real-time energy.' };
  },

  decline_meeting({ meeting, reason }) {
    return { draft: `Thanks for the invite to ${meeting}. I will sit this one out${reason ? ' — ' + reason : ''}. Catch me on the notes?`, note: 'Warm, no over-explain.' };
  },

  negotiate_deadline({ task, realistic_by }) {
    return { draft: `On ${task}, a realistic delivery is ${realistic_by}. I would rather commit to that than rush. Does that work?`, note: 'Offer a date you can keep.' };
  },

  express_capacity({ capacity = 3, today }) {
    const word = capacity <= 1 ? 'very low' : capacity <= 3 ? 'moderate' : 'good';
    return { draft: `Heads up: my capacity today is ${word} (${capacity}/5)${today ? ' — ' + today : ''}. I will do what I can.`, note: 'Sets expectations early.' };
  },

  thank_you_note({ to, for_what }) {
    const first = (to || '').split(' ')[0] || to;
    return { draft: `Hey ${first} — thank you for ${for_what}. It meant a lot.`, note: 'Specific + brief.' };
  },

  intro_message({ name, context }) {
    return { draft: `Hi ${name} — ${context || 'we were pointed at each other'}. Looking forward to connecting.`, note: 'One line of context.' };
  },

  feedback_delivery({ to, observation, impact }) {
    return { draft: `${to}, I noticed ${observation}. The effect: ${impact}. Naming it so we can build on it.`, note: 'Observation → impact, no blame.' };
  },

  conflict_phrase({ situation }) {
    return {
      draft: `I hear the tension around ${situation}. Can we both state what we need, then find the overlap?`,
      note: 'Acknowledge, then redirect to needs.',
    };
  },

  status_brief({ done = [], blocker }) {
    const b = blocker ? ` Blocker: ${blocker}.` : ' On track.';
    return { brief: `Done: ${done.join('; ') || 'steady progress'}.${b}`, length: 0 };
  },

  meeting_agenda({ goal, slots = 4 }) {
    const items = [
      'Quick check-in (2 min)',
      `Goal: ${goal}`,
      'Decisions needed',
      'Owners + next step',
      'Parking lot',
    ].slice(0, slots);
    return { agenda: items, note: 'One owner per item.' };
  },

  read_receipt_reply({ original }) {
    return { draft: `Hi — following up on my last note${original ? ' about "' + original.slice(0, 40) + '…"' : ''}. Happy to clarify or hop on a call.`, note: 'Light, non-accusatory.' };
  },

  escalation_guard({ issue, waited }) {
    const long = /(day|week|fortnight|month)/i.test(waited || '');
    return {
      escalate: long,
      draft: long ? `This has waited ${waited}. I would like to escalate or set a hard deadline.` : `Give ${waited || 'a bit'} more, then nudge once.`,
      note: long ? 'Long wait = reasonable to escalate.' : 'Short wait = one nudge, then wait.',
    };
  },

  co_work_invite({ who, on_what }) {
    return { draft: `${who} — want to co-work ${on_what}? Bodies or async both fine; just nicer together.`, note: 'Low-pressure invite.' };
  },
};

function executeTool(name, args) {
  const handler = HANDLERS[name];
  if (!handler) return { error: `Unknown tool: ${name}`, status: 'error' };
  return { result: handler(args || {}), status: 'ok' };
}

// ─── JSON-RPC over stdio (line-delimited) ──────────────────────────────

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      handleRequest(JSON.parse(trimmed));
    } catch (_) {
      /* ignore non-JSON lines */
    }
  }
});

function handleRequest(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'p31-cognitive-comms', version: '1.0.0' },
      });
      break;
    case 'notifications/initialized':
      break;
    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find((t) => t.name === toolName);
      if (!tool) {
        respondError(id, -32602, `Unknown tool: ${toolName}`);
        break;
      }
      try {
        const out = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
          isError: true,
        });
      }
      break;
    }
    case 'ping':
      respond(id, {});
      break;
    default:
      if (id !== undefined) respondError(id, -32601, `Method not found: ${method}`);
  }
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}
