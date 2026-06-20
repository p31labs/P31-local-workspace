import { runJitterbug } from '/home/p31/P31-local-workspace/tools/phos-forge/jitterbug.mjs';

const problems = [
  {
    name: 'the-tide',
    problem: `Design a temporal pattern learning system ("The Tide") for the PHOS Forge event bus.
It must analyze timestamped events from /tmp/phos-forge/events.jsonl to identify circadian rhythms, recurring error cascades, flow state triggers, and behavioral signatures over hours-to-weeks timescales.
Output: a daemon design with FFT + correlation engine, emitting tide.pattern_detected events back to the bus.
Architecture: Node.js ESM module, integrates with existing event bus, cognitive state estimator, and aura visualization.`,
  },
  {
    name: 'the-cartographer',
    problem: `Design a semantic codebase map ("The Cartographer") for the P31 Andromeda monorepo.
It must use vector embeddings to map all ~38 projects by their functional semantics (not file path patterns), enabling semantic queries like "find all vagal toning modules" or "trace data flow from cognitive estimator to dashboard."
Must integrate with the existing PHOS Forge canonical map (phos-file-map.json) and classifier system.
Output: embedder service design, query API, integration points with existing tools, emitting cartographer.* events to the bus.`,
  },
  {
    name: 'the-reflex-arc',
    problem: `Design a sub-cycle fast loop ("The Reflex Arc") for PHOS Forge.
The cognitive-cybernetic loop runs estimator at 30s and healer at 60s intervals, but some events need millisecond-level response: sudden error spikes, process crashes, bus silence anomalies.
Design a lightweight event pattern matcher that sits directly on the Unix socket at /tmp/phos-forge/bus.sock and fires immediate remediation actions without waiting for the next healer cycle.
Output: pattern matcher design, rule syntax, integration with self-healer, safety guards against oscillation.`,
  },
  {
    name: 'kappa',
    problem: `Design an outcome-aware learning system ("Kappa") for the PHOS Forge self-healer.
Currently the healer takes actions (ping services, suggest rollbacks, lock deploys, suggest breaks) but never evaluates whether those actions worked.
Kappa should track every healer intervention, correlate it with subsequent cognitive state changes (from /tmp/phos-cognitive-state.json), and tune the healer's rule weights based on proven effectiveness for this specific operator.
Output: correlation engine design, weight adjustment algorithm, integration with self-healer, privacy considerations.`,
  },
  {
    name: 'the-logbook',
    problem: `Design an auto-generated session memory system ("The Logbook") for PHOS Forge.
Currently session artifacts exist in isolation: calibration logs at /tmp/phos-forge/calibration-log.jsonl, healer decisions at /tmp/phos-forge/healer-log.jsonl, Jitterbug research trees at /tmp/phos-jitterbug/, cognitive state history via the event bus.
The Logbook should be a cron-triggered Jitterbug convergence that daily gathers all signals, synthesizes a human-readable summary, and saves to a searchable archive.
Output: pipeline design, summary format, search interface, integration with existing artifact paths.`,
  },
];

const results = [];

for (const p of problems) {
  console.log(`\n=== RUNNING: ${p.name} ===`);
  try {
    const result = await runJitterbug(p.problem, { factor: 2, depth: 1 });
    results.push({ name: p.name, result });
    console.log(`[DONE] ${p.name} | session: ${result.session} | ${result.gated.tier}`);
  } catch (err) {
    console.error(`[FAIL] ${p.name}: ${err.message}`);
    results.push({ name: p.name, error: err.message });
  }
}

console.log(`\n\n=== ALL ${problems.length} COMPLETE ===`);
for (const r of results) {
  console.log(`  ${r.name}: ${r.error ? 'FAILED: ' + r.error : 'OK - session ' + r.result.session}`);
}
