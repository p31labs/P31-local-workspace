#!/usr/bin/env node
/**
 * docs-audit — validate the Loom's doc corpus against the code it describes.
 *
 * The mirror of port-audit: port-audit validates code -> manifest;
 * docs-audit validates docs -> code. Same discipline, other half.
 *
 * Walks every .md in apps/loom/docs/ and apps/loom/README.md, extracts:
 *   - markdown links [text](path)               -> does the target exist?
 *   - code refs `path/file.ts:NNN`              -> does the path exist, is NNN <= EOF?
 *   - token names in prose (--p31-*)            -> are they in P31TokenName?
 *   - count claims ("N e2e", "N unit")          -> do they match the repo?
 *   - "Related Documents" section + reciprocity
 *
 * Exit codes:
 *   0  — no failures
 *   1  — a FAILURE (broken path, dead line number, unknown token, audit could
 *        not run). The build should gate on this.
 *
 * WARNINGS (non-reciprocal links, count drift, missing Related section) are
 * reported in the inventory and never fail. Broken references are
 * unambiguous; reciprocity churn is a softer judgment.
 *
 * Usage:
 *   node apps/loom/scripts/docs-audit.mjs
 *   node apps/loom/scripts/docs-audit.mjs --out apps/loom/docs/DOCS_INVENTORY.md
 *   node apps/loom/scripts/docs-audit.mjs --json
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOOM_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MONOREPO = dirname(dirname(LOOM_ROOT));
const DOCS_DIR = join(LOOM_ROOT, 'docs');
const README = join(LOOM_ROOT, 'README.md');
const TOKENS_TS = join(MONOREPO, 'packages/canon/src/tokens.ts');
const E2E_DIR = join(LOOM_ROOT, 'e2e');

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : null;
const AS_JSON = argv.includes('--json');

// ── Inputs ──────────────────────────────────────────────────────────────────
// Generated files are mirrors of the repo, not authored docs — scanning them
// would double-count and flag the canon baseline's tokens. Skip them.
const GENERATED = ['PORTING_INVENTORY.md', 'DOCS_INVENTORY.md'];

// Paths that are intentionally not source files on disk:
//   - events.seed.json          a build-time asset served at /events.seed.json
//   - base.css, chapters.css, chrome.css, companion.css  the DECISIONS 005
//     "if index.css crosses ~2000 lines, split by layer into ..." hypotheticals
const KNOWN_RUNTIME_OR_FUTURE = new Set([
  'events.seed.json',
  'base.css',
  'chapters.css',
  'chrome.css',
  'companion.css',
]);

const DOC_FILES = [
  README,
  ...(existsSync(DOCS_DIR)
    ? readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md') && !GENERATED.includes(f)).map((f) => join(DOCS_DIR, f))
    : []),
].filter(existsSync);

function readTokenNames() {
  if (!existsSync(TOKENS_TS)) return new Set();
  const ts = readFileSync(TOKENS_TS, 'utf8');
  const names = new Set();
  for (const m of ts.matchAll(/'(--p31-[a-z0-9-]+)'/g)) names.add(m[1]);
  return names;
}

function countE2eTests() {
  if (!existsSync(E2E_DIR)) return 0;
  let n = 0;
  for (const f of readdirSync(E2E_DIR).filter((f) => f.endsWith('.spec.ts'))) {
    const text = readFileSync(join(E2E_DIR, f), 'utf8');
    // (?<!\.)test( — matches test( but not test.beforeEach(/describe(/use(/skip(
    // (indented, e.g. inside a parametrized for-loop, still counts).
    for (const _ of text.matchAll(/(?<!\.)test\(/g)) n++;
  }
  return n;
}

const tokenNames = readTokenNames();
const counts = { e2e: countE2eTests(), e2eFiles: countFiles(E2E_DIR, '.spec.ts') };

function countFiles(dir, ext) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith(ext)).length;
}

// ── Extraction ─────────────────────────────────────────────────────────────────
const failures = [];
const warnings = [];
const perFile = [];

function rel(p) {
  return relative(MONOREPO, p);
}

function fileLineCount(p) {
  if (!existsSync(p)) return 0;
  return readFileSync(p, 'utf8').split('\n').length;
}

function checkLink(fromFile, target, line) {
  const candidates = [join(dirname(fromFile), target), join(MONOREPO, target), join(LOOM_ROOT, target)];
  if (candidates.some(existsSync)) return;
  failures.push({ file: rel(fromFile), line, kind: 'broken-link', detail: target });
}

function checkCodeRef(fromFile, path, lineNum, line) {
  if (KNOWN_RUNTIME_OR_FUTURE.has(path)) return;
  const candidates = [
    join(dirname(fromFile), path),
    join(LOOM_ROOT, 'src', path),
    join(MONOREPO, path),
    join(LOOM_ROOT, path),
  ];
  const found = candidates.find(existsSync);
  if (!found) {
    failures.push({ file: rel(fromFile), line, kind: 'broken-path', detail: path });
    return;
  }
  const eof = fileLineCount(found);
  if (lineNum > eof) {
    failures.push({ file: rel(fromFile), line, kind: 'dead-line', detail: `${path}:${lineNum} (EOF ${eof})` });
  }
}

for (const file of DOC_FILES) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const fileReport = {
    file: rel(file),
    links: 0,
    codeRefs: 0,
    tokens: 0,
    hasRelatedSection: false,
  };

  lines.forEach((text, i) => {
    const line = i + 1;

    // [text](path) — skip URLs, anchors-only.
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)#][^)]*)\)/g)) {
      const target = m[1].trim();
      if (/^https?:\/\//.test(target)) continue;
      fileReport.links++;
      checkLink(file, target.split('#')[0], line);
    }

    // `path/file.ext:NNN` in backticks.
    for (const m of text.matchAll(/`([a-zA-Z0-9_./-]+\.(?:ts|tsx|css|md|json|mjs))(?::(\d+))?`/g)) {
      fileReport.codeRefs++;
      checkCodeRef(file, m[1], m[2] ? parseInt(m[2], 10) : 1, line);
    }

    // --p31-* tokens in prose. Strip backtick spans and fenced code blocks
    // first — a doc mentioning `--p31-layout-spacing-*` as a pattern example
    // is not claiming the token exists.
    const prose = text.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
    for (const m of prose.matchAll(/(--p31-[a-z0-9-]+)/g)) {
      fileReport.tokens++;
      if (!tokenNames.has(m[1])) {
        failures.push({ file: rel(file), line, kind: 'unknown-token', detail: m[1] });
      }
    }

    // Count claims: "N e2e".
    const e2e = text.match(/(\d+)\s+e2e/);
    if (e2e && parseInt(e2e[1], 10) !== counts.e2e) {
      warnings.push({
        file: rel(file),
        line,
        kind: 'count-drift',
        detail: `claims ${e2e[1]} e2e; repo has ${counts.e2e}`,
      });
    }
  });

  fileReport.hasRelatedSection = /^##\s+Related Documents/m.test(text);
  if (!fileReport.hasRelatedSection && !file.endsWith('PORTING_INVENTORY.md') && !file.endsWith('DOCS_INVENTORY.md')) {
    warnings.push({ file: rel(file), line: 1, kind: 'no-related-section', detail: 'missing "Related Documents"' });
  }

  perFile.push(fileReport);
}

// ── Reciprocity ─────────────────────────────────────────────────────────────
const linksByFile = new Map();
for (const file of DOC_FILES) {
  const text = readFileSync(file, 'utf8');
  const out = new Set();
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)#]+)\.md(?:#[\w-]+)?\)/g)) {
    out.add(m[1].split('/').pop());
  }
  linksByFile.set(rel(file).split('/').pop(), out);
}
for (const [from, targets] of linksByFile) {
  for (const t of targets) {
    const back = linksByFile.get(t);
    if (back && !back.has(from)) {
      warnings.push({ file: from, line: 0, kind: 'non-reciprocal', detail: `-> ${t}` });
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
if (AS_JSON) {
  const out = JSON.stringify(
    { generatedAt: new Date().toISOString(), fileCount: DOC_FILES.length, counts, failures, warnings, perFile },
    null,
    2,
  );
  if (OUT) writeFileSync(OUT, out);
  else console.log(out);
  process.exit(failures.length ? 1 : 0);
}

const md = [];
md.push('<!-- GENERATED by scripts/docs-audit.mjs — do not edit by hand. Re-run');
md.push('     `pnpm --filter @p31/loom docs-audit` to regenerate. -->');
md.push('');
md.push(`# Docs inventory — ${new Date().toISOString()}`);
md.push('');
md.push(`Scanned **${DOC_FILES.length} docs**. Repo counts: **${counts.e2e} e2e** across ${counts.e2eFiles} spec files.`);
md.push('');

md.push(`## Failures (${failures.length})`);
if (failures.length === 0) md.push('None. Every link, code ref, and token name resolves.');
else for (const f of failures) md.push(`- \`${f.file}:${f.line}\` **${f.kind}** — ${f.detail}`);
md.push('');

md.push(`## Warnings (${warnings.length})`);
if (warnings.length === 0) md.push('None.');
else for (const w of warnings) md.push(`- \`${w.file}:${w.line}\` **${w.kind}** — ${w.detail}`);
md.push('');

md.push('## Per-document');
md.push('| Doc | Links | Code refs | Tokens | Related Documents |');
md.push('|---|---|---|---|---|');
for (const f of perFile) {
  md.push(`| \`${f.file}\` | ${f.links} | ${f.codeRefs} | ${f.tokens} | ${f.hasRelatedSection ? '✓' : '—'} |`);
}
md.push('');

const out = md.join('\n');
if (OUT) {
  writeFileSync(OUT, out);
  console.error(`wrote ${OUT} (${out.length} bytes)`);
} else {
  console.log(out);
}
process.exit(failures.length ? 1 : 0);