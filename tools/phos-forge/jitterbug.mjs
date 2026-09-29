#!/usr/bin/env node

import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { dispatchLLM } from './router.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = '/tmp/phos-jitterbug';
const STATE_PATH = '/tmp/phos-cognitive-state.json';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const MAX_CONTEXT = 8000;

const SPOON_TABLE = [
  { max: 0, factor: 1, depth: 0, label: 'LOCKED' },
  { max: 2, factor: 2, depth: 1, label: 'SHALLOW' },
  { max: 3, factor: 3, depth: 2, label: 'MODERATE' },
  { max: 5, factor: 4, depth: 3, label: 'DEEP' },
];

function readSpoonLevel() {
  try {
    if (existsSync(SPOON_PATH)) {
      const d = JSON.parse(readFileSync(SPOON_PATH, 'utf-8'));
      if (typeof d.level === 'number') return d.level;
    }
  } catch {}
  try {
    if (existsSync(STATE_PATH)) {
      const d = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
      if (typeof d.spoon === 'number') return d.spoon;
    }
  } catch {}
  return 4;
}

export function getGatedConfig(requestedFactor, requestedDepth) {
  const spoon = readSpoonLevel();
  const tier = SPOON_TABLE.find(t => spoon <= t.max) || SPOON_TABLE[SPOON_TABLE.length - 1];
  return {
    spoon,
    factor: Math.min(requestedFactor || 4, tier.factor),
    depth: Math.min(requestedDepth || 3, tier.depth),
    tier: tier.label,
  };
}

function trimContext(text) {
  if (typeof text !== 'string') return '';
  if (text.length > MAX_CONTEXT) {
    return text.slice(-MAX_CONTEXT) + '\n\n[... context truncated to fit window ...]';
  }
  return text;
}

function busEmit(type, payload) {
  const event = { type, payload, timestamp: new Date().toISOString(), id: crypto.randomUUID() };
  try { appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n'); }
  catch (e) { console.error(`[jitterbug] event bus write failed: ${e.message}`); }
}

export async function callLLM(system, user, opts = {}) {
  const intent = opts.intent || { task: 'synthesis', privacy: 'standard' };
  // The --allow-ollama flag (threaded through opts.privacy) forces sovereign
  // routing to local Ollama when set — otherwise the hardcoded 'standard'
  // falls through to cloud tiers that will fail without API keys. Without
  // this, the flag was cosmetic: a bug.
  if (opts.privacy) intent.privacy = opts.privacy;
  return dispatchLLM(system, user, intent, opts);
}

const RESEARCH_SYSTEM = `You are a deeply curious, thorough research agent. Explore your assigned facet exhaustively.
Cover: technical architecture, design implications, edge cases, trade-offs, relevant prior art, and concrete recommendations.
Be specific. Include code snippets, configuration examples, or reference links where relevant.
Output 700-1200 words of substantial, nuanced research.`;

const CONVERGE_SYSTEM = `You are a synthesis architect. Your task is to merge multiple research outputs into a unified analysis.

Output in EXACTLY this structure:

## Consensus
What all research outputs agree on. Common themes, shared conclusions, compatible recommendations.

## Divergence
Where the outputs fundamentally disagree, propose conflicting approaches, or explore different trade-offs. Preserve edge cases — they are where innovation lives.

## Synthesis
Your integrated analysis. How to bridge the divergences. What to carry forward. What to deprioritize.

## Next Facets
Output exactly 4 distinct research facets to explore at the next depth level. Each facet must be:
- A specific, well-defined question or angle
- Non-overlapping with the other three
- Addresses a gap, contradiction, or unexplored territory from this synthesis

Return the facets as a JSON array at the end of your output:
\`\`\`json
[
  { "title": "Facet title", "prompt": "Detailed exploration prompt for the next research agent" },
  ...
]
\`\`\`

Output only the structure above with the JSON block. No preamble, no summary.`;

const RESEARCH_CHEAP = 'research';
const RESEARCH_STRONG = 'synthesis';
const CONVERGE_MODEL = 'synthesis';

async function runResearch(facet, parentContext, index, privacy) {
  return callLLM(RESEARCH_SYSTEM, `## Facet\n${facet}\n\n## Context from parent synthesis\n${trimContext(parentContext)}\n\nExplore this facet in depth.`, {
    intent: { task: 'research', tag: 'fast', privacy },
    maxTokens: 4096,
    temperature: 0.8,
  });
}

async function runConvergence(researchTexts, privacy) {
  const combined = researchTexts.map((t, i) => `## Research Output ${i + 1}\n${trimContext(t)}`).join('\n\n');
  return callLLM(CONVERGE_SYSTEM, `Converge these ${researchTexts.length} research outputs into a unified synthesis:\n\n${combined}`, {
    intent: { task: 'synthesis', tag: 'synthesis', privacy },
    maxTokens: 2000,
    temperature: 0.3,
    timeoutMs: 180000, // kimi-k2.6 (1T params) needs ~35s+; budget for the slow frontier path
  });
}

function parseFacets(text) {
  // Try JSON block first (preferred, more reliable)
  const jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(f => f.title && f.prompt)) {
        return parsed.map(f => ({ title: f.title, prompt: f.prompt }));
      }
    } catch {}
  }

  // Fallback: regex-based extraction for malformed output
  const facets = [];
  const regex = /\d+\.\s*\*\*(.+?)\*\*\s*—\s*(.+?)\n\s*Exploration prompt:\s*(.+?)(?=\n\s*\d+\.|\n*$)/gs;
  let m;
  while ((m = regex.exec(text)) !== null) {
    facets.push({ title: `${m[1].trim()} — ${m[2].trim()}`, prompt: m[3].trim() });
  }
  return facets;
}

function saveArtifact(session, level, name, content) {
  const dir = resolve(SESSION_DIR, session, `level-${level}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, name), content, 'utf-8');
}

export async function runJitterbug(problem, opts = {}) {
  const requestedFactor = opts.factor || 4;
  const requestedDepth = opts.depth || 3;
  const gated = getGatedConfig(requestedFactor, requestedDepth);
  // Routing mode: --workers-ai → direct Workers AI REST (intent-tagged, the
  // default for Workers-AI-only); --gateway → AI Gateway dynamic route;
  // --allow-ollama → local Ollama. The model is chosen by intent strength.
  const privacy = opts.workersAI ? 'workers-ai'
    : opts.gateway ? 'gateway'
    : opts.allowOllama ? 'sovereign' : 'standard';

  if (gated.depth === 0) {
    return { error: `Spoon level ${gated.spoon} is too low for any research depth. (tier: ${gated.tier}) Use --force or wait for spoon recovery.`, gated };
  }

  const session = crypto.randomUUID().slice(0, 8);
  const artifactDir = resolve(SESSION_DIR, session);
  mkdirSync(artifactDir, { recursive: true });

  // Save workflow config
  const workflow = {
    problem,
    requestedFactor,
    requestedDepth,
    gated,
    session,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(resolve(artifactDir, 'workflow.json'), JSON.stringify(workflow, null, 2), 'utf-8');

  busEmit('jitterbug.started', { session, problem, factor: gated.factor, depth: gated.depth, spoon: gated.spoon, tier: gated.tier });

  let currentContext = problem;
  const levelOutputs = [];

  for (let level = 0; level < gated.depth; level++) {
    // Mid-run spoon check — if spoons dropped, pause gracefully
    const midGated = getGatedConfig(requestedFactor, requestedDepth);
    if (midGated.depth < gated.depth - level) {
      busEmit('jitterbug.paused', { session, level, reason: 'spoon-degraded', from: gated.depth, to: midGated.depth });
      if (level === 0) {
        return { error: `Spoon level dropped mid-run (${midGated.spoon}, ${midGated.tier}). Cannot proceed at depth ${gated.depth}.`, gated: midGated, partial: levelOutputs };
      }
      break;
    }

    busEmit('jitterbug.level_started', { session, level, factor: gated.factor });

    // Derive facets from context
    let facets;
    if (level === 0) {
      // First level: split problem into facets via LLM
      const splitPrompt = `Break this problem statement into exactly ${gated.factor} distinct research facets. Each must be a specific, non-overlapping angle. Output as a numbered list with a title and one-line prompt for each.

Problem: ${problem}

Format:
1. **Title** — description
2. **Title** — description
...`;
      const splitResult = await callLLM('You are a research strategist. Split problems into non-overlapping facets.', splitPrompt, {
        intent: { task: 'synthesis', tag: 'synthesis', privacy },
        maxTokens: 2048,
        temperature: 0.5,
      });
      facets = parseFacets(splitResult) || [];
      if (facets.length < gated.factor) {
        busEmit('jitterbug.split_fallback', { session, level, parsed: facets.length, requested: gated.factor });
      }
      if (facets.length < gated.factor) {
        // Fallback: generate generic facets
        facets = Array.from({ length: gated.factor }, (_, i) => ({
          title: `Research Angle ${i + 1}`,
          prompt: `Explore research angle ${i + 1} of the problem: ${problem}`,
        }));
      }
    } else {
      // Extract facets from previous convergence
      const prevOutput = levelOutputs[levelOutputs.length - 1];
      facets = parseFacets(prevOutput);
    }

    // Trim to factor
    facets = facets.slice(0, gated.factor);
    if (facets.length === 0) {
      facets = Array.from({ length: gated.factor }, (_, i) => ({
        title: `Angle ${i + 1} at level ${level}`,
        prompt: `Explore angle ${i + 1} at depth ${level + 1} of: ${currentContext.slice(0, 200)}`,
      }));
    }

    // Spawn parallel research
    const researchPromises = facets.map((facet, i) => {
      busEmit('jitterbug.research_started', { session, level, index: i, facet: facet.title });
      return runResearch(facet.prompt, currentContext, i, privacy).then(result => {
        saveArtifact(session, level, `research-${i + 1}.md`, `# ${facet.title}\n\n${result}`);
        busEmit('jitterbug.research_complete', { session, level, index: i });
        return result;
      }).catch(err => {
        busEmit('jitterbug.research_failed', { session, level, index: i, error: err.message });
        return `[Research failed for facet "${facet.title}": ${err.message}]`;
      });
    });

    const researchResults = await Promise.all(researchPromises);

    // Converge
    busEmit('jitterbug.convergence_started', { session, level });
    const convergence = await runConvergence(researchResults, privacy);

    // Validate convergence output structure
    const hasStructure = /^(## Consensus|## Divergence|## Synthesis)/m.test(convergence);
    if (!hasStructure) {
      busEmit('jitterbug.convergence_warn', { session, level, issue: 'missing-expected-sections' });
      console.error(`[jitterbug] Convergence at level ${level} missing expected section headers (Consensus/Divergence/Synthesis).`);
    }

    saveArtifact(session, level, `convergence-${level + 1}.md`, convergence);

    busEmit('jitterbug.convergence', { session, level, structured: hasStructure });

    currentContext = convergence;
    levelOutputs.push(convergence);
  }

  // Final output = last level output (or best partial if interrupted)
  const finalOutput = levelOutputs.length > 0
    ? levelOutputs[levelOutputs.length - 1]
    : 'No output generated.';
  saveArtifact(session, levelOutputs.length - 1 || 0, 'final.md', finalOutput);

  const tree = { session, levels: levelOutputs.length, factor: gated.factor, depth: gated.depth, spoon: gated.spoon, completed: levelOutputs.length === gated.depth };
  writeFileSync(resolve(artifactDir, 'tree.json'), JSON.stringify(tree, null, 2), 'utf-8');

  busEmit('jitterbug.complete', { session, levels: levelOutputs.length, factor: gated.factor, depth: gated.depth, spoon: gated.spoon, completed: levelOutputs.length === gated.depth });

  // Strip ANSI for final output
  const clean = finalOutput.replace(/\x1B\[[0-9;?]*[A-Za-z]/g, '');
  return { output: clean, session, gated, tree };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.includes('--dry-run') || args.includes('-n')) {
    const problem = args.find(a => !a.startsWith('-')) || 'No problem specified';
    const fi = args.findIndex(a => a === '--factor' || a === '-f');
    const factor = fi >= 0 ? parseInt(args[fi + 1], 10) || 4 : 4;
    const di = args.findIndex(a => a === '--depth' || a === '-d');
    const depth = di >= 0 ? parseInt(args[di + 1], 10) || 3 : 3;
    const allowOllama = args.includes('--allow-ollama');
    const workersAI = args.includes('--workers-ai');
    const gateway = args.includes('--gateway');
    const gated = getGatedConfig(factor, depth);
    console.log(JSON.stringify({
      mode: 'DRY-RUN',
      problem,
      requested: { factor, depth },
      allowOllama,
      gateway,
      workersAI,
      gated,
      estimatedCalls: gated.depth * (gated.factor + 1) + (gated.depth > 0 ? 0 : 0),
      artifacts: `${SESSION_DIR}/<session-id>/`,
      status: gated.depth > 0 ? 'READY' : 'BLOCKED (spoons too low)',
    }, null, 2));
    process.exit(0);
  }

  const problem = args.find(a => !a.startsWith('-')) || '';
  if (!problem) {
    console.error(`PHOS Jitterbug — Fractal Research Engine

Usage:
  phos jitterbug "<problem statement>"  Run the research workflow (spoon-gated)
  phos jitterbug --factor 3 --depth 2   Configure branching and depth
  phos jitterbug --dry-run              Preview what would be executed
  phos jitterbug --allow-ollama         Enable Ollama fallback (noisy 1.5B)
  phos jitterbug --gateway              Route through Cloudflare AI Gateway (Workers AI, intent-routed)
  phos jitterbug --workers-ai           Route directly to Workers AI (intent-tagged, needs CF_API_TOKEN)

Spoon gating:
  Level 4-5: factor=4, depth=3 (15 LLM calls)
  Level 3:   factor=3, depth=2 (8 LLM calls)
  Level 1-2: factor=2, depth=1 (3 LLM calls, advisory only)

Output artifacts saved to /tmp/phos-jitterbug/<session-id>/
`);
    process.exit(1);
  }

  const fi = args.findIndex(a => a === '--factor' || a === '-f');
  const factor = fi >= 0 ? parseInt(args[fi + 1], 10) || 4 : 4;
  const di = args.findIndex(a => a === '--depth' || a === '-d');
  const depth = di >= 0 ? parseInt(args[di + 1], 10) || 3 : 3;
  const allowOllama = args.includes('--allow-ollama');
  const workersAI = args.includes('--workers-ai');
  const gateway = args.includes('--gateway');

  runJitterbug(problem, { factor, depth, allowOllama, gateway, workersAI })
    .then(result => {
      if (result.error) {
        console.error(result.error);
        process.exit(1);
      }
      console.log(result.output);
      console.log(`\n---`);
      console.log(`Session: ${result.session}`);
      console.log(`Spoons: ${result.gated.spoon}/5 (${result.gated.tier})`);
      console.log(`Routing: ${workersAI ? 'workers-ai (intent-tagged)' : gateway ? 'gateway (Workers AI)' : allowOllama ? 'ollama' : 'standard'}`);
      console.log(`Artifacts: ${SESSION_DIR}/${result.session}/`);
    })
    .catch(err => {
      console.error(`Jitterbug error: ${err.message}`);
      process.exit(1);
    });
}
