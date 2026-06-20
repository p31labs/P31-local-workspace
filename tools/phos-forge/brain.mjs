#!/usr/bin/env node

import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync, readdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { callLLM } from './jitterbug.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAIN_DIR = '/tmp/phos-brain';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const COG_PATH = '/tmp/phos-cognitive-state.json';
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const TIDE_PATH = '/tmp/phos-tide-state.json';
const FAMILY_PATH = join(__dirname, 'family-tree.json');

const FRAGMENT_MIN_LENGTH = 15;

function busEmit(type, payload) {
  const event = { type, payload, timestamp: new Date().toISOString(), id: crypto.randomUUID() };
  try { appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n'); } catch {}
}

function readSpoonLevel() {
  try {
    if (existsSync(SPOON_PATH)) {
      const d = JSON.parse(readFileSync(SPOON_PATH, 'utf-8'));
      if (typeof d.level === 'number') return d.level;
    }
  } catch {}
  return 4;
}

function shortId() { return crypto.randomUUID().slice(0, 8); }
function today() { return new Date().toISOString().slice(0, 10); }

function parseThoughts(text) {
  const lines = text.split('\n')
    .flatMap(l => l.split(/(?<=[.?!])\s+/))
    .map(l => l.replace(/^[\s\-*\d.]+/, '').trim())
    .filter(l => l.length >= FRAGMENT_MIN_LENGTH);
  return lines.map((raw, i) => ({ index: i, raw }));
}

async function elaborateThoughts(thoughts, opts = {}) {
  const elaborated = [];
  for (let i = 0; i < thoughts.length; i++) {
    const t = thoughts[i];
    busEmit('brain.elaborating', { session: opts.session, index: i, total: thoughts.length });
    const prompt = `Elaborate this thought fragment in 2-3 sentences. Add context and connections. Keep it concise but insightful.\n\nFragment: "${t.raw}"`;
    try {
      const expanded = await callLLM(
        'You are a thought elaboration engine. Expand fragments with context and connections.',
        prompt,
        { maxTokens: 400, temperature: 0.7 }
      );
      elaborated.push({ ...t, expanded: expanded.trim() });
    } catch {
      elaborated.push({ ...t, expanded: t.raw });
    }
  }
  return elaborated;
}

async function organizeThemes(elaborated, opts = {}) {
  if (elaborated.length <= 3) {
    return [{ name: 'Core Themes', description: 'Primary thoughts from the session', thoughts: elaborated.map(e => e.index) }];
  }
  const nThemes = elaborated.length <= 6 ? 2 : Math.min(4, Math.ceil(elaborated.length / 3));
  const indices = elaborated.map(e => e.index);
  const chunkSize = Math.ceil(indices.length / nThemes);
  const themes = [];
  for (let i = 0; i < nThemes; i++) {
    const chunk = indices.slice(i * chunkSize, (i + 1) * chunkSize);
    const frags = chunk.map(idx => {
      const e = elaborated.find(el => el.index === idx);
      return e ? e.expanded.slice(0, 120) : '';
    });
    const desc = frags.join('; ').slice(0, 160);
    themes.push({ name: `Theme ${i + 1}`, description: desc, thoughts: chunk, frags });
  }
  busEmit('brain.organizing', { session: opts.session });
  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
    const text = theme.frags.join('\n').slice(0, 600);
    const prompt = `Read these related thoughts and give them a short descriptive title (3-6 words). Return ONLY the title, nothing else.\n\nThoughts:\n${text}`;
    try {
      const name = await callLLM('You are a title generator. Output only the title.', prompt, { maxTokens: 30, temperature: 0.3 });
      const cleaned = name.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      if (cleaned.length > 3 && cleaned.length < 80) theme.name = cleaned;
    } catch {}
    const descText = theme.frags.join('\n').slice(0, 500);
    const descPrompt = `Write one sentence describing what this theme is about. Be specific and concrete.\n\nTheme: ${theme.name}\n\nRelated thoughts:\n${descText}`;
    try {
      const desc = await callLLM('Write one specific sentence describing this theme.', descPrompt, { maxTokens: 60, temperature: 0.3 });
      const cleanedDesc = desc.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      if (cleanedDesc.length > 10 && cleanedDesc.length < 300) theme.description = cleanedDesc;
    } catch {}
  }
  return themes;
}

