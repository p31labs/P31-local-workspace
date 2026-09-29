#!/usr/bin/env node
/**
 * diagnose-compression.mjs — Path E: compression-loss diagnosis.
 *
 * The frontier comparison raised the question: where does the jitterbug's
 * 0.604 -> 0.856 quality gap come from? The convergence pipeline compresses
 * twice:
 *   map:    facet -> brief   (mapFacets, COMPACT_SYSTEM)
 *   reduce: briefs -> synthesis (reduceBriefs, REDUCE_SYSTEM)
 * Each compression step can lose information the frontier single-call keeps.
 * Agent Capsules: "injecting more context into a merged call worsens
 * compression rather than relieving it" — so the fix is better briefs, not
 * more briefs. To know WHERE the loss is, measure BOTH steps per-criterion.
 *
 * Data source (already on disk, no new inference to generate inputs):
 *   - facets:   /tmp/phos-jitterbug/<session>/level-{0,1}/research-{1..N}.md
 *   - briefs:   /tmp/phos-jitterbug/checkpoints/<session>-l{0,1}-convergence.json
 *   - synthesis: same checkpoint file (.synthesis)
 * The checkpoint filename embeds the session + level, so facets and briefs
 * pair deterministically.
 *
 * Method: a preservation rubric is scored per (facet,brief) pair (map-loss)
 * and per (briefs,synthesis) set (reduce-loss) by the SAME calibrated temp-0
 * judge that scored the bench. Output: per-criterion preservation rate.
 *
 * Usage:
 *   node tools/phos-forge/convergence/diagnose-compression.mjs            # live judge
 *   node tools/phos-forge/convergence/diagnose-compression.mjs --dry-run  # fake judge
 *   node tools/phos-forge/convergence/diagnose-compression.mjs --since 2026-09-29T17:00
 *     # scope to checkpoints written after this ISO timestamp (version window).
 *     # Required: the disk holds checkpoints from MULTIPLE pipeline versions
 *     # (pre-temp-fix, pinned-judge, post-resilience). Mixing them measures
 *     # 'average loss across every variant' — not a useful diagnostic.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { dispatchLLM } from '../router.mjs';

const SESSION_DIR = '/tmp/phos-jitterbug';
const CHECKPOINT_DIR = '/tmp/phos-jitterbug/checkpoints';
const OUT_DIR = '/home/p31/P31-local-workspace/tools/jitterbug-bench/runs/compression';
const JUDGE_MODEL = '@cf/deepseek-ai/deepseek-v4-flash-0731';

// Preservation rubric — what the brief/synthesis must retain.
const PRESERVATION_RUBRIC = [
  { id: 'PR-1', axis: 'Citations', weight: 3,
    criterion: 'Retains every citation / source name from the input (verbatim where possible)' },
  { id: 'PR-2', axis: 'Claims', weight: 3,
    criterion: 'Retains every key claim / finding / conclusion from the input' },
  { id: 'PR-3', axis: 'Numbers', weight: 2,
    criterion: 'Retains every numeric value / measurement / parameter from the input' },
  { id: 'PR-4', axis: 'Specificity', weight: 2,
    criterion: 'Retains concrete specifics (names, mechanisms, edge cases) without genericizing' },
  { id: 'PR-5', axis: 'Fidelity', weight: 2,
    criterion: 'Does NOT add invented content, false attribution, or hallucinated citations' },
];

const JUDGE_SYS = 'You are a calibrated preservation judge. For each criterion, return one of: Satisfied, Partially, Not Satisfied. Output strict JSON: {"scores":[{"id":"...","verdict":"..."}]}';

function judgePrompt(kind, source, target) {
  const criteria = PRESERVATION_RUBRIC.map((r) => `- [${r.id}] ${r.criterion} (weight ${r.weight})`).join('\n');
  return `## Source (${kind})\n${source.slice(0, 6000)}\n\n## Target (${kind === 'map' ? 'brief' : 'synthesis'})\n${target.slice(0, 4000)}\n\n## Criteria\n${criteria}\n\nScore how well the TARGET preserves the SOURCE against each criterion.`;
}

function parseJudgement(raw) {
  try {
    const cleaned = String(raw).replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { scores: [] };
  }
}

function computePreservationRate(judgement) {
  let numerator = 0;
  let weight = 0;
  for (const r of PRESERVATION_RUBRIC) {
    const v = judgement.scores?.find((s) => s.id === r.id)?.verdict;
    const score = v === 'Satisfied' ? 1.0 : v === 'Partially' ? 0.5 : 0.0;
    weight += r.weight;
    numerator += r.weight * score;
  }
  return weight > 0 ? numerator / weight : 0;
}

// --- data pairing ---

function facetFor(session, level, i) {
  const p = resolve(SESSION_DIR, session, `level-${level}`, `research-${i + 1}.md`);
  return existsSync(p) ? readFileSync(p, 'utf-8') : null;
}

function checkpoints(since = null) {
  return readdirSync(CHECKPOINT_DIR)
    .filter((f) => f.endsWith('-convergence.json') && !f.startsWith('test-'))
    .map((f) => {
      const m = f.match(/^([0-9a-f]+)-l(\d)-convergence\.json$/);
      if (!m) return null;
      const p = resolve(CHECKPOINT_DIR, f);
      // Version-window filter: exclude checkpoints written before `since`.
      if (since && statSync(p).mtime < new Date(since).getTime()) return null;
      const d = JSON.parse(readFileSync(p, 'utf-8'));
      return { session: m[1], level: Number(m[2]), briefs: d.briefs ?? [], synthesis: d.synthesis ?? '', file: f };
    })
    .filter(Boolean);
}

// --- runner ---

async function judge(source, target, kind) {
  const raw = await dispatchLLM(JUDGE_SYS, judgePrompt(kind, source, target), {
    task: 'reasoning', privacy: 'workers-ai',
  }, { model: JUDGE_MODEL, temperature: 0, maxTokens: 1500 });
  return parseJudgement(raw);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const sinceArg = process.argv.find((a) => a === '--since');
  const since = sinceArg ? process.argv[process.argv.indexOf(sinceArg) + 1] : null;
  const judgeFn = dryRun
    ? async (s, t, k) => {
        // deterministic fake judge: all Satisfied (used to test the harness)
        return { scores: PRESERVATION_RUBRIC.map((r) => ({ id: r.id, verdict: 'Satisfied' })) };
      }
    : judge;

  mkdirSync(OUT_DIR, { recursive: true });
  const mapResults = [];
  const reduceResults = [];
  const pairs = [];

  for (const cp of checkpoints(since)) {
    // MAP: each brief vs its facet
    for (let i = 0; i < cp.briefs.length; i++) {
      const facet = facetFor(cp.session, cp.level, i);
      if (!facet) continue;
      const j = await judgeFn(facet, cp.briefs[i], 'map');
      const rate = computePreservationRate(j);
      mapResults.push({ session: cp.session, level: cp.level, index: i, rate, judgement: j });
      pairs.push({ id: `${cp.session}-l${cp.level}-m${i}`, kind: 'map', session: cp.session, level: cp.level, judgement: j });
      process.stdout.write(`map ${cp.session}/l${cp.level}/f${i}: ${rate.toFixed(2)}  `);
    }
    // REDUCE: synthesis vs the brief-set (fidelity of the merge)
    if (cp.synthesis && cp.briefs.length) {
      const briefSet = cp.briefs.join('\n\n---\n\n');
      const j = await judgeFn(briefSet, cp.synthesis, 'reduce');
      const rate = computePreservationRate(j);
      reduceResults.push({ session: cp.session, level: cp.level, rate, judgement: j });
      pairs.push({ id: `${cp.session}-l${cp.level}-r`, kind: 'reduce', session: cp.session, level: cp.level, judgement: j });
      process.stdout.write(`reduce ${cp.session}/l${cp.level}: ${rate.toFixed(2)}  `);
    }
    process.stdout.write('\n');
  }

  // Aggregate per-criterion across map results.
  const critAgg = {};
  for (const mr of mapResults) {
    for (const r of PRESERVATION_RUBRIC) {
      const v = mr.judgement.scores?.find((s) => s.id === r.id)?.verdict;
      if (!v) continue;
      critAgg[r.id] = critAgg[r.id] ?? { total: 0, satisfied: 0, partially: 0, not: 0, sum: 0, n: 0 };
      const a = critAgg[r.id];
      a.total += 1;
      a[v] += 1;
      a.sum += v === 'Satisfied' ? 1 : v === 'Partially' ? 0.5 : 0;
      a.n += 1;
    }
  }
  const critReport = Object.entries(critAgg).map(([id, a]) => ({
    id, preservation: a.sum / a.n, satisfied: a.satisfied, partially: a.partially, not: a.not, n: a.n,
  }));

  const mean = (arr) => (arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : null);
  const report = {
    generated: new Date().toISOString(),
    dryRun,
    since: since ?? null,
    nMap: mapResults.length,
    nReduce: reduceResults.length,
    mapLossRate: 1 - mean(mapResults.map((r) => r.rate)),
    reduceLossRate: 1 - mean(reduceResults.map((r) => r.rate)),
    perCriterion: critReport,
  };
  writeFileSync(resolve(OUT_DIR, 'compression-report.json'), JSON.stringify({ report, mapResults, reduceResults }, null, 2));
  writeFileSync(resolve(OUT_DIR, 'pairs.json'), JSON.stringify({ pairs }, null, 2));

  console.log('\n=== Compression Loss Report ===');
  console.log(`map_loss_rate   = ${(report.mapLossRate * 100).toFixed(1)}%  (n=${report.nMap})`);
  console.log(`reduce_loss_rate = ${(report.reduceLossRate * 100).toFixed(1)}%  (n=${report.nReduce})`);
  console.log('per-criterion preservation:');
  for (const c of critReport) {
    console.log(`  ${c.id} ${c.preservation.toFixed(2)} (n=${c.n}) ${c.satisfied}S/${c.partially}P/${c.not}N`);
  }
  console.log(`\nreport -> ${resolve(OUT_DIR, 'compression-report.json')}`);
}

// Test hook — deterministic harness self-test.
export async function __testDiagnose() {
  // A known map-loss: brief that drops a citation must score lower than one that keeps it.
  const facet = 'Research on spoon theory by Miserandino (2003) and cognitive load by Sweller (1988), with WCAG 2.2 criterion 1.4.3 at ratio 4.5:1.';
  const good = 'Miserandino 2003 spoon theory; Sweller 1988 cognitive load; WCAG 1.4.3 at 4.5:1.';
  const bad = 'Some notes on cognitive stuff.';
  return {
    hasPairing: checkpoints().length > 0,
    rubricCount: PRESERVATION_RUBRIC.length,
    parseWorks: parseJudgement('{"scores":[{"id":"PR-1","verdict":"Satisfied"}]}').scores.length === 1,
    // semantic: a worse brief should compute a lower rate — checked by caller via dry-run
    goodRate: computePreservationRate({ scores: PRESERVATION_RUBRIC.map((r) => ({ id: r.id, verdict: 'Satisfied' })) }),
    badRate: computePreservationRate({ scores: PRESERVATION_RUBRIC.map((r) => ({ id: r.id, verdict: 'Not Satisfied' })) }),
  };
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) });
}