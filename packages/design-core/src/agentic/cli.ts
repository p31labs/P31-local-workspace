#!/usr/bin/env node
/**
 * p31 design CLI — agentic design system entry point.
 *   design list                 validate + tabulate all bundled intents
 *   design audit <file.yml>     parse + run Lantern gates, exit 1 on reject
 *   design audit --nc           negative control: assert a known-bad fixture is rejected
 *   design audit --canon <file> require a human approval block bound to the spec hash
 *   design approve <file> --by <pickle>  emit a human-approval block (the anchor)
 *   design create <Name>        scaffold an intent draft
 *   design variant <file.yml>   emit a derived variant spec to stdout
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseIntent, summarize } from './intent/parser';
import { runQaGates } from './qa/gates';
import { loadExampleSpecs } from './orchestrate';
import { JsonlAgenticAuditSink, hashInput } from './audit';
import { approveSpec, findApproval, hashSpec, DESIGN_REVIEWER_PICKLE } from './approve';

const __dirname = dirname(fileURLToPath(import.meta.url));
const [cmd, ...rest] = process.argv.slice(2);

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

switch (cmd) {
  case 'list': {
    const specs = loadExampleSpecs();
    console.log('P31 Intent Registry');
    for (const [name, r] of Object.entries(specs)) {
      if (!r.ok) { console.log(`  ✗ ${name} — INVALID`); continue; }
      console.log(`  ✓ ${name}`);
      for (const line of r.summary ?? []) console.log(`      ${line}`);
    }
    break;
  }

  case 'audit': {
    // Canon gate: an irreversible design decision requires a human approval
    // block bound to the spec's exact hash. "Never go full delta" — the human
    // anchor is required, not optional. Stale (spec changed) = blocked.
    if (rest[0] === '--canon') {
      const file = rest[1] ?? fail('usage: design audit --canon <file.yml>');
      if (!existsSync(file)) fail(`not found: ${file}`);
      const inputHash = hashSpec(file);
      const sink = JsonlAgenticAuditSink.default();
      const approval = findApproval(sink, inputHash);
      if (!approval) {
        console.error('🔴 CANON GATE: no human approval bound to this spec hash.');
        console.error(`   hash: ${inputHash.slice(0, 16)}…`);
        console.error(`   approve with: design approve ${file} --by <pickle-name>`);
        process.exit(1);
      }
      const p = approval.payload as { reviewer: string; decision: string };
      if (p.decision !== 'approved') {
        console.error(`🔴 CANON GATE: spec was ${p.decision} by ${p.reviewer} (block #${approval.blockNumber}).`);
        process.exit(1);
      }
      console.log(`✅ CANON GATE: approved by ${p.reviewer} (block #${approval.blockNumber}).`);
      // fall through to the normal audit below — the spec must ALSO pass gates
    }

    // Negative control: a gate that cannot be shown to fail is furniture.
    // Assert that the bundled failing fixture is REJECTED (exit 1). If the
    // gate ever approves it, the gate has no teeth — exit 1 with an error.
    if (rest[0] === '--nc') {
      const fixture = join(
        __dirname,
        'intent',
        'examples',
        '__nc__fail-contrast.yml',
      );
      if (!existsSync(fixture)) fail(`negative-control fixture missing: ${fixture}`);
      const res = parseIntent(readFileSync(fixture, 'utf8'));
      if (!res.ok) fail(`negative-control fixture is invalid YAML — it must parse, then reject (${res.errors?.join('; ')})`);
      const report = runQaGates(res.spec!);
      if (report.approved) {
        console.error('✗ NEGATIVE CONTROL FAILED: a 3:1 contrast / 32px touch fixture was APPROVED — the Lantern Architect gate is furniture.');
        process.exit(1);
      }
      console.log('✅ NEGATIVE CONTROL OK: known-bad fixture rejected (gate can fail).');
      process.exit(0);
    }

    const isCanon = rest[0] === '--canon';
    const file = (isCanon ? rest[1] : rest[0]) ?? fail('usage: design audit <file.yml>');
    if (!existsSync(file)) fail(`not found: ${file}`);
    const res = parseIntent(readFileSync(file, 'utf8'));
    if (!res.ok) {
      console.error('✗ invalid intent:');
      res.errors?.forEach((e) => console.error(`   ${e}`));
      process.exit(1);
    }
const report = runQaGates(res.spec!);
    console.log(`LANTERN ARCHITECT QA REPORT — ${res.spec!.component}`);
    for (const c of report.checks) {
      const mark = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
      console.log(`  ${mark} ${c.name}: ${c.detail}`);
    }
    console.log(report.approved ? 'Status: ✅ APPROVED' : 'Status: 🔴 REJECTED');

    // Provenance root: record this gate verdict into the design audit chain.
    const sink = JsonlAgenticAuditSink.default();
    const block = sink.append({
      domain: 'design',
      stage: 'cornichon-architect',
      component: res.spec!.component,
      inputHash: hashInput(readFileSync(file, 'utf8')),
      gateVerdict: report.approved ? 'approved' : 'rejected',
      humanCheckpoint: 'not-required',
      summary: `${report.checks.filter((c) => c.status === 'reject').length} rejects`,
    });
    console.log(`  (audit block #${block.blockNumber} → ${block.currentHash.slice(0, 16)}…)`);

    process.exit(report.approved ? 0 : 1);
  }

  case 'approve': {
    const file = rest[0] ?? fail('usage: design approve <file.yml> --by <pickle-name> [--note "..."] [--reject] [--advisory]');
    if (!existsSync(file)) fail(`not found: ${file}`);
    const byIdx = rest.indexOf('--by');
    if (byIdx === -1 || !rest[byIdx + 1]) {
      fail(`approve requires --by <pickle-name> — no hidden default identity (the "no silent default" rule)`);
    }
    const reviewer = rest[byIdx + 1];
    const noteIdx = rest.indexOf('--note');
    const note = noteIdx !== -1 ? (rest[noteIdx + 1] ?? '') : '';
    const decision = rest.includes('--reject') ? 'rejected' : 'approved';
    const scope = rest.includes('--advisory') ? 'advisory' : 'canon-change';

    const res = parseIntent(readFileSync(file, 'utf8'));
    if (!res.ok) fail(`cannot approve an invalid spec: ${res.errors?.join('; ')}`);

    const block = approveSpec({ file, reviewer, decision, scope, note });
    console.log(`${decision === 'approved' ? '✅' : '🔴'} ${decision.toUpperCase()} — ${res.spec!.component}`);
    console.log(`   by ${reviewer} · scope ${scope} · block #${block.blockNumber} → ${block.currentHash.slice(0, 16)}…`);
    process.exit(decision === 'approved' ? 0 : 1);
  }

  case 'create': {
    const name = rest[0] ?? fail('usage: design create <ComponentName>');
    const out = `# Intent draft for ${name} — fill narrative (Dillpickle Narrator), then: pnpm design audit <file>
component: ${name}
narrative: |
  <who needs this, what human need it serves, how spoons shape it>
constraints:
  accessibility: { wcag: AAA, contrast: 7, touchTarget: 48 }
  spoonAware: true
  performance: { bundle: 3, renderTime: 16.67 }
  loveSemantics: []
variants: []
interactions: []
`;
    const dest = `${name.toLowerCase()}.design.yml`;
    writeFileSync(dest, out);
    console.log(`✓ drafted ${dest}`);
    break;
  }

  case 'variant': {
    const file = rest[0] ?? fail('usage: design variant <file.yml> [--celebration|--spoons=N]');
    const flags = rest.slice(1);
    const src = parseIntent(readFileSync(file, 'utf8'));
    if (!src.ok) fail(`invalid base intent: ${src.errors?.join('; ')}`);
    const clone = structuredClone(src.spec!);
    if (flags.includes('--celebration')) {
      // canon: spoon 4–5 celebration vibes
      clone.interactions.push({ event: 'enter', condition: 'spoonLevel >= 4', action: 'glow-pulse', motion: 'fast' });
      clone.narrative += '\n\nVariant: celebration emphasis at spoons 4–5.';
    }
    const spoonsFlag = flags.find((f) => f.startsWith('--spoons='));
    if (spoonsFlag) clone.constraints.spoonAware = [Number(spoonsFlag.split('=')[1])];
    console.log(JSON.stringify(clone, null, 2));
    break;
  }

  default:
    console.log('p31 design — commands: list | audit <file> | create <Name> | variant <file>');
}