async function researchThemes(themes, elaborated, opts = {}) {
  const research = [];
  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
    busEmit('brain.researching', { session: opts.session, theme: theme.name, index: i, total: themes.length });
    const thoughtTexts = theme.thoughts.map(idx => {
      const e = elaborated.find(el => el.index === idx);
      return e ? e.expanded : '';
    }).filter(Boolean).join('\n');
    let prompt = `Research the following theme based on these related thoughts. Output 3-5 short bullet points, each starting with one of these headings: Insight, Connection, Implication, Takeaway.\n\nTheme: ${theme.name}\nDescription: ${theme.description}\n\nRelated thoughts:\n${thoughtTexts}`;
    if (opts.family && opts.family.cycles?.length > 0) {
      const cycles = opts.family.cycles.map(c => `- ${c.name}: ${c.description}`).join('\n');
      prompt += `\n\nFamily lineage context:\n${cycles}\n\nConsider how this theme may connect to the user's lineage — broken inheritance, chosen families, the Spoonemore name, or the act of preserving memory.`;
    }
    try {
      const result = await callLLM(
        'You are a focused research agent. Analyze the theme. Output 3-5 short bullet points, each starting with one of these headings: Insight, Connection, Implication, Takeaway.',
        prompt,
        { maxTokens: 500, temperature: 0.5 }
      );
      research.push({ theme: theme.name, output: result.trim(), error: null });
    } catch (err) {
      research.push({ theme: theme.name, output: null, error: err.message });
    }
  }
  return research;
}

async function extractBacklog(themes, research, opts = {}) {
  const allBacklog = [];
  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
    const r = research.find(r => r.theme === theme.name);
    const text = `${theme.name}: ${theme.description}\n\n${r?.output || ''}`.slice(0, 800);
    const prompt = `Based on this analysis, list 2-3 specific tasks for a developer building cognitive tools. Each task must be executable in the PHOS codebase. Start each with an imperative verb: Implement, Fix, Test, Review, Document, Refactor, Add. Return only the tasks, one per line, no numbering.\n\n${text}`;
    try {
      const result = await callLLM('Extract 2-3 specific tasks for a developer building cognitive tools. Each task must be executable in the PHOS codebase. Start with an imperative verb.', prompt, { maxTokens: 200, temperature: 0.4 });
      const tasks = result.split('\n').map(l => l.replace(/^[\s\-*\d.]+/, '').trim()).filter(l => l.length > 5);
      allBacklog.push({ theme: theme.name, tasks });
    } catch {}
  }
  return allBacklog;
}

async function synthesizeSection(themes, research, meta, opts = {}) {
  const themeSummary = themes.map((t, i) => `Theme ${i + 1}: ${t.name}\n${t.description.slice(0, 200)}`).join('\n\n');
  const researchSummary = research.filter(r => r.output).map(r => `${r.theme}: ${r.output.slice(0, 300)}`).join('\n\n');
  const text = `Themes:\n${themeSummary}\n\nResearch:\n${researchSummary}`.slice(0, 1500);
  let prompt = `Write a 3-paragraph synthesis: (1) the common thread that unites the themes, (2) the tension or contradiction between them, (3) what this means for the user's current work or mindset.\n\n${text}`;
  if (opts.family && opts.family.cycles?.length > 0) {
    const cycles = opts.family.cycles.map(c => `- ${c.name}: ${c.description}`).join('\n');
    prompt += `\n\nFamily lineage context:\n${cycles}\n\nConsider how the themes connect to the user's lineage and the PHOS system they are building to preserve knowledge across broken inheritance chains.`;
  }
  try {
    return await callLLM('You are a synthesis architect. Write a 3-paragraph synthesis: (1) the common thread that unites the themes, (2) the tension or contradiction between them, (3) what this means for the user\'s current work or mindset.', prompt, { maxTokens: 500, temperature: 0.5 });
  } catch {
    return null;
  }
}

function synthesizeAll(thoughts, elaborated, themes, research, meta, cartographerLinks, backlog, synthesisText, familyContext) {
  let md = `# Quantum Brain Dump — ${meta.today}\n\n`;
  md += `## Session Overview\n`;
  md += `- Duration: ${meta.duration}\n`;
  md += `- Spoons: ${meta.spoon}/5\n`;
  md += `- Mode: ${meta.mode}\n`;
  md += `- Themes: ${themes.length}\n`;
  if (meta.cogState) {
    const c = meta.cogState;
    md += `- Cognitive state: load ${(c.cognitive_load * 100).toFixed(0)}%, flow ${(c.flow * 100).toFixed(0)}%, stress ${(c.stress * 100).toFixed(0)}%\n`;
  }
  if (meta.tideContext) {
    const t = meta.tideContext;
    const pp = t.patterns || {};
    if (pp.peak_activity_hour !== undefined) md += `- Tide peak: ${pp.peak_activity_hour}:00 | Flow: ${pp.peak_flow_hour || '?'}:00\n`;
  }
  md += '\n';

  md += `## Raw Input\n\n\`\`\`\n${meta.rawText}\n\`\`\`\n\n`;

  for (const theme of themes) {
    md += `## ${theme.name}\n> ${theme.description}\n\n`;
    for (const idx of theme.thoughts) {
      const e = elaborated.find(el => el.index === idx);
      if (!e) continue;
      md += `### Fragment ${idx + 1}\n`;
      md += `**Raw:** ${e.raw}\n\n`;
      md += `${e.expanded}\n\n`;
    }
    const r = research.find(r => r.theme === theme.name);
    if (r) {
      md += `### Research\n\n`;
      if (r.output) {
        md += `${r.output}\n\n`;
      } else if (r.error) {
        md += `*Research unavailable: ${r.error}*\n\n`;
      }
    }
    if (cartographerLinks) {
      const link = cartographerLinks.find(l => l.theme === theme.name);
      if (link && link.files.length > 0) {
        md += `### Related Code\n`;
        for (const f of link.files) {
          md += `- ${(f.score * 100).toFixed(0)}%  ${f.path}\n`;
        }
        md += '\n';
      }
    }
  }

  if (backlog && backlog.length > 0) {
    const allTasks = backlog.flatMap(b => b.tasks);
    if (allTasks.length > 0) {
      md += `## Actionable Backlog\n`;
      for (const b of backlog) {
        if (b.tasks.length > 0) {
          md += `### ${b.theme}\n`;
          for (const t of b.tasks) md += `- [ ] ${t}\n`;
          md += '\n';
        }
      }
    }
  }

  md += `## Synthesis\n`;
  if (synthesisText) {
    md += `${synthesisText.trim()}\n\n`;
  }

  if (familyContext && familyContext.cycles?.length > 0 && meta.mode === 'full') {
    md += `## Family Context\n\n`;
    for (const cycle of familyContext.cycles) {
      md += `### ${cycle.name}\n${cycle.description}\n\n`;
      if (cycle.phos_analog) {
        md += `*PHOS analog: ${cycle.phos_analog}*\n\n`;
      }
    }
  }

  md += `Session \`${meta.sessionId}\` \u2014 ${meta.thoughtCount} thoughts across ${meta.themeCount} themes.\n`;
  if (research.length > 0) md += `Research depth: ${research.filter(r => r.output).length} themes researched.\n`;
  md += '\n';

  return md;
}

