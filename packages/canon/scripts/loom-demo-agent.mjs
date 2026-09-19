#!/usr/bin/env node
/**
 * The Loom — demo agent (β-1 presence lane).
 *
 * This agent appends events only. It never writes registry.json, contracts, or
 * CSS. Every write goes through commit() via the shared loom-tools handlers,
 * which is what the MCP tools also exercise. Agent-only kinds (traverse,
 * propose, review) — never focus/approve/reject/revise.
 *
 * Each iteration reviews the previous iteration's proposal (advisory only —
 * status does not change), then awaits a review on the newest proposal, which
 * no one posts, so the wait times out as a return value. That exercises both
 * the review write path and the wait's bounded-timeout path.
 *
 * This lives in packages/canon/scripts (not canon-mcp/scripts) so both the
 * check-no-agent-names gate AND the check-loom-seal gate cover it. The
 * cross-package import of canon-mcp/src/loom-tools.ts is deliberate — the demo
 * exercises the same handlers the MCP tools register. Any direct append here
 * (appendEvent/appendFileSync/createWriteStream/writeFileSync targeting the
 * live log) fails the seal gate.
 *
 * Run: node scripts/loom-demo-agent.mjs [--iterations=N] [--seed=S]
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { observe, traverse, propose, review, awaitReviews, resolveLogPath } from '../../canon-mcp/src/loom-tools.ts';

function arg(name, dflt) {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq !== undefined) return eq.slice(`--${name}=`.length);
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iterations = Number(arg('iterations', '10'));
const rand = mulberry32(Number(arg('seed', '0xBEEF')));
const logPath = resolveLogPath();

// Read the registry to pick real node names (read-only; never written).
const here = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(resolve(here, '..', 'registry.json'), 'utf8'));
const tokens = registry.tokens.map((t) => t.name);
const classes = registry.cssClasses.map((c) => c.name);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastProposalId = null;
for (let i = 0; i < iterations; i++) {
  const token = tokens[Math.floor(rand() * tokens.length)];
  const cls = classes[Math.floor(rand() * classes.length)];

  const t = traverse(logPath, token, cls, 'referenced-by');
  if (t.valid) console.log(`[demo] traverse ${token} -> ${cls} (seq ${t.event.seq})`);
  else console.error(`[demo] traverse FAILED: ${t.error}`);

  const id = `prop_demo_${Date.now()}_${i}`;
  const p = propose(logPath, id, cls, { draft: true, iteration: i }, 'demo-agent');
  if (p.valid) {
    console.log(`[demo] propose ${id} on ${cls} (seq ${p.event.seq})`);
  } else {
    console.error(`[demo] propose FAILED: ${p.error}`);
  }

  // Advisory peer-review of the prior iteration's proposal. The reviewer
  // identity differs from the author, but the gate does not enforce
  // self-review policy — it only requires a known proposal at the current
  // revision. Status stays pending regardless; only a human approves.
  if (lastProposalId) {
    const rv = review(logPath, lastProposalId, 'approve', 'demo-reviewer');
    if (rv.valid) console.log(`[demo] review ${lastProposalId} approve (seq ${rv.event.seq})`);
    else console.error(`[demo] review FAILED: ${rv.error}`);
  }

  if (p.valid) lastProposalId = id;

  const o = observe(logPath);
  console.log(`[demo] observe focused=${o.focused} cursor=${o.agentCursor} proposals=${o.proposals.length}`);
  await sleep(120 + Math.floor(rand() * 280));
}

if (lastProposalId) {
  const aw = await awaitReviews(logPath, lastProposalId, 500);
  console.log(`[demo] awaitReviews(${lastProposalId}) -> ${aw.status} (newest proposal is unreviewed, so timeout is expected)`);
}
console.log(`[demo] done. log: ${logPath}`);
