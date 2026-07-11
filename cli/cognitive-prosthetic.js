#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// P31 Cognitive Prosthetic MCP Server
// Neurodivergent cognitive-domain tools (temporal grounding, executive function,
// sensory adaptation, cognitive load, crisis detection). Pure Node built-ins —
// no external dependencies, so it runs/tests offline via `node cli/cognitive-prosthetic.js`.
// Stdio JSON-RPC pattern mirrors cli/mcp-server.js / cli/love-registry.js.
// ═══════════════════════════════════════════════════════════════════════════

const TOOLS = [
  // ── Temporal grounding ──
  {
    name: 'time_estimate',
    description: 'Estimate minutes to complete a task from complexity and current spoon level (0–5).',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'What needs doing' },
        complexity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Effort complexity' },
        spoons: { type: 'number', description: 'Current spoon level 0–5' },
      },
      required: ['task'],
    },
  },
  {
    name: 'schedule_chunk',
    description: 'Break a total time budget into spoon-aware chunks with rest breaks.',
    inputSchema: {
      type: 'object',
      properties: {
        total_minutes: { type: 'number', description: 'Total available minutes' },
        spoons: { type: 'number', description: 'Current spoon level 0–5' },
        label: { type: 'string', description: 'Label for the session' },
      },
      required: ['total_minutes'],
    },
  },
  // ── Executive function ──
  {
    name: 'task_breakdown',
    description: 'Decompose a goal into an ordered list of subtasks.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'The goal to decompose' },
        max_subtasks: { type: 'number', description: 'Cap on subtask count (default 6)' },
      },
      required: ['goal'],
    },
  },
  {
    name: 'prioritize',
    description: 'Rank tasks by urgency, importance, and energy cost for right-now ordering.',
    inputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: 'Tasks to rank',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              urgency: { type: 'number', description: '1–5' },
              importance: { type: 'number', description: '1–5' },
              energy: { type: 'number', description: '1–5 (energy cost)' },
            },
            required: ['name'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'decision_tree',
    description: 'Generate a structured decision aid (branches) for a hard choice.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The decision to structure' },
        options: { type: 'array', items: { type: 'string' }, description: 'Known options (optional)' },
      },
      required: ['question'],
    },
  },
  // ── Sensory adaptation ──
  {
    name: 'motion_reduce',
    description: 'Return CSS + data-spoons guidance to reduce UI motion for a given spoon level.',
    inputSchema: {
      type: 'object',
      properties: { spoons: { type: 'number', description: 'Current spoon level 0–5' } },
    },
  },
  {
    name: 'contrast_scale',
    description: 'Check WCAG contrast between bg/fg and suggest AAA-safe adjustments.',
    inputSchema: {
      type: 'object',
      properties: {
        bg: { type: 'string', description: 'Background hex color' },
        fg: { type: 'string', description: 'Foreground hex color (optional)' },
      },
      required: ['bg'],
    },
  },
  // ── Cognitive load ──
  {
    name: 'summarize',
    description: 'Extractive summary: reduce a long text to the N most salient sentences.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to summarize' },
        points: { type: 'number', description: 'Number of key sentences (default 3)' },
      },
      required: ['text'],
    },
  },
  {
    name: 'chunk_text',
    description: 'Split a long text into cognitively digestible chunks near a word budget.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to chunk' },
        max_words: { type: 'number', description: 'Words per chunk (default 60)' },
      },
      required: ['text'],
    },
  },
  // ── Crisis detection ──
  {
    name: 'crisis_check',
    description: 'Scan a message for rumination, hyperfocus, or distress signals; return guards.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'User message to evaluate' } },
      required: ['message'],
    },
  },
];

// ─── Helpers (pure, no deps) ────────────────────────────────────────────────

function splitSentences(text) {
  if (!text) return [];
  const m = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g);
  return m ? m.map((s) => s.trim()).filter(Boolean) : [];
}

function hexToRgb(hex) {
  if (!hex) return null;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(rgb1, rgb2) {
  const L1 = luminance(rgb1);
  const L2 = luminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Handlers ────────────────────────────────────────────────────────────────

const HANDLERS = {
  time_estimate({ task, complexity = 'medium', spoons = 3 }) {
    const base = 25;
    const cf = { low: 0.5, medium: 1, high: 2.2 }[complexity] ?? 1;
    const sf = 0.5 + Math.max(0, Math.min(5, spoons)) * 0.12;
    const minutes = Math.max(5, Math.round((base * cf) / sf));
    return {
      task,
      estimate_minutes: minutes,
      estimate_human: `~${minutes} min`,
      complexity,
      spoons,
      note: spoons <= 1
        ? 'Low spoons: pad the estimate and protect recovery time.'
        : 'Spoon-aware estimate; revise after the first real attempt.',
    };
  },

  schedule_chunk({ total_minutes, spoons = 3, label = 'session' }) {
    const n = spoons <= 1 ? 6 : spoons <= 3 ? 4 : spoons <= 4 ? 3 : 2;
    const per = total_minutes / n;
    const chunks = Array.from({ length: n }, (_, i) => ({
      label: `${label} ${i + 1}`,
      start_min: Math.round(i * per),
      end_min: Math.round((i + 1) * per),
      duration_min: Math.round(per),
      break_after: i < n - 1,
    }));
    return { total_minutes, chunk_count: n, chunks };
  },

  task_breakdown({ goal, max_subtasks = 6 }) {
    const parts = goal
      .split(/,|;| then | and then | followed by /i)
      .map((s) => s.trim())
      .filter(Boolean);
    let subtasks =
      parts.length > 1
        ? parts
        : ['Clarify the outcome', 'Plan the steps', 'Execute the first action', 'Verify the result', 'Reflect & adjust'];
    subtasks = subtasks.slice(0, max_subtasks);
    return {
      goal,
      subtasks: subtasks.map((title, i) => ({ order: i + 1, title })),
    };
  },

  prioritize({ tasks }) {
    if (!Array.isArray(tasks) || tasks.length === 0) return { ranked: [], note: 'No tasks provided.' };
    const ranked = tasks
      .map((t) => {
        const u = Number(t.urgency) || 1;
        const im = Number(t.importance) || 1;
        const en = Number(t.energy) || 3;
        const score = Math.round(((u * 2 + im * 3) / (en + 1)) * 10) / 10;
        return { name: t.name, score, energy_cost: en };
      })
      .sort((a, b) => b.score - a.score)
      .map((t, i) => ({ rank: i + 1, ...t }));
    return { ranked, note: 'Higher score = do sooner; low-energy tasks surface when spoons are low.' };
  },

  decision_tree({ question, options }) {
    const opts = Array.isArray(options) && options.length ? options : ['Yes', 'No'];
    return {
      root: question,
      branches: opts.map((o) => ({ option: o, next: `If "${o}": … (elaborate or call again)` })),
    };
  },

  motion_reduce({ spoons = 3 }) {
    const s = Math.max(0, Math.min(5, spoons));
    let css;
    let note;
    if (s <= 1) {
      css = '* { transition: none !important; animation: none !important; scroll-behavior: auto !important; }';
      note = 'Crisis/spoon-0: all motion disabled (DESIGN.md Crisis Mode invariant).';
    } else if (s <= 3) {
      css = '* { transition-duration: 150ms !important; animation-duration: 150ms !important; } .no-large-transform { transform: none !important; }';
      note = 'Reduced motion: cap durations, avoid large transforms.';
    } else {
      css = '* { transition-duration: 200ms !important; }';
      note = 'Subtle motion permitted at high spoons.';
    }
    return { spoons: s, data_spoons_attr: `data-spoons="${s}"`, css, note };
  },

  contrast_scale({ bg = '#0b0e14', fg = '#e5e7eb' }) {
    const bgRgb = hexToRgb(bg);
    const fgRgb = hexToRgb(fg);
    if (!bgRgb || !fgRgb) return { error: 'Provide valid hex colors (e.g. #0b0e14).' };
    const ratio = Math.round(contrastRatio(bgRgb, fgRgb) * 100) / 100;
    const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
    const suggestion =
      level === 'AAA'
        ? 'Meets WCAG 2.2 AAA (≥7:1).'
        : level === 'AA'
        ? 'Meets AA (≥4.5:1) but not AAA; lighten fg or darken bg for ≥7:1.'
        : 'Fails AA; increase contrast (lighten fg / darken bg).';
    return { bg, fg, ratio, level, suggestion };
  },

  summarize({ text, points = 3 }) {
    const sentences = splitSentences(text);
    if (sentences.length === 0) return { summary: [], points };
    const words = sentences.join(' ').toLowerCase().match(/\w+/g) || [];
    const freq = {};
    for (const w of words) if (w.length > 3) freq[w] = (freq[w] || 0) + 1;
    const scored = sentences.map((s, i) => {
      const w = (s.toLowerCase().match(/\w+/g) || []).length || 1;
      const kw = (s.toLowerCase().match(/\w+/g) || []).reduce((a, t) => a + (freq[t] || 0), 0);
      const position = i === 0 || i === sentences.length - 1 ? 1.5 : 1;
      return { s, score: (kw / w) * position };
    });
    scored.sort((a, b) => b.score - a.score);
    return { summary: scored.slice(0, points).map((x) => x.s), points };
  },

  chunk_text({ text, max_words = 60 }) {
    const sentences = splitSentences(text);
    const chunks = [];
    let cur = [];
    let count = 0;
    for (const s of sentences) {
      const wc = (s.match(/\w+/g) || []).length;
      if (count + wc > max_words && cur.length) {
        chunks.push(cur.join(' '));
        cur = [];
        count = 0;
      }
      cur.push(s);
      count += wc;
    }
    if (cur.length) chunks.push(cur.join(' '));
    const avg = chunks.length ? Math.round(chunks.reduce((a, c) => a + (c.match(/\w+/g) || []).length, 0) / chunks.length) : 0;
    return { chunks, chunk_count: chunks.length, avg_words: avg };
  },

  crisis_check({ message }) {
    const m = (message || '').toLowerCase();
    const sets = {
      rumination: ['always', 'never', 'what\'s wrong with me', "whats wrong with me", 'cant stop thinking', "can't stop thinking", 'over and over', 'pointless'],
      hyperfocus: ['lost track of time', 'hours passed', 'forgot to eat', 'forgot to drink', 'lost track', 'just one more'],
      distress: ['overwhelmed', "overwhelmed", 'too much', "can't cope", 'cant cope', 'falling apart', 'can\'t do this', "can't do this"],
    };
    const flags = [];
    for (const [cat, terms] of Object.entries(sets)) {
      const hit = terms.filter((t) => m.includes(t));
      if (hit.length) flags.push({ category: cat, matched: hit });
    }
    const severity = flags.length;
    const suggestion =
      severity === 0
        ? 'No acute signals detected.'
        : flags.map((f) => f.category).includes('distress')
        ? 'Distress signals present: lower spoons, use Crisis Mode breathing, reach out to a supporter.'
        : 'Early signals: take a grounding pause; consider a 20-min timer for hyperfocus or a thought-defusion step for rumination.';
    return { flags, severity, suggestion, safe_to_continue: severity === 0 };
  },
};

function executeTool(name, args) {
  const handler = HANDLERS[name];
  if (!handler) return { error: `Unknown tool: ${name}`, status: 'error' };
  return { result: handler(args || {}), status: 'ok' };
}

// ─── JSON-RPC over stdio (line-delimited, mirrors love-registry.js) ──────────

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
        serverInfo: { name: 'p31-cognitive-prosthetic', version: '1.0.0' },
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
