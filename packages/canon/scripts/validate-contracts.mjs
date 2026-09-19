#!/usr/bin/env node
/**
 * @p31/canon — validate-contracts.mjs
 *
 * THE contract ghost gate. Every *.contract.ts under src/contracts/
 * must:
 *   1. Import cleanly (no syntax errors, no missing deps)
 *   2. Export exactly one *Contract value that satisfies the schema
 *   3. Reference REAL source paths in `sources` (ghost gate — hard fail)
 *   4. Declare tokens in the p31.* namespace AND resolve in DTCG (hard fail)
 *   5. Have a name that matches its file stem
 *   6. If status='shipped', the importStatement package must be installed
 *
 * Runs as part of `npm run build`. Also usable standalone in CI.
 *
 * TESTING NOTE: When testing the status gate by editing a contract file,
 * String.replace() only replaces the FIRST occurrence. If the contract has
 * `status: 'planned'` in both a JSDoc comment and the field, .replace() hits
 * the comment and leaves the field unchanged. Use .replaceAll() or sed, and
 * ALWAYS grep the file after modification to confirm the field changed.
 * This was diagnosed the hard way — don't chase ESM cache phantoms.
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const workspaceRoot = resolve(root, '..', '..');
const contractsDir = join(root, 'src', 'contracts');
const dtcgPath = join(root, 'tokens', 'tokens.dtc.json');

if (!existsSync(contractsDir)) {
  console.error(`\ncanon validate-contracts: ${contractsDir} missing.\n`);
  process.exit(1);
}

const { ComponentContractSchema } = await import(join(contractsDir, 'schema.ts'));

/** Walk a DTCG object and collect every leaf token path + value. */
function walkTokens(node, prefix = [], out = new Map()) {
  if (!node || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node)) {
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, '$value')) {
      out.set([...prefix, key].join('.'), value.$value);
    } else if (value && typeof value === 'object') {
      walkTokens(value, [...prefix, key], out);
    }
  }
  return out;
}

let dtcgTokens = new Map();
try {
  const dtcg = JSON.parse(readFileSync(dtcgPath, 'utf8'));
  dtcgTokens = walkTokens(dtcg);
} catch {
  // Missing/invalid DTCG is not a contract failure — token resolution
  // is a Phase 1e hard gate. Emit nothing here.
}

const errors = [];
const validated = [];

for (const entry of readdirSync(contractsDir)) {
  if (!entry.endsWith('.contract.ts')) continue;
  const filePath = join(contractsDir, entry);
  const stem = basename(entry, '.contract.ts');

  let mod;
  try {
    mod = await import(filePath);
  } catch (err) {
    errors.push(`${entry}: import failed — ${err.message}`);
    continue;
  }

  const exportNames = Object.keys(mod).filter((k) => k.endsWith('Contract'));
  if (exportNames.length !== 1) {
    errors.push(
      `${entry}: expected exactly one *Contract export, found ${exportNames.length} (${exportNames.join(', ') || 'none'})`,
    );
    continue;
  }

  const contract = mod[exportNames[0]];
  const parseResult = ComponentContractSchema.safeParse(contract);
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((i) => `    - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    errors.push(`${entry}: schema validation failed\n${issues}`);
    continue;
  }

  // Ghost gate: every source pointer must resolve on disk.
  for (const src of contract.sources) {
    const target = join(root, src.path);
    if (!existsSync(target)) {
      errors.push(`${entry}: source pointer ghost — ${src.kind} → ${src.path} does not exist`);
    }
  }

  // importStatement must be a well-formed import string.
  const stmt = contract.importStatement.trim();
  if (!/^import\s+.+from\s+['"][^'"]+['"];?$/.test(stmt)) {
    errors.push(`${entry}: importStatement is not a well-formed import — "${stmt}"`);
  }

  // status: 'shipped' gate — if a contract claims the component exists,
  // the importStatement package must actually be installed.
  if (contract.status === 'shipped') {
    // Capture only the package ROOT, never a subpath. `@p31/canon/contracts`
    // must resolve `@p31/canon` (which is installed), not
    // `@p31/canon/contracts` (which is a subdir, never a package). The old
    // greedy `[^'"]+` captured the whole subpath and false-positived a hard
    // fail against a package that WAS installed.
    const pkgMatch = stmt.match(/from ['"]((?:@[^/'"]+\/)?[^/'"]+)['"]/);
    const pkg = pkgMatch?.[1];
    if (pkg && !existsSync(join(workspaceRoot, 'node_modules', pkg))) {
      errors.push(
        `${entry}: status is 'shipped' but importStatement package "${pkg}" is not installed — ` +
        `either install the package or set status: 'planned'`,
      );
    }
  }

  // Token namespace + resolution — HARD GATE.
  // A contract that references a token which does not exist in the DTCG tree
  // is a contract that lies. The whole point of this file is to make lies fatal.
  for (const tok of contract.tokenContract) {
    if (!tok.startsWith('p31.')) {
      errors.push(`${entry}: token "${tok}" is outside the p31.* namespace`);
    } else if (!dtcgTokens.has(tok)) {
      errors.push(
        `${entry}: token "${tok}" does not resolve in tokens/tokens.dtc.json — ` +
        `add it to SEMANTIC_MAP in src/theming/theme-store.ts (or remove the reference)`,
      );
    }
  }

  if (contract.name.toLowerCase() !== stem.replace(/[^a-z0-9]/gi, '').toLowerCase()) {
    errors.push(`${entry}: contract.name "${contract.name}" does not match file stem "${stem}"`);
  }

  // ── interactionStates shape gate ─────────────────────────
  // The record-of-observables shape is required. A contract that
  // still carries the legacy array shape (string[]) must be
  // migrated before it can ship — a harness cannot derive
  // assertions from names alone.
  // Fixture contents (keys ⊆ declared props, value types, required
  // props present) are enforced by ComponentContractSchema.superRefine
  // (schema.ts) — this script only rejects the un-migratable shape so
  // the migrate instruction is easy to reach.
  if (Array.isArray(contract.interactionStates)) {
    errors.push(
      `${entry}: interactionStates is still the legacy array shape. ` +
      `Run: node scripts/migrate-contract.mjs ${entry}`,
    );
  }

  // ── caveat field gate ────────────────────────────────────
  // Any caveat with an unresolved field path is a lie. The field
  // must resolve to a real key in the contract.
  for (const c of contract.caveats ?? []) {
    const path = c.field.split('.');
    let cursor = contract;
    let resolved = true;
    for (const seg of path) {
      cursor = cursor?.[seg];
      if (cursor === undefined) {
        errors.push(`${entry}: caveat field "${c.field}" does not resolve in the contract`);
        resolved = false;
        break;
      }
    }
    if (resolved && typeof c.since !== 'string') {
      errors.push(`${entry}: caveat "${c.field}" has no since date (YYYY-MM-DD)`);
    }
  }

  validated.push({ file: entry, name: contract.name, props: contract.props.length });
}

if (errors.length > 0) {
  console.error('\ncanon validate-contracts: contract gate FAILED.\n');
  for (const e of errors) console.error(`   • ${e}`);
  console.error(
    '\n   Contracts are the interface. A contract that lies about props, tokens,\n' +
      '   or sources is worse than no contract at all. Fix the contract or the file.\n',
  );
  process.exit(1);
}

console.log(`canon contracts: ${validated.length} validated, ${dtcgTokens.size} tokens in DTCG.`);
for (const v of validated) {
  console.log(`   • ${v.name} (${v.props} props)`);
}