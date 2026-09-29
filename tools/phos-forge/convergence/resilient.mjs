// convergence/resilient.mjs
// Layer 2 — Chunked convergence with checkpointing.
//
// Research basis:
// - LLM×MapReduce (ACL Anthology): divide-and-conquer for long-sequence
//   processing. Split the document into chunks for the LLM to read, then
//   aggregate intermediate outputs into the final response.
// - Atomic Checkpoint Protocol (Zenodo): high-frequency checkpointing; the
//   cost of reprocessing a failed convergence (5-15 min) outweighs the
//   checkpoint cost (5-10 s) by 30-100x. A compaction failure mid-map loses
//   NO completed briefs.
//
// This replaces the single giant synthesis call (which stalls 4/4) with:
//   1. map:    compact each research facet into a short brief (checkpointed)
//   2. reduce: synthesize the briefs into the final convergence (checkpointed)
// Partial results persist to /tmp so a crash resumes instead of restarting.

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHECKPOINT_DIR = '/tmp/phos-jitterbug/checkpoints';

const COMPACT_SYSTEM = `You are a research compactor. Summarize the following research into a dense brief:
- Key findings (bullets)
- Method / approach
- Explicit citations (keep the source names verbatim)
- Open questions or risks
Output 120-200 words. No preamble, no headings, no markdown — plain text.`;

const REDUCE_SYSTEM = `You are a synthesis architect. Merge these compacted research briefs into a unified analysis.

Output in EXACTLY this structure:

## Consensus
What all briefs agree on. Common themes, shared conclusions, compatible recommendations.

## Divergence
Where the briefs disagree, propose conflicting approaches, or explore different trade-offs. Preserve edge cases.

## Synthesis
Your integrated analysis. How to bridge the divergences. What to carry forward. What to deprioritize.

Output only the structure above. No preamble, no summary.`;

function checkpointPath(session) {
  return resolve(CHECKPOINT_DIR, `${session}-convergence.json`);
}

function loadCheckpoint(session) {
  const p = checkpointPath(session);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function saveCheckpoint(session, state) {
  mkdirSync(CHECKPOINT_DIR, { recursive: true });
  writeFileSync(checkpointPath(session), JSON.stringify(state, null, 2), 'utf-8');
}

// Map step — compact each facet to a brief. Checkpointed after each facet so
// a crash on facet k preserves facets 0..k-1.
async function mapFacets(session, researchTexts, callFn, opts = {}) {
  const saved = loadCheckpoint(session);
  const briefs = saved?.briefs?.slice() ?? [];
  const errors = saved?.errors?.slice() ?? [];

  for (let i = briefs.length; i < researchTexts.length; i++) {
    const facet = researchTexts[i];
    try {
      const brief = await callFn(COMPACT_SYSTEM, `Research output ${i + 1}:\n\n${facet.slice(0, 6000)}`, {
        maxTokens: 512,
        temperature: 0.1,
        label: `compact:${i}`,
      });
      if (!brief || brief.trim().length < 40) {
        throw new Error('compaction-empty');
      }
      briefs.push(brief.trim());
    } catch (e) {
      errors.push({ index: i, error: e.message });
      // Degrade-in-place: keep the raw facet so no content is lost, mark it
      // as uncompacted. Never zero.
      briefs.push(`[uncompacted facet ${i + 1}]\n\n${facet.slice(0, 2000)}`);
    }
    saveCheckpoint(session, { briefs, errors, step: 'map', at: i + 1 });
  }
  return { briefs, errors };
}

// Reduce step — synthesize the briefs into the final convergence.
async function reduceBriefs(session, briefs, callFn, opts = {}) {
  const saved = loadCheckpoint(session);
  if (saved?.synthesis) return { synthesis: saved.synthesis, reduced: true };

  const combined = briefs.map((b, i) => `## Brief ${i + 1}\n${b}`).join('\n\n');
  const synthesis = await callFn(REDUCE_SYSTEM, `Merge these ${briefs.length} research briefs into a unified synthesis:\n\n${combined}`, {
    maxTokens: 3000,
    temperature: 0.2,
    label: 'reduce',
  });
  if (!synthesis || synthesis.trim().length < 200) {
    throw new Error('reduce-empty');
  }
  saveCheckpoint(session, { briefs, synthesis, step: 'reduce', at: 'done' });
  return { synthesis: synthesis.trim(), reduced: true };
}

// Full resilient convergence: map then reduce, both checkpointed.
export async function resilientConvergence(session, researchTexts, callFn, opts = {}) {
  const { briefs, errors } = await mapFacets(session, researchTexts, callFn, opts);
  const { synthesis } = await reduceBriefs(session, briefs, callFn, opts);
  return { synthesis, briefs, errors, checkpoint: checkpointPath(session) };
}

// Test hook — deterministic map/reduce with a fake callFn.
export async function __testResilient() {
  const fake = async (sys, user, o) => `brief: ${user.slice(0, 40)} and more detail here to clear the minimum length threshold for a convergence output. `.repeat(8);
  const texts = ['facet one content here', 'facet two content here'];
  const r = await resilientConvergence('test-session', texts, fake);
  return { briefs: r.briefs.length, hasSynthesis: r.synthesis.length > 0 };
}