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
  // ── Temporal grounding (cont.) ──
  {
    name: 'deadline_guard',
    description: 'Flag clustered or overlapping deadlines within a window.',
    inputSchema: { type: 'object', properties: { deadlines: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, in_days: { type: 'number' } } } } }, required: ['deadlines'] },
  },
  {
    name: 'timebox',
    description: 'Define a focused work block with a hard stop and break.',
    inputSchema: { type: 'object', properties: { task: { type: 'string' }, minutes: { type: 'number' } }, required: ['task'] },
  },
  {
    name: 'rhythm_detect',
    description: 'From a productivity log, suggest your best-focus hours.',
    inputSchema: { type: 'object', properties: { log: { type: 'array', items: { type: 'object', properties: { day: { type: 'string' }, productive_hours: { type: 'array', items: { type: 'number' } } } } } }, required: ['log'] },
  },
  {
    name: 'wait_estimate',
    description: 'Estimate how long until a reply or approval arrives.',
    inputSchema: { type: 'object', properties: { avg_reply_hours: { type: 'number' } }, required: ['avg_reply_hours'] },
  },
  // ── Executive function (cont.) ──
  {
    name: 'next_action',
    description: 'Pick the single best next action from a list.',
    inputSchema: { type: 'object', properties: { tasks: { type: 'array', items: { type: 'string' } } }, required: ['tasks'] },
  },
  {
    name: 'dependency_map',
    description: 'Order items respecting their dependencies.',
    inputSchema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, depends_on: { type: 'array', items: { type: 'string' } } } } } }, required: ['items'] },
  },
  {
    name: 'energy_match',
    description: 'Match a task to your current spoon/energy level.',
    inputSchema: { type: 'object', properties: { tasks: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, energy: { type: 'number' } } } }, spoons: { type: 'number' } }, required: ['tasks'] },
  },
  {
    name: 'habit_stack',
    description: 'Attach a new habit to an existing anchor routine.',
    inputSchema: { type: 'object', properties: { habit: { type: 'string' }, anchor: { type: 'string' } }, required: ['habit', 'anchor'] },
  },
  {
    name: 'stall_diagnose',
    description: 'Name why a task is stuck and suggest a nudge.',
    inputSchema: { type: 'object', properties: { stuck_on: { type: 'string' } }, required: ['stuck_on'] },
  },
  // ── Sensory adaptation (cont.) ──
  {
    name: 'font_tune',
    description: 'Recommend readable font settings for a spoon level.',
    inputSchema: { type: 'object', properties: { spoons: { type: 'number' }, dyslexia: { type: 'boolean' } } },
  },
  {
    name: 'noise_profile',
    description: 'Suggest a focus-sound profile for a task type.',
    inputSchema: { type: 'object', properties: { task_type: { type: 'string', enum: ['deep', 'admin', 'creative', 'rest'] } } },
  },
  {
    name: 'light_advice',
    description: 'Suggest lighting for a time of day and spoon level.',
    inputSchema: { type: 'object', properties: { spoons: { type: 'number' }, time_of_day: { type: 'string', enum: ['morning', 'midday', 'evening', 'night'] } } },
  },
  {
    name: 'density_scale',
    description: 'Recommend UI information density for a spoon level.',
    inputSchema: { type: 'object', properties: { spoons: { type: 'number' } } },
  },
  // ── Cognitive load (cont.) ──
  {
    name: 'simplify',
    description: 'Rewrite dense text into plainer language (heuristic).',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
  {
    name: 'outline',
    description: 'Extract the heading/section structure from text.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
  {
    name: 'glossary',
    description: 'Surface likely jargon terms to define.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
  {
    name: 'progress_track',
    description: 'Report progress percentage with encouragement.',
    inputSchema: { type: 'object', properties: { done: { type: 'number' }, total: { type: 'number' } }, required: ['done', 'total'] },
  },
  {
    name: 'question_reframe',
    description: 'Turn a vague question into a sharper, answerable one.',
    inputSchema: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] },
  },
  // ── Communication ──
  {
    name: 'tone_shift',
    description: 'Suggest tone adjustments for a message.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, target: { type: 'string', enum: ['calm', 'firm', 'warm', 'neutral'] } }, required: ['text'] },
  },
  {
    name: 'draft_reply',
    description: 'Draft a reply template from a received message.',
    inputSchema: { type: 'object', properties: { message: { type: 'string' }, stance: { type: 'string', enum: ['accept', 'decline', 'clarify', 'thank'] } }, required: ['message'] },
  },
  {
    name: 'meeting_notes',
    description: 'Structure a transcript into decisions and actions.',
    inputSchema: { type: 'object', properties: { transcript: { type: 'string' } }, required: ['transcript'] },
  },
  {
    name: 'assertive_reframe',
    description: 'Reframe an over-apologetic sentence to be clear and kind.',
    inputSchema: { type: 'object', properties: { sentence: { type: 'string' } }, required: ['sentence'] },
  },
  {
    name: 'status_update',
    description: 'Compose a concise status update from progress and blockers.',
    inputSchema: { type: 'object', properties: { done: { type: 'array', items: { type: 'string' } }, blockers: { type: 'array', items: { type: 'string' } } }, required: ['done'] },
  },
  // ── Crisis detection (cont.) ──
  {
    name: 'meltdown_plan',
    description: 'Build a pre-emptive de-escalation plan from triggers.',
    inputSchema: { type: 'object', properties: { triggers: { type: 'array', items: { type: 'string' } }, comforts: { type: 'array', items: { type: 'string' } } } },
  },
  {
    name: 'shutdown_routine',
    description: 'Suggest a wind-down routine scaled to spoons.',
    inputSchema: { type: 'object', properties: { spoons: { type: 'number' } } },
  },
  {
    name: 'grounding_54321',
    description: 'Lead the 5-4-3-2-1 grounding exercise.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'support_ping',
    description: 'Draft a message to a supporter when struggling.',
    inputSchema: { type: 'object', properties: { who: { type: 'string' }, why: { type: 'string' } }, required: ['who'] },
  },
  // ── Memory scaffolding (Domain 7) ──
  {
    name: 'spaced_repetition',
    description: 'Schedule spaced-review intervals for a fact by difficulty.',
    inputSchema: { type: 'object', properties: { fact: { type: 'string' }, difficulty: { type: 'number', description: '1 easy – 5 hard' } }, required: ['fact'] },
  },
  {
    name: 'note_retrieve',
    description: 'Find saved notes by keyword overlap (heuristic stub).',
    inputSchema: { type: 'object', properties: { notes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string' } } } }, query: { type: 'string' } }, required: ['notes', 'query'] },
  },
  {
    name: 'memory_remind',
    description: 'Compute a due date for a future reminder.',
    inputSchema: { type: 'object', properties: { label: { type: 'string' }, in_days: { type: 'number' } }, required: ['label'] },
  },
  {
    name: 'recall_prompt',
    description: 'Generate a self-test prompt for a topic.',
    inputSchema: { type: 'object', properties: { topic: { type: 'string' }, facts: { type: 'array', items: { type: 'string' } } }, required: ['topic'] },
  },
  {
    name: 'external_memory',
    description: 'Store a note in an in-process memory stub (not durable).',
    inputSchema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } }, required: ['key', 'value'] },
  },
  {
    name: 'chunk_recall',
    description: 'Split a list into smaller memorization chunks.',
    inputSchema: { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } }, per_chunk: { type: 'number' } }, required: ['items'] },
  },
  {
    name: 'memory_encoding',
    description: 'Suggest a mnemonic / encoding strategy for a fact.',
    inputSchema: { type: 'object', properties: { fact: { type: 'string' }, strategy: { type: 'string', enum: ['acronym', 'imagery', 'story', 'rhyme'] } }, required: ['fact'] },
  },
  {
    name: 'retrieval_practice',
    description: 'Generate a quiz question from a text snippet.',
    inputSchema: { type: 'object', properties: { snippet: { type: 'string' } }, required: ['snippet'] },
  },
  {
    name: 'memory_cue',
    description: 'Suggest a sensory cue to trigger recall of a routine.',
    inputSchema: { type: 'object', properties: { routine: { type: 'string' }, cue_type: { type: 'string', enum: ['sight', 'sound', 'place', 'smell'] } }, required: ['routine'] },
  },
  {
    name: 'forget_track',
    description: 'Flag reminders not reviewed in over 30 days.',
    inputSchema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, last_reviewed: { type: 'string' } } } } }, required: ['items'] },
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

// In-process store for external_memory (stub — not durable across restarts).
const memoryStore = new Map();

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

  deadline_guard({ deadlines = [] }) {
    const sorted = [...deadlines].sort((a, b) => a.in_days - b.in_days);
    const clusters = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].in_days - sorted[i - 1].in_days <= 2) {
        clusters.push({ around_day: sorted[i - 1].in_days, items: [sorted[i - 1].label, sorted[i].label] });
      }
    }
    return { deadlines: sorted, clusters, warning: clusters.length ? 'Cluster detected — protect recovery time.' : 'Spread looks manageable.' };
  },

  timebox({ task, minutes = 25 }) {
    return { task, start: 'now', end_in_min: minutes, break_after: Math.min(10, Math.round(minutes / 5)), note: 'One block; stop at the bell.' };
  },

  rhythm_detect({ log = [] }) {
    const freq = {};
    for (const d of log) for (const h of d.productive_hours || []) freq[h] = (freq[h] || 0) + 1;
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => Number(h));
    return { best_focus_hours: best, note: best.length ? 'Schedule deep work in these windows.' : 'Log more days to find a rhythm.' };
  },

  wait_estimate({ avg_reply_hours = 24 }) {
    const ms = avg_reply_hours * 3600 * 1000;
    return { expected_hours: Math.round(avg_reply_hours), expected_by: new Date(Date.now() + ms).toISOString(), note: 'Estimate only; set a reminder.' };
  },

  next_action({ tasks = [] }) {
    if (!tasks.length) return { next: null };
    const list = tasks.map((t, i) => (typeof t === 'string' ? { name: t, score: tasks.length - i } : { name: t.name, score: t.score ?? tasks.length - i }));
    list.sort((a, b) => b.score - a.score);
    return { next: list[0].name, remaining: list.length - 1 };
  },

  dependency_map({ items = [] }) {
    const done = new Set();
    const order = [];
    const remaining = [...items];
    let guard = 0;
    while (remaining.length && guard++ < 100) {
      const ready = remaining.filter((it) => (it.depends_on || []).every((d) => done.has(d)));
      if (!ready.length) break;
      for (const r of ready) { order.push(r.name); done.add(r.name); }
      for (let i = remaining.length - 1; i >= 0; i--) if (done.has(remaining[i].name)) remaining.splice(i, 1);
    }
    return { order, blocked: remaining.map((r) => r.name), note: remaining.length ? 'Circular or missing deps among: ' + remaining.map((r) => r.name).join(', ') : 'All orderable.' };
  },

  energy_match({ tasks = [], spoons = 3 }) {
    const ranked = [...tasks].sort((a, b) => Math.abs(a.energy - spoons) - Math.abs(b.energy - spoons));
    return { best_match: ranked[0]?.name, note: ranked[0]?.energy <= spoons ? 'This fits your current energy.' : 'All tasks need more energy than you have — rest or shrink scope.' };
  },

  habit_stack({ habit, anchor }) {
    return { stack: `After ${anchor}, I will ${habit}.`, note: 'Anchor to an existing automatic routine.' };
  },

  stall_diagnose({ stuck_on }) {
    const reasons = ['Unclear first step', 'Too big to start', 'Low spoons right now', 'Fear of doing it wrong', 'No clear deadline'];
    const nudge = ['Name the tiniest first action.', 'Split it into a 5-min version.', 'Lower the bar; done beats perfect.', 'Write the worst possible attempt, then improve.', 'Set a 10-min timer and start.'];
    return { stuck_on, likely_reasons: reasons, nudge: nudge[Math.floor(Math.random() * nudge.length)] };
  },

  font_tune({ spoons = 3, dyslexia = false }) {
    const base = dyslexia ? 'Use a dyslexia-friendly font (e.g. OpenDyslexic/Atkinson).' : 'Use a humanist sans (e.g. Inter/Source Sans).';
    const size = spoons <= 1 ? '18–20px, generous line-height.' : spoons <= 3 ? '16–18px.' : '14–16px ok.';
    return { font: base, size, weight: spoons <= 1 ? 'medium (avoid thin)' : 'regular', note: 'Larger + heavier at low spoons.' };
  },

  noise_profile({ task_type = 'deep' }) {
    const map = { deep: 'Brown/white noise or lo-fi', admin: 'Light instrumental', creative: 'Lyric-free ambient', rest: 'Silence or nature sounds' };
    return { profile: map[task_type] || map.deep, note: 'Noise masks distraction; match to task.' };
  },

  light_advice({ spoons = 3, time_of_day = 'midday' }) {
    const map = { morning: 'Cool bright light', midday: 'Natural daylight', evening: 'Warm dim', night: 'Very dim warm, blue-light off' };
    return { light: map[time_of_day] || map.midday, note: spoons <= 1 ? 'Dim further; protect rest.' : 'Standard.' };
  },

  density_scale({ spoons = 3 }) {
    const d = spoons <= 1 ? 'minimal' : spoons <= 3 ? 'moderate' : 'detailed';
    return { density: d, note: 'Less on screen at low spoons (per DESIGN.md).' };
  },

  simplify({ text }) {
    const swap = { utilize: 'use', facilitate: 'help', leverage: 'use', commence: 'start', 'in order to': 'to', 'prior to': 'before', 'subsequent to': 'after' };
    const sentences = splitSentences(text);
    const out = sentences.map((s) => s.replace(/\b(utilize|facilitate|leverage|commence|in order to|prior to|subsequent to)\b/gi, (m) => swap[m.toLowerCase()] || m).replace(/\s{2,}/g, ' ')).join(' ');
    return { simplified: out, note: 'Swapped jargon for plain words; review for tone.' };
  },

  outline({ text }) {
    const lines = (text || '').split(/\n/).map((l) => l.trim()).filter(Boolean);
    const heads = lines.filter((l) => /^(\d+\.|#|\*|-)\s/.test(l) || /^[A-Z][^.!?]{3,40}$/.test(l));
    return { outline: heads.length ? heads : lines.slice(0, 5), note: heads.length ? 'Detected structure.' : 'No explicit headings; showing first lines.' };
  },

  glossary({ text }) {
    const terms = (text || '').match(/\b([A-Z][a-z]{3,})\b/g) || [];
    const uniq = [...new Set(terms)].slice(0, 12);
    return { terms: uniq, note: 'Candidate jargon — confirm which need defining for the reader.' };
  },

  progress_track({ done = 0, total = 1 }) {
    const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    const msg = pct >= 100 ? 'Done — celebrate.' : pct >= 60 ? 'Past the hump, keep going.' : pct >= 30 ? 'Momentum building.' : 'Small start counts.';
    return { percent: pct, message: msg };
  },

  question_reframe({ question }) {
    const q = (question || '').trim();
    const vague = /\b(thing|stuff|everything|something|better|good|fix it)\b/i.test(q);
    const sharper = vague ? q.replace(/\b(thing|stuff|something)\b/gi, 'the specific outcome') + ' — what does success look like?' : q + ' — what is the first concrete step?';
    return { original: q, reframed: sharper, note: vague ? 'Vague words detected; make it concrete.' : 'Already fairly specific.' };
  },

  tone_shift({ text, target = 'neutral' }) {
    const recs = { calm: 'Slow pace, soft words, acknowledge feelings.', firm: 'Direct, short sentences, clear boundary.', warm: 'Friendlier openings, inclusive "we".', neutral: 'Fact-first, drop filler.' };
    return { target, suggestion: recs[target] || recs.neutral, apply_to: text };
  },

  draft_reply({ message, stance = 'thank' }) {
    const tmpl = {
      accept: 'Thanks — yes, that works. I will proceed and confirm by <date>.',
      decline: 'Thank you for the offer. I am not able to take this on right now.',
      clarify: 'Thanks for this. Could you clarify <specific point> so I respond well?',
      thank: 'Thank you — I appreciate it.',
    };
    return { stance, draft: tmpl[stance] || tmpl.thank, note: 'Personalize before sending.' };
  },

  meeting_notes({ transcript }) {
    const lines = (transcript || '').split(/\n/).map((l) => l.trim()).filter(Boolean);
    return {
      decisions: lines.filter((l) => /decid|agreed|we will|action/i.test(l)),
      actions: lines.filter((l) => /todo|assign|follow.?up|by <|owner/i.test(l)),
      note: 'Auto-extracted; verify ownership + dates.',
    };
  },

  assertive_reframe({ sentence }) {
    const cleaned = (sentence || '')
      .replace(/^(i'?m )?sorry( for|about|if)?/i, '')
      .replace(/i (just|was wondering if|feel like)/i, 'I')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return { original: sentence, reframed: cleaned || sentence, note: 'Removed over-apology; kept it clear and kind.' };
  },

  status_update({ done = [], blockers = [] }) {
    const body = (done.length ? 'Done: ' + done.join('; ') + '. ' : '') + (blockers.length ? 'Blocked: ' + blockers.join('; ') + '.' : 'No blockers.');
    return { update: body, length: body.length };
  },

  meltdown_plan({ triggers = [], comforts = [] }) {
    return {
      triggers: triggers.length ? triggers : ['unknown — log next time'],
      plan: ['Notice early signs.', 'Use a comfort: ' + ((comforts && comforts[0]) || 'quiet space'), 'Lower spoons: dim, slow, step back.', 'Re-engage only when steady.'],
    };
  },

  shutdown_routine({ spoons = 3 }) {
    const steps = spoons <= 1
      ? ['Stop screens.', 'Dim lights.', 'Slow breathing 2 min.', 'Rest.']
      : ['Close open tabs.', 'Write tomorrow’s one next action.', 'Set a stop time.', 'Wind down.'];
    return { spoons, steps };
  },

  grounding_54321({}) {
    return {
      steps: [
        '5 things you can SEE',
        '4 things you can TOUCH',
        '3 things you can HEAR',
        '2 things you can SMELL',
        '1 thing you can TASTE',
      ],
      note: 'Slow through each; breathe between.',
    };
  },

  support_ping({ who, why }) {
    const first = (who || '').split(' ')[0] || who;
    return { to: who, draft: `Hey ${first}, I am having a hard moment${why ? ' (' + why + ')' : ''}. Can we talk soon? No fix needed — just company.` };
  },

  spaced_repetition({ fact, difficulty = 3 }) {
    const base = [1, 3, 7, 14, 30];
    const scale = difficulty <= 1 ? 1.6 : difficulty >= 5 ? 0.6 : 1;
    const sched = base.map((d) => Math.max(1, Math.round(d * scale)));
    return { fact, difficulty, schedule_days: sched, note: 'Review on these offsets; reset if you miss.' };
  },

  note_retrieve({ notes = [], query }) {
    const q = (query || '').toLowerCase().split(/\W+/).filter(Boolean);
    const scored = notes.map((n) => {
      const text = (n.text || '').toLowerCase();
      const score = q.reduce((a, t) => a + (text.includes(t) ? 1 : 0), 0);
      return { id: n.id, score };
    }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    return { matches: scored.slice(0, 5), note: 'Heuristic keyword overlap; an LLM would rank by meaning.' };
  },

  memory_remind({ label, in_days = 1 }) {
    const due = new Date(Date.now() + in_days * 86400000).toISOString().slice(0, 10);
    return { label, due, note: 'Set a real reminder; this just computes the date.' };
  },

  recall_prompt({ topic, facts = [] }) {
    return {
      prompt: `Without looking, what do you remember about ${topic}?`,
      test_facts: facts,
      note: 'Say it out loud, then check against test_facts.',
    };
  },

  external_memory({ key, value }) {
    if (!memoryStore.has(key)) memoryStore.set(key, value);
    return { stored: key, note: 'In-process stub — NOT persisted across restarts. Wire to KV/DB for durability.' };
  },

  chunk_recall({ items = [], per_chunk = 5 }) {
    const chunks = [];
    for (let i = 0; i < items.length; i += per_chunk) chunks.push(items.slice(i, i + per_chunk));
    return { chunks, count: chunks.length, note: 'Smaller chunks memorize better.' };
  },

  memory_encoding({ fact, strategy }) {
    const pick = strategy || (fact.length > 40 ? 'story' : 'imagery');
    const map = {
      acronym: 'Take first letters to form a word.',
      imagery: 'Attach a vivid absurd image to the fact.',
      story: 'Weave the fact into a tiny story.',
      rhyme: 'Pair it with a rhyming word.',
    };
    return { fact, strategy: pick, suggestion: map[pick] || map.imagery, note: 'Encode at encode-time for easier recall.' };
  },

  retrieval_practice({ snippet }) {
    const first = splitSentences(snippet || '')[0] || '';
    const topic = first.replace(/^[^a-z]*the /i, '').slice(0, 60);
    return { question: `What was stated about "${topic}..."?`, note: 'Active recall beats re-reading.' };
  },

  memory_cue({ routine, cue_type = 'sight' }) {
    const cues = {
      sight: `Put a visible object by where you do "${routine}".`,
      sound: `Use a specific chime before "${routine}".`,
      place: `Always do "${routine}" in the same spot.`,
      smell: `Keep a scent nearby that means "${routine}".`,
    };
    return { routine, cue_type, cue: cues[cue_type] || cues.sight, note: 'One consistent cue triggers the habit.' };
  },

  forget_track({ items = [] }) {
    const now = Date.now();
    const flagged = items.map((it) => {
      const last = it.last_reviewed ? new Date(it.last_reviewed).getTime() : 0;
      const days = last ? Math.round((now - last) / 86400000) : 999;
      return { label: it.label, days_since: days, stale: days > 30 };
    }).filter((x) => x.stale);
    return { stale: flagged, note: flagged.length ? 'Review these — they are past 30 days.' : 'All fresh.' };
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
