/**
 * generate — compile a DomainSpec into the full conformant artifact set.
 *
 * Outputs (relative to the target dir):
 *   constitution.json          the 0.3.0 constitution
 *   runbooks/RUNBOOK-*.md      a stub per gate (six-section template)
 *   scripts/nc/*.mjs           a failing NC stub per gate (STUB_NOT_IMPLEMENTED)
 *   fleet.json                 the extracted enforcement-moment registrations
 *   tests/{domain}.test.ts     a scaffold that asserts the constitution validates
 *
 * The generated gates are OBSERVATIONAL by default. Generated NCs exit 1 with
 * STUB_NOT_IMPLEMENTED — never NEGATIVE_CONTROL_OK — so the domain starts as
 * DECLARED (audit fails honestly), not GOVERNED.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { DomainSpec } from './spec.js';
import { Constitution, SCHEMA_URI } from './constitution.js';

export interface GenerateOptions {
  targetDir: string;
  dryRun?: boolean;
  /** Write runbook stubs for gates that request it. */
  writeRunbooks?: boolean;
  /** Write NC stubs for gates that request it. */
  writeNegativeControls?: boolean;
  /** Write the test scaffold. */
  writeTests?: boolean;
}

export interface GenerateResult {
  constitutionPath: string;
  constitution: Constitution;
  files: string[];
}

function hasBlocking(spec: DomainSpec): boolean {
  return spec.gates.some((g) => (g.state ?? 'OBSERVATIONAL') === 'BLOCKING');
}