function archiveOutput(md, meta) {
  const dir = join(BRAIN_DIR, today());
  mkdirSync(dir, { recursive: true });
  const filename = `${today()}-${meta.sessionId}.md`;
  const path = join(dir, filename);
  writeFileSync(path, md);

  const jsonData = {
    date: today(),
    session: meta.sessionId,
    mode: meta.mode,
    spoon: meta.spoon,
    duration: meta.duration,
    themes: meta.themeCount,
    thoughts: meta.thoughtCount,
    path,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(join(dir, `${today()}-${meta.sessionId}.json`), JSON.stringify(jsonData, null, 2));
  writeFileSync(join(dir, 'latest.json'), JSON.stringify(jsonData, null, 2));

  return { path, filename };
}

export async function processBrainDump(text, opts = {}) {
  const mode = opts.mode || 'quick';
  const factor = opts.factor || 2;
  const depth = opts.depth || 1;
  const spoon = readSpoonLevel();

  if (spoon === 0) {
    return { error: 'Spoon level 0 \u2014 brain dump locked.', mode, spoon };
  }
  if (spoon <= 2 && mode !== 'quick') {
    return { error: `Spoon level ${spoon} \u2014 only quick mode available (elaborate + organize only).`, mode, spoon };
  }

  const sessionId = shortId();
  const started = Date.now();

  let tideContext = null;
  if (mode === 'full') {
    try {
      if (existsSync(TIDE_PATH)) tideContext = JSON.parse(readFileSync(TIDE_PATH, 'utf-8'));
    } catch {}
  }

  let familyContext = null;
  if (opts.family && mode !== 'quick') {
    try {
      if (existsSync(FAMILY_PATH)) {
        const raw = JSON.parse(readFileSync(FAMILY_PATH, 'utf-8'));
        familyContext = {
          cycles: raw.cycles || [],
          ghostNodes: raw.individuals.filter(i => i.role === 'ghost-node'),
          spoonemore: raw.individuals.filter(i => i.tags?.includes('spoonemore')),
        };
      }
    } catch {}
  }

  busEmit('brain.started', { session: sessionId, mode: mode + (opts.family ? '+family' : ''), spoon, textLength: text.length });

  const thoughts = parseThoughts(text);
  if (thoughts.length === 0) {
    return { error: 'No meaningful fragments found in input. Try longer text.', session: sessionId, mode, spoon };
  }

  busEmit('brain.parsed', { session: sessionId, fragments: thoughts.length });

  const elaborated = await elaborateThoughts(thoughts, { session: sessionId });

  const themes = await organizeThemes(elaborated, { session: sessionId });

  let research = [];
  if (mode === 'deep' || mode === 'full') {
    research = await researchThemes(themes, elaborated, { session: sessionId, factor, depth, family: familyContext });
  }

  let cartographerLinks = null;
  if (mode === 'full') {
    try {
      const { query } = await import('./cartographer.mjs');
      cartographerLinks = [];
      for (const theme of themes) {
        const results = query(theme.name, 5);
        cartographerLinks.push({ theme: theme.name, files: results.map(r => ({ path: r.path, score: r.score })) });
      }
    } catch {}
  }

  let backlog = [];
  let synthesisText = null;
  if (mode === 'deep' || mode === 'full') {
    backlog = await extractBacklog(themes, research, { session: sessionId, family: familyContext });
    synthesisText = await synthesizeSection(themes, research, { session: sessionId, family: familyContext });
  }

  const elapsed = Date.now() - started;
  const duration = elapsed < 60000 ? `${(elapsed / 1000).toFixed(0)}s` : `${(elapsed / 60000).toFixed(1)}min`;

  let cogState = null;
  try {
    if (existsSync(COG_PATH)) cogState = JSON.parse(readFileSync(COG_PATH, 'utf-8'));
  } catch {}

  const md = synthesizeAll(thoughts, elaborated, themes, research, {
    rawText: text, sessionId, mode, spoon, duration,
    themeCount: themes.length, thoughtCount: thoughts.length,
    cogState, tideContext, today: today(),
  }, cartographerLinks, backlog, synthesisText, familyContext);

  const { path } = archiveOutput(md, {
    sessionId, mode, spoon, duration,
    themeCount: themes.length, thoughtCount: thoughts.length,
  });

  busEmit('brain.complete', {
    session: sessionId, mode, spoon, duration,
    themes: themes.length, thoughts: thoughts.length, path,
  });

  return {
    output: md, session: sessionId, mode, spoon, duration,
    themes: themes.length, thoughts: thoughts.length, path,
  };
}

export function getSessions(limit = 5) {
  try {
    const dir = join(BRAIN_DIR, today());
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter(f => f.endsWith('.json') && f !== 'latest.json')
      .sort().reverse().slice(0, limit)
      .map(f => {
        try { return JSON.parse(readFileSync(join(dir, f), 'utf-8')); }
        catch { return null; }
      }).filter(Boolean);
  } catch { return []; }
}

function readSessionJson(path) {
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch { return null; }
}

function readSessionMd(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return null; }
}

function extractThemesFromMd(md) {
  if (!md) return [];
  const themes = [];
  const lines = md.split('\n');
  let currentTheme = null;
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2 && !h2[1].startsWith('Session') && !h2[1].startsWith('Raw Input') && !h2[1].startsWith('Actionable') && !h2[1].startsWith('Synthesis')) {
      if (currentTheme) themes.push(currentTheme);
      currentTheme = { name: h2[1], thoughtCount: 0, tasks: [] };
    }
    if (currentTheme && line.startsWith('### Fragment')) currentTheme.thoughtCount++;
    if (currentTheme && line.match(/^- \[ \]/)) currentTheme.tasks.push(line.replace('- [ ] ', ''));
  }
  if (currentTheme) themes.push(currentTheme);
  return themes;
}

export function diffSessions(sessionId1, sessionId2) {
  const date = today();
  const baseDir = join(BRAIN_DIR, date);
  const j1 = readSessionJson(join(baseDir, `${date}-${sessionId1}.json`));
  const j2 = readSessionJson(join(baseDir, `${date}-${sessionId2}.json`));
  const m1 = readSessionMd(join(baseDir, `${date}-${sessionId1}.md`));
  const m2 = readSessionMd(join(baseDir, `${date}-${sessionId2}.md`));
  if (!j1 && !j2) return { error: 'No session data found for given IDs.' };
  if (!j1) return { error: `Session ${sessionId1} not found.` };
  if (!j2) return { error: `Session ${sessionId2} not found.` };

  const t1 = extractThemesFromMd(m1);
  const t2 = extractThemesFromMd(m2);

  const t1names = t1.map(t => t.name);
  const t2names = t2.map(t => t.name);
  const common = t1names.filter(n => t2names.includes(n));
  const only1 = t1names.filter(n => !t2names.includes(n));
  const only2 = t2names.filter(n => !t1names.includes(n));

  const totalTasks1 = t1.reduce((s, t) => s + t.tasks.length, 0);
  const totalTasks2 = t2.reduce((s, t) => s + t.tasks.length, 0);

  const lines = [
    `# Brain Dump Diff — ${date}`,
    '',
    `## ${j1.session} vs ${j2.session}`,
    '',
    `| Metric | ${j1.session} | ${j2.session} | Change |`,
    `|--------|${'-'.repeat(j1.session.length + 2)}|${'-'.repeat(j2.session.length + 2)}|--------|`,
    `| Mode | ${j1.mode} | ${j2.mode} | — |`,
    `| Duration | ${j1.duration} | ${j2.duration} | — |`,
    `| Themes | ${j1.themes} | ${j2.themes} | ${j2.themes - j1.themes >= 0 ? '+' : ''}${j2.themes - j1.themes} |`,
    `| Tasks | ${totalTasks1} | ${totalTasks2} | ${totalTasks2 - totalTasks1 >= 0 ? '+' : ''}${totalTasks2 - totalTasks1} |`,
    '',
  ];

  if (common.length > 0) {
    lines.push('### Shared Themes', '');
    for (const name of common) {
      const t = t2.find(t => t.name === name);
      const tasks = t ? t.tasks.map(ts => `  - [ ] ${ts}`).join('\n') : '';
      lines.push(`- **${name}**${tasks ? '\n' + tasks : ''}`);
    }
    lines.push('');
  }

  if (only2.length > 0) {
    lines.push('### New Themes', '');
    for (const name of only2) {
      const t = t2.find(t => t.name === name);
      lines.push(`- **${name}** (${t ? t.thoughtCount : 0} thoughts)`);
    }
    lines.push('');
  }

  if (only1.length > 0) {
    lines.push('### Dropped Themes', '');
    for (const name of only1) {
      const t = t1.find(t => t.name === name);
      lines.push(`- **${name}** (was ${t ? t.thoughtCount : 0} thoughts)`);
    }
    lines.push('');
  }

  return { output: lines.join('\n'), session1: j1, session2: j2, common, new: only2, dropped: only1 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  const hasFamily = args.includes('--family');
  if (cmd === 'process') {
    const fi = args.findIndex(a => a === '--factor' || a === '-f');
    const factor = fi >= 0 ? parseInt(args[fi + 1], 10) || 2 : 2;
    const di = args.findIndex(a => a === '--depth' || a === '-d');
    const depth = di >= 0 ? parseInt(args[di + 1], 10) || 1 : 1;
    const modeFlag = args.find(a => a === '--quick' || a === '--deep' || a === '--full');
    const mode = modeFlag ? modeFlag.slice(2) : 'quick';
    const fileIdx = args.findIndex(a => a === '--file');
    if (fileIdx >= 0) {
      const filePath = args[fileIdx + 1];
      if (!filePath || !existsSync(filePath)) { console.error('File not found:', filePath); process.exit(1); }
      const text = readFileSync(filePath, 'utf-8');
      processBrainDump(text, { mode, factor, depth, family: hasFamily }).then(r => {
        if (r.error) { console.error(r.error); process.exit(1); }
        console.log(r.output);
        console.log(`\n---\nSession: ${r.session} | Mode: ${r.mode} | Spoons: ${r.spoon}/5 | ${r.duration}`);
      }).catch(err => { console.error('Brain dump failed:', err.message); process.exit(1); });
    } else {
      const text = args.filter(a => !a.startsWith('--') && a !== '-f' && a !== '-d').join(' ').trim();
      if (!text) { console.error('Usage: phos brain "raw text" [--quick|--deep|--full] [--factor N] [--depth N] [--family]'); process.exit(1); }
      processBrainDump(text, { mode, factor, depth, family: hasFamily }).then(r => {
        if (r.error) { console.error(r.error); process.exit(1); }
        console.log(r.output);
        console.log(`\n---\nSession: ${r.session} | Mode: ${r.mode} | Spoons: ${r.spoon}/5 | ${r.duration}`);
      }).catch(err => { console.error('Brain dump failed:', err.message); process.exit(1); });
    }
  } else if (cmd === 'sessions' || cmd === 'status') {
    const sessions = getSessions(parseInt(args[0], 10) || 5);
    if (sessions.length === 0) { console.log('No brain dump sessions today.'); process.exit(0); }
    console.log(`Brain Dump Sessions (${today()}):`);
    for (const s of sessions) {
      console.log(`  ${s.session} | ${s.mode} | ${s.themes} themes | ${s.thoughts} thoughts | ${s.duration} | spoon ${s.spoon}/5`);
    }
  } else if (cmd === 'session') {
    const modeFlag = args.find(a => a === '--deep' || a === '--full');
    const mode = modeFlag ? modeFlag.slice(2) : (hasFamily ? 'deep' : 'quick');
    console.log(`📝 Enter your stream of thought (Ctrl+D when done) — mode: ${mode}${hasFamily ? ' + family' : ''}:`);
    const chunks = [];
    process.stdin.on('data', (d) => { chunks.push(d); });
    process.stdin.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf-8').trim();
      if (!text) { console.log('No input received.'); process.exit(0); }
      processBrainDump(text, { mode, family: hasFamily }).then(r => {
        if (r.error) { console.error(r.error); process.exit(1); }
        console.log(r.output);
        console.log(`\n---\nSession: ${r.session} | Mode: ${r.mode} | Spoons: ${r.spoon}/5 | ${r.duration}`);
      }).catch(err => { console.error('Brain dump failed:', err.message); process.exit(1); });
    });
  } else if (cmd === 'diff') {
    const id1 = args[0];
    const id2 = args[1];
    if (!id1 || !id2) {
      console.error('Usage: phos brain diff <session-id-1> <session-id-2>');
      console.error('  Sessions:');
      const sessions = getSessions(10);
      for (const s of sessions) {
        console.error(`  ${s.session} | ${s.mode} | ${s.themes} themes | ${s.duration}`);
      }
      process.exit(1);
    }
    const result = diffSessions(id1, id2);
    if (result.error) { console.error(result.error); process.exit(1); }
    console.log(result.output);
  } else {
    console.log(`PHOS Brain Dump — Quantum Thought Processor

Pipeline: parse raw text \u2192 elaborate fragments \u2192 organize themes \u2192 research (optional) \u2192 synthesize \u2192 archive

Usage:
  phos brain "<text>" [--quick|--deep|--full] [--factor N] [--depth N] [--family]
  phos brain --file <path> [--quick|--deep|--full] [--family]
  phos brain sessions [n]

  phos brain --session [--family]                  Interactive stdin capture (Ctrl+D to submit)
  phos brain diff <id1> <id2>                     Compare two sessions

Options:
  --family  Load family-tree.json as research context (cycles, ghost nodes, Spoonemore echo)
            In --session mode without --deep/--full, automatically uses --deep

Modes:
  --quick   Elaborate + organize only (~3-5 min)
  --deep    + Jitterbug research per theme (~10-15 min)
  --full    + Cartographer code links + Tide context + family (~15-20 min)
`);
  }
}
