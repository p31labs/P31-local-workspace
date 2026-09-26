#!/usr/bin/env node
/**
 * p31 design CLI — agentic design system entry point.
 *   design list                 validate + tabulate all bundled intents
 *   design audit <file.yml>     parse + run Opus gates, exit 1 on reject
 *   design create <Name>        scaffold an intent draft
 *   design variant <file.yml>   emit a derived variant spec to stdout
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseIntent, summarize } from './intent/parser';
import { runQaGates } from './qa/gates';
import { loadExampleSpecs } from './orchestrate';

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
    const file = rest[0] ?? fail('usage: design audit <file.yml>');
    if (!existsSync(file)) fail(`not found: ${file}`);
    const res = parseIntent(readFileSync(file, 'utf8'));
    if (!res.ok) {
      console.error('✗ invalid intent:');
      res.errors?.forEach((e) => console.error(`   ${e}`));
      process.exit(1);
    }
    const report = runQaGates(res.spec!);
    console.log(`OPUS QA REPORT — ${res.spec!.component}`);
    for (const c of report.checks) {
      const mark = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
      console.log(`  ${mark} ${c.name}: ${c.detail}`);
    }
    console.log(report.approved ? 'Status: ✅ APPROVED' : 'Status: 🔴 REJECTED');
    process.exit(report.approved ? 0 : 1);
  }

  case 'create': {
    const name = rest[0] ?? fail('usage: design create <ComponentName>');
    const out = `# Intent draft for ${name} — fill narrative (Gemini), then: pnpm design audit <file>
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