export function specToConstitution(spec: DomainSpec): Constitution {
  const blocking = hasBlocking(spec);

  // The four-party K₄ is required if any gate is BLOCKING. Enforce it at
  // generation time (the validator would reject otherwise).
  let who: Constitution['review']['who'];
  if (blocking) {
    if (!spec.review.fourParty) {
      throw new Error(
        `spec error: domain "${spec.domain}" declares a BLOCKING gate but no four-party review. ` +
          `Add review.fourParty { user, issuer, ledger, court }.`,
      );
    }
    who = spec.review.fourParty;
  } else {
    if (spec.review.fourParty) {
      who = spec.review.fourParty;
    } else if (spec.review.singleOwner && spec.review.singleOwner.length > 0) {
      who = spec.review.singleOwner;
    } else {
      throw new Error(`spec error: domain "${spec.domain}" has no review.who — declare fourParty or singleOwner.`);
    }
  }

  const gates = spec.gates.map((g) => ({
    id: g.id,
    command: g.command,
    state: g.state ?? 'OBSERVATIONAL',
    owner: g.owner,
    scope: g.scope,
    remediation: g.remediation,
    negativeControl: {
      type: 'fixture' as const,
      command: `scripts/nc/${g.id}.mjs`,
      expected: 'proof-marker' as const,
    },
    enforcementMoment: g.enforcementMoment ?? 'ci',
    oqe: g.oqe,
  }));

  const runbooks = gates
    .filter((g) => g.remediation.startsWith('runbooks/RUNBOOK-'))
    .map((g) => ({
      id: g.remediation.replace(/^runbooks\//, '').replace(/\.md$/, ''),
      path: g.remediation,
      owner: g.owner,
      lastVerified: new Date().toISOString().slice(0, 10),
    }));

  const ratchets = (spec.ratchets ?? []).map((r) => ({
    id: r.id,
    baseline: r.baseline,
    countSource: r.countSourceArgs && r.countSourceArgs.length
      ? `${r.countSource} ${r.countSourceArgs.join(' ')}`
      : r.countSource,
    lockThreshold: r.lockThreshold,
  }));

  const aspirational = [...(spec.aspirational ?? [])];
  if (spec.gates.some((g) => g.generateNegativeControl)) {
    aspirational.push(
      `Negative controls for gates ${spec.gates
        .filter((g) => g.generateNegativeControl)
        .map((g) => g.id)
        .join(', ')} are generated stubs that fail with STUB_NOT_IMPLEMENTED. ` +
        `Replace each stub with a real control that emits NEGATIVE_CONTROL_OK, or the gate remains furniture.`,
    );
  }

  return {
    schema: SCHEMA_URI,
    domain: spec.domain,
    version: spec.version,
    genesisTimestamp: spec.genesisTimestamp,
    canonicalSource: spec.canonicalSource,
    mirrors: spec.mirrors,
    gates,
    ratchets,
    runbooks,
    lessons: spec.lessons ?? [],
    fleet: gates.map((g) => ({ rule: g.id, moment: g.enforcementMoment })),
    review: {
      who,
      cadence: spec.review.cadence,
      onFailure: spec.review.onFailure,
      abdication: spec.review.abdication,
    },
    auditLog: spec.auditLog ?? { chainName: spec.domain, sink: 'jsonl-hash-chain' },
    aspirational,
  };
}

const RUNBOOK_TEMPLATE = (id: string, description: string, command: string) => `# ${id}

## When to use

${description}

## Prerequisites

- You can run the gate command: \`${command}\`.

## Steps

1. Run the gate: \`${command}\`.
2. Read the failure output.
3. Fix the artefact — never weaken the gate.

## How to verify

\`${command}\` exits 0.

## Common pitfalls

- **TODO**: fill in from the first real incident. Every mistake made once
  becomes a warning here.

## Owner + last verified

\`Owner: <fill in>\` · \`Last verified: <fill in>\`
`;

const NC_STUB = (id: string, command: string) => `#!/usr/bin/env node
/**
 * Negative control for the \`${id}\` gate — GENERATED STUB.
 *
 * This stub FAILS with STUB_NOT_IMPLEMENTED. It does not exercise the gate.
 * Replace it with a fixture or mutation that makes the real gate
 * (\`${command}\`) exit non-zero, then emit \`NEGATIVE_CONTROL_OK\`.
 *
 * Until then, the gate is FURNITURE — the self-test will report it.
 */
console.error('STUB_NOT_IMPLEMENTED: replace this with a real negative control.');
process.exit(1);
`;

const TEST_SCAFFOLD = (domain: string) => `/**
 * ${domain} — constitution validation test.
 * Generated scaffold. Replace with behavior tests as the domain matures.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateConstitution } from '@p31ca/govern';

const here = dirname(fileURLToPath(import.meta.url));
const constitution = JSON.parse(readFileSync(join(here, '..', 'constitution.json'), 'utf8'));

test('${domain}: constitution validates against schema 0.3.0', () => {
  const r = validateConstitution(constitution);
  assert.equal(r.valid, true, r.violations.join('\\n'));
});
`;

export function generate(spec: DomainSpec, opts: GenerateOptions): GenerateResult {
  const root = resolve(opts.targetDir);
  const files: string[] = [];

  const constitution = specToConstitution(spec);
  const constitutionPath = resolve(root, 'constitution.json');

  // The stub-aspirational claim is only honest while the NCs are actually
  // stubs. If every negative-control file already exists (real control), drop
  // the auto-generated claim so the constitution does not lie after regen.
  if (opts.writeNegativeControls) {
    const pendingStubs = spec.gates
      .filter((g) => g.generateNegativeControl)
      .filter((g) => !existsSync(resolve(root, 'scripts', 'nc', `${g.id}.mjs`)));
    if (pendingStubs.length === 0) {
      constitution.aspirational = constitution.aspirational.filter(
        (a) => !a.includes('generated stubs that fail with STUB_NOT_IMPLEMENTED'),
      );
    }
  }

  const write = (path: string, content: string) => {
    files.push(path);
    if (!opts.dryRun) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    }
  };

  write(constitutionPath, JSON.stringify(constitution, null, 2) + '\n');

  if (opts.writeRunbooks) {
    for (const g of spec.gates) {
      if (!g.generateRunbook) continue;
      if (!g.remediation.startsWith('runbooks/RUNBOOK-')) continue;
      const p = resolve(root, g.remediation);
      if (existsSync(p)) continue; // never overwrite a human-authored runbook
      write(p, RUNBOOK_TEMPLATE(g.remediation.split('/').pop()!.replace(/\.md$/, ''), g.description, g.command));
    }
  }

  if (opts.writeNegativeControls) {
    for (const g of spec.gates) {
      if (!g.generateNegativeControl) continue;
      const p = resolve(root, 'scripts', 'nc', `${g.id}.mjs`);
      if (existsSync(p)) continue; // never overwrite a real NC
      write(p, NC_STUB(g.id, g.command));
    }
  }

  if (opts.writeTests) {
    write(resolve(root, 'tests', `${spec.domain}.test.ts`), TEST_SCAFFOLD(spec.domain));
  }

  // The fleet registration is derived from the constitution — always regenerated.
  write(
    resolve(root, 'fleet.json'),
    JSON.stringify({ domain: spec.domain, registrations: constitution.fleet }, null, 2) + '\n',
  );

  return { constitutionPath, constitution, files };
}