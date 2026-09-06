const MEMORY_KEY = 'p31-cognitive-memory';
const MEMORY_CAP = 200;

interface MemoryEntry {
  id: string;
  text: string;
  created: number;
  updated: number;
  tags: string[];
}

export interface CrisisSignal {
  category: 'rumination' | 'hyperfocus' | 'distress';
  matched: string[];
}

function readStore(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(entries: MemoryEntry[]) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(entries.slice(-MEMORY_CAP)));
  } catch {
    /* storage unavailable */
  }
}

export function remember(text: string, tags: string[] = []): { id: string; text: string; created: number } {
  const entries = readStore();
  const existing = entries.find((e) => e.text.toLowerCase() === text.toLowerCase());
  if (existing) {
    existing.updated = Date.now();
    existing.tags = Array.from(new Set([...existing.tags, ...tags]));
    writeStore(entries);
    return existing;
  }
  const entry: MemoryEntry = {
    id: Math.random().toString(36).slice(2, 10),
    text,
    created: Date.now(),
    updated: Date.now(),
    tags,
  };
  writeStore([...entries, entry]);
  return entry;
}

export function recall(query: string): { matches: MemoryEntry[]; query: string } {
  const q = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (!q.length) return { matches: [], query };
  const scored = readStore()
    .map((e) => {
      const text = e.text.toLowerCase();
      const score = q.reduce((a, t) => a + (text.includes(t) ? 1 : 0), 0);
      return { entry: e, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return { matches: scored.slice(0, 5).map((s) => s.entry), query };
}

export function listMemories(): MemoryEntry[] {
  return readStore().slice(-50).reverse();
}

export function splitSentences(text: string): string[] {
  if (!text) return [];
  const m = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g);
  return m ? m.map((s) => s.trim()).filter(Boolean) : [];
}

export function crisisCheck(message: string): { flags: CrisisSignal[]; severity: number; suggestion: string; safeToContinue: boolean } {
  const m = (message || '').toLowerCase();
  const sets: Record<CrisisSignal['category'], string[]> = {
    rumination: ['always', 'never', "what's wrong with me", 'cant stop thinking', "can't stop thinking", 'over and over', 'pointless'],
    hyperfocus: ['lost track of time', 'hours passed', 'forgot to eat', 'forgot to drink', 'lost track', 'just one more'],
    distress: ['overwhelmed', 'too much', "can't cope", 'cant cope', 'falling apart', "can't do this", 'cant do this'],
  };
  const flags: CrisisSignal[] = [];
  for (const [cat, terms] of Object.entries(sets)) {
    const hit = terms.filter((t) => m.includes(t));
    if (hit.length) flags.push({ category: cat as CrisisSignal['category'], matched: hit });
  }
  const severity = flags.length;
  const suggestion =
    severity === 0
      ? 'No acute signals detected.'
      : flags.some((f) => f.category === 'distress')
      ? 'Distress signals present: lower spoons, use Crisis Mode breathing, reach out to a supporter.'
      : 'Early signals: take a grounding pause; consider a 20-min timer for hyperfocus or a thought-defusion step for rumination.';
  return { flags, severity, suggestion, safeToContinue: severity === 0 };
}

export function taskBreakdown(goal: string, maxSubtasks = 6): { goal: string; subtasks: { order: number; title: string }[] } {
  const parts = goal.split(/,|;| then | and then | followed by /i).map((s) => s.trim()).filter(Boolean);
  let subtasks =
    parts.length > 1
      ? parts
      : ['Clarify the outcome', 'Plan the steps', 'Execute the first action', 'Verify the result', 'Reflect & adjust'];
  subtasks = subtasks.slice(0, maxSubtasks);
  return { goal, subtasks: subtasks.map((title, i) => ({ order: i + 1, title })) };
}

export function timeEstimate(task: string, complexity: 'low' | 'medium' | 'high' = 'medium', spoons = 3) {
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
}

export function scheduleChunk(totalMinutes: number, spoons = 3, label = 'session') {
  const n = spoons <= 1 ? 6 : spoons <= 3 ? 4 : spoons <= 4 ? 3 : 2;
  const per = totalMinutes / n;
  const chunks = Array.from({ length: n }, (_, i) => ({
    label: `${label} ${i + 1}`,
    start_min: Math.round(i * per),
    end_min: Math.round((i + 1) * per),
    duration_min: Math.round(per),
    break_after: i < n - 1,
  }));
  return { total_minutes: totalMinutes, chunk_count: n, chunks };
}

export function simplify(text: string): { simplified: string; note: string } {
  const swap: Record<string, string> = { utilize: 'use', facilitate: 'help', leverage: 'use', commence: 'start', 'in order to': 'to', 'prior to': 'before', 'subsequent to': 'after' };
  const out = splitSentences(text)
    .map((s) =>
      s
        .replace(/\b(utilize|facilitate|leverage|commence|in order to|prior to|subsequent to)\b/gi, (m) => swap[m.toLowerCase()] || m)
        .replace(/\s{2,}/g, ' ')
    )
    .join(' ');
  return { simplified: out, note: 'Swapped jargon for plain words; review for tone.' };
}

export function chunkText(text: string, maxWords = 60): { chunks: string[]; chunk_count: number; avg_words: number } {
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let cur: string[] = [];
  let count = 0;
  for (const s of sentences) {
    const wc = (s.match(/\w+/g) || []).length;
    if (count + wc > maxWords && cur.length) {
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
}

export function grounding54321(): { steps: string[]; note: string } {
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
}

export function meltdownPlan(triggers: string[] = [], comforts: string[] = []): { triggers: string[]; plan: string[] } {
  return {
    triggers: triggers.length ? triggers : ['unknown — log next time'],
    plan: [
      'Notice early signs.',
      'Use a comfort: ' + (comforts[0] || 'quiet space'),
      'Lower spoons: dim, slow, step back.',
      'Re-engage only when steady.',
    ],
  };
}

export function shutdownRoutine(spoons = 3): { spoons: number; steps: string[] } {
  const steps =
    spoons <= 1
      ? ['Stop screens.', 'Dim lights.', 'Slow breathing 2 min.', 'Rest.']
      : ['Close open tabs.', "Write tomorrow's one next action.", 'Set a stop time.', 'Wind down.'];
  return { spoons, steps };
}

export function nextAction(tasks: string[]): { next: string | null; remaining: number } {
  if (!tasks.length) return { next: null, remaining: 0 };
  const list = tasks.map((name, i) => ({ name, score: tasks.length - i }));
  list.sort((a, b) => b.score - a.score);
  return { next: list[0].name, remaining: list.length - 1 };
}

export function memoryRemind(label: string, inDays = 1): { label: string; due: string; note: string } {
  const due = new Date(Date.now() + inDays * 86400000).toISOString().slice(0, 10);
  return { label, due, note: 'Set a real reminder; this just computes the date.' };
}

export function spacedRepetition(fact: string, difficulty = 3): { fact: string; difficulty: number; schedule_days: number[] } {
  const base = [1, 3, 7, 14, 30];
  const scale = difficulty <= 1 ? 1.6 : difficulty >= 5 ? 0.6 : 1;
  const sched = base.map((d) => Math.max(1, Math.round(d * scale)));
  return { fact, difficulty, schedule_days: sched };
}

export function memoryEncoding(fact: string, strategy?: 'acronym' | 'imagery' | 'story' | 'rhyme') {
  const pick = strategy || (fact.length > 40 ? 'story' : 'imagery');
  const map: Record<string, string> = {
    acronym: 'Take first letters to form a word.',
    imagery: 'Attach a vivid absurd image to the fact.',
    story: 'Weave the fact into a tiny story.',
    rhyme: 'Pair it with a rhyming word.',
  };
  return { fact, strategy: pick, suggestion: map[pick] || map.imagery };
}

export function progressTrack(done: number, total: number): { percent: number; message: string } {
  const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  const msg = pct >= 100 ? 'Done — celebrate.' : pct >= 60 ? 'Past the hump, keep going.' : pct >= 30 ? 'Momentum building.' : 'Small start counts.';
  return { percent: pct, message: msg };
}

export function summarize(text: string, points = 3): { summary: string[]; points: number } {
  const sentences = splitSentences(text);
  if (!sentences.length) return { summary: [], points };
  const words = sentences.join(' ').toLowerCase().match(/\w+/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) if (w.length > 3) freq[w] = (freq[w] || 0) + 1;
  const scored = sentences.map((s, i) => {
    const w = (s.toLowerCase().match(/\w+/g) || []).length || 1;
    const kw = (s.toLowerCase().match(/\w+/g) || []).reduce((a, t) => a + (freq[t] || 0), 0);
    const position = i === 0 || i === sentences.length - 1 ? 1.5 : 1;
    return { s, score: (kw / w) * position };
  });
  scored.sort((a, b) => b.score - a.score);
  return { summary: scored.slice(0, points).map((x) => x.s), points };
}

export function prioritize(tasks: { name: string; urgency?: number; importance?: number; energy?: number }[]): { ranked: { rank: number; name: string; score: number; energy_cost: number }[]; note: string } {
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
}

export function decisionTree(question: string, options: string[] = []): { root: string; branches: { option: string; next: string }[] } {
  const opts = Array.isArray(options) && options.length ? options : ['Yes', 'No'];
  return {
    root: question,
    branches: opts.map((o) => ({ option: o, next: `If "${o}": … (elaborate or call again)` })),
  };
}

export function motionReduce(spoons = 3): { spoons: number; data_spoons_attr: string; css: string; note: string } {
  const s = Math.max(0, Math.min(5, spoons));
  let css: string;
  let note: string;
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
}

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function srgbToLinear(c: number): number {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(rgb: [number, number, number]): number {
  return 0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
}

export function contrastScale(bg = '#0b0e14', fg = '#e5e7eb'): { bg: string; fg: string; ratio: number; level: string; suggestion: string } {
  const bgRgb = hexToRgb(bg);
  const fgRgb = hexToRgb(fg);
  if (!bgRgb || !fgRgb) return { bg, fg, ratio: 0, level: 'FAIL', suggestion: 'Provide valid hex colors (e.g. #0b0e14).' };
  const L1 = luminance(bgRgb);
  const L2 = luminance(fgRgb);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  const ratio = Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
  const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
  const suggestion =
    level === 'AAA'
      ? 'Meets WCAG 2.2 AAA (≥7:1).'
      : level === 'AA'
      ? 'Meets AA (≥4.5:1) but not AAA; lighten fg or darken bg for ≥7:1.'
      : 'Fails AA; increase contrast (lighten fg / darken bg).';
  return { bg, fg, ratio, level, suggestion };
}

export function deadlineGuard(deadlines: { label: string; in_days: number }[] = []): { deadlines: { label: string; in_days: number }[]; clusters: { around_day: number; items: string[] }[]; warning: string } {
  const sorted = [...deadlines].sort((a, b) => a.in_days - b.in_days);
  const clusters: { around_day: number; items: string[] }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].in_days - sorted[i - 1].in_days <= 2) {
      clusters.push({ around_day: sorted[i - 1].in_days, items: [sorted[i - 1].label, sorted[i].label] });
    }
  }
  return { deadlines: sorted, clusters, warning: clusters.length ? 'Cluster detected — protect recovery time.' : 'Spread looks manageable.' };
}

export function timebox(task: string, minutes = 25): { task: string; start: string; end_in_min: number; break_after: number; note: string } {
  return { task, start: 'now', end_in_min: minutes, break_after: Math.min(10, Math.round(minutes / 5)), note: 'One block; stop at the bell.' };
}

export function rhythmDetect(log: { productive_hours: number[] }[] = []): { best_focus_hours: number[]; note: string } {
  const freq: Record<number, number> = {};
  for (const d of log) for (const h of d.productive_hours || []) freq[h] = (freq[h] || 0) + 1;
  const best = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => Number(h));
  return { best_focus_hours: best, note: best.length ? 'Schedule deep work in these windows.' : 'Log more days to find a rhythm.' };
}

export function waitEstimate(avgReplyHours = 24): { expected_hours: number; expected_by: string; note: string } {
  const ms = avgReplyHours * 3600 * 1000;
  return { expected_hours: Math.round(avgReplyHours), expected_by: new Date(Date.now() + ms).toISOString(), note: 'Estimate only; set a reminder.' };
}

export function dependencyMap(items: { name: string; depends_on?: string[] }[] = []): { order: string[]; blocked: string[]; note: string } {
  const done = new Set<string>();
  const order: string[] = [];
  const remaining = [...items];
  let guard = 0;
  while (remaining.length && guard++ < 100) {
    const ready = remaining.filter((it) => (it.depends_on || []).every((d) => done.has(d)));
    if (!ready.length) break;
    for (const r of ready) {
      order.push(r.name);
      done.add(r.name);
    }
    for (let i = remaining.length - 1; i >= 0; i--) if (done.has(remaining[i].name)) remaining.splice(i, 1);
  }
  return { order, blocked: remaining.map((r) => r.name), note: remaining.length ? 'Circular or missing deps among: ' + remaining.map((r) => r.name).join(', ') : 'All orderable.' };
}

export function energyMatch(tasks: { name: string; energy: number }[] = [], spoons = 3): { best_match: string | null; note: string } {
  const ranked = [...tasks].sort((a, b) => Math.abs(a.energy - spoons) - Math.abs(b.energy - spoons));
  return { best_match: ranked[0]?.name ?? null, note: ranked[0]?.energy <= spoons ? 'This fits your current energy.' : 'All tasks need more energy than you have — rest or shrink scope.' };
}

export function habitStack(habit: string, anchor: string): { stack: string; note: string } {
  return { stack: `After ${anchor}, I will ${habit}.`, note: 'Anchor to an existing automatic routine.' };
}

export function stallDiagnose(stuckOn: string): { stuck_on: string; likely_reasons: string[]; nudge: string } {
  const reasons = ['Unclear first step', 'Too big to start', 'Low spoons right now', 'Fear of doing it wrong', 'No clear deadline'];
  const nudges = ['Name the tiniest first action.', 'Split it into a 5-min version.', 'Lower the bar; done beats perfect.', 'Write the worst possible attempt, then improve.', 'Set a 10-min timer and start.'];
  return { stuck_on: stuckOn, likely_reasons: reasons, nudge: nudges[Math.floor(Math.random() * nudges.length)] };
}

export function fontTune(spoons = 3, dyslexia = false): { font: string; size: string; weight: string; note: string } {
  const base = dyslexia ? 'Use a dyslexia-friendly font (e.g. OpenDyslexic/Atkinson).' : 'Use a humanist sans (e.g. Inter/Source Sans).';
  const size = spoons <= 1 ? '18–20px, generous line-height.' : spoons <= 3 ? '16–18px.' : '14–16px ok.';
  return { font: base, size, weight: spoons <= 1 ? 'medium (avoid thin)' : 'regular', note: 'Larger + heavier at low spoons.' };
}

export function noiseProfile(taskType = 'deep'): { profile: string; note: string } {
  const map: Record<string, string> = { deep: 'Brown/white noise or lo-fi', admin: 'Light instrumental', creative: 'Lyric-free ambient', rest: 'Silence or nature sounds' };
  return { profile: map[taskType] || map.deep, note: 'Noise masks distraction; match to task.' };
}

export function lightAdvice(spoons = 3, timeOfDay = 'midday'): { light: string; note: string } {
  const map: Record<string, string> = { morning: 'Cool bright light', midday: 'Natural daylight', evening: 'Warm dim', night: 'Very dim warm, blue-light off' };
  return { light: map[timeOfDay] || map.midday, note: spoons <= 1 ? 'Dim further; protect rest.' : 'Standard.' };
}

export function densityScale(spoons = 3): { density: string; note: string } {
  const d = spoons <= 1 ? 'minimal' : spoons <= 3 ? 'moderate' : 'detailed';
  return { density: d, note: 'Less on screen at low spoons (per DESIGN.md).' };
}

export function outline(text: string): { outline: string[]; note: string } {
  const lines = (text || '').split(/\n/).map((l) => l.trim()).filter(Boolean);
  const heads = lines.filter((l) => /^(\d+\.|#|\*|-)\s/.test(l) || /^[A-Z][^.!?]{3,40}$/.test(l));
  return { outline: heads.length ? heads : lines.slice(0, 5), note: heads.length ? 'Detected structure.' : 'No explicit headings; showing first lines.' };
}

export function glossary(text: string): { terms: string[]; note: string } {
  const terms = (text || '').match(/\b([A-Z][a-z]{3,})\b/g) || [];
  const uniq = [...new Set(terms)].slice(0, 12);
  return { terms: uniq, note: 'Candidate jargon — confirm which need defining for the reader.' };
}

export function questionReframe(question: string): { original: string; reframed: string; note: string } {
  const q = (question || '').trim();
  const vague = /\b(thing|stuff|everything|something|better|good|fix it)\b/i.test(q);
  const sharper = vague ? q.replace(/\b(thing|stuff|something)\b/gi, 'the specific outcome') + ' — what does success look like?' : q + ' — what is the first concrete step?';
  return { original: q, reframed: sharper, note: vague ? 'Vague words detected; make it concrete.' : 'Already fairly specific.' };
}

export function toneShift(text: string, target = 'neutral'): { target: string; suggestion: string; apply_to: string } {
  const recs: Record<string, string> = { calm: 'Slow pace, soft words, acknowledge feelings.', firm: 'Direct, short sentences, clear boundary.', warm: 'Friendlier openings, inclusive "we".', neutral: 'Fact-first, drop filler.' };
  return { target, suggestion: recs[target] || recs.neutral, apply_to: text };
}

export function draftReply(message: string, stance = 'thank'): { stance: string; draft: string; note: string } {
  const tmpl: Record<string, string> = {
    accept: 'Thanks — yes, that works. I will proceed and confirm by <date>.',
    decline: 'Thank you for the offer. I am not able to take this on right now.',
    clarify: 'Thanks for this. Could you clarify <specific point> so I respond well?',
    thank: 'Thank you — I appreciate it.',
  };
  return { stance, draft: tmpl[stance] || tmpl.thank, note: 'Personalize before sending.' };
}

export function meetingNotes(transcript: string): { decisions: string[]; actions: string[]; note: string } {
  const lines = (transcript || '').split(/\n/).map((l) => l.trim()).filter(Boolean);
  return {
    decisions: lines.filter((l) => /decid|agreed|we will|action/i.test(l)),
    actions: lines.filter((l) => /todo|assign|follow.?up|by <|owner/i.test(l)),
    note: 'Auto-extracted; verify ownership + dates.',
  };
}

export function assertiveReframe(sentence: string): { original: string; reframed: string; note: string } {
  const cleaned = (sentence || '')
    .replace(/^(i'?m )?sorry( for|about|if)?/i, '')
    .replace(/i (just|was wondering if|feel like)/i, 'I')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { original: sentence, reframed: cleaned || sentence, note: 'Removed over-apology; kept it clear and kind.' };
}

export function statusUpdate(done: string[] = [], blockers: string[] = []): { update: string; length: number } {
  const body = (done.length ? 'Done: ' + done.join('; ') + '. ' : '') + (blockers.length ? 'Blocked: ' + blockers.join('; ') + '.' : 'No blockers.');
  return { update: body, length: body.length };
}

export function supportPing(who: string, why?: string): { to: string; draft: string } {
  const first = (who || '').split(' ')[0] || who;
  return { to: who, draft: `Hey ${first}, I am having a hard moment${why ? ' (' + why + ')' : ''}. Can we talk soon? No fix needed — just company.` };
}

export function recallPrompt(topic: string, facts: string[] = []): { prompt: string; test_facts: string[]; note: string } {
  return {
    prompt: `Without looking, what do you remember about ${topic}?`,
    test_facts: facts,
    note: 'Say it out loud, then check against test_facts.',
  };
}

export function chunkRecall(items: string[] = [], perChunk = 5): { chunks: string[][]; count: number; note: string } {
  const chunks: string[][] = [];
  for (let i = 0; i < items.length; i += perChunk) chunks.push(items.slice(i, i + perChunk));
  return { chunks, count: chunks.length, note: 'Smaller chunks memorize better.' };
}

export function retrievalPractice(snippet: string): { question: string; note: string } {
  const first = splitSentences(snippet || '')[0] || '';
  const topic = first.replace(/^[^a-z]*the /i, '').slice(0, 60);
  return { question: `What was stated about "${topic}..."?`, note: 'Active recall beats re-reading.' };
}

export function memoryCue(routine: string, cueType: 'sight' | 'sound' | 'place' | 'smell' = 'sight'): { routine: string; cue_type: string; cue: string; note: string } {
  const cues: Record<string, string> = {
    sight: `Put a visible object by where you do "${routine}".`,
    sound: `Use a specific chime before "${routine}".`,
    place: `Always do "${routine}" in the same spot.`,
    smell: `Keep a scent nearby that means "${routine}".`,
  };
  return { routine, cue_type: cueType, cue: cues[cueType] || cues.sight, note: 'One consistent cue triggers the habit.' };
}

export function forgetTrack(items: { label: string; last_reviewed?: string }[] = []): { stale: { label: string; days_since: number; stale: boolean }[]; note: string } {
  const now = Date.now();
  const flagged = items.map((it) => {
    const last = it.last_reviewed ? new Date(it.last_reviewed).getTime() : 0;
    const days = last ? Math.round((now - last) / 86400000) : 999;
    return { label: it.label, days_since: days, stale: days > 30 };
  }).filter((x) => x.stale);
  return { stale: flagged, note: flagged.length ? 'Review these — they are past 30 days.' : 'All fresh.' };
}
