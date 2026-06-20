#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, relative, resolve, extname, basename } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = '/home/p31/P31-local-workspace';
const STATE_PATH = '/tmp/phos-cartographer-state.json';
const INDEX_PATH = '/tmp/phos-cartographer-index.json';

const EXTENSIONS = new Set(['.mjs', '.js', '.ts', '.jsx', '.tsx', '.astro', '.py', '.json']);

const STOP_WORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'import', 'export', 'from', 'default', 'async', 'await', 'new', 'try',
  'catch', 'throw', 'this', 'class', 'extends', 'typeof', 'instanceof',
  'true', 'false', 'null', 'undefined', 'void', 'delete', 'switch', 'case',
  'break', 'continue', 'do', 'in', 'of', 'with', 'yield', 'static', 'get',
  'set', 'and', 'or', 'not', 'is', 'def', 'if', 'elif', 'else', 'pass',
  'lambda', 'yield', 'global', 'nonlocal', 'raise', 'finally', 'except',
  'as', 'assert', 'self', 'type', 'interface', 'enum', 'module', 'declare',
  'number', 'string', 'boolean', 'any', 'void', 'never', 'unknown',
]);

const DEFAULT_PATHS = [
  'tools/phos-forge',
  'software/p31-dashboard/src',
  'scripts',
];

const DEFAULT_QUERY_PATHS = [
  'tools/phos-forge',
  'software/p31-dashboard/src',
  'scripts',
];

let index = null;
let mappingCache = null;

function isSourceFile(p) {
  return EXTENSIONS.has(extname(p).toLowerCase());
}

function walkDir(dir, maxDepth = 5, depth = 0) {
  if (depth > maxDepth) return [];
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const e of entries) {
      if (e.startsWith('.') || e === 'node_modules' || e === 'dist' || e === '.git') continue;
      const full = resolve(dir, e);
      try {
        const st = statSync(full);
        if (st.isDirectory()) results.push(...walkDir(full, maxDepth, depth + 1));
        else if (st.isFile() && isSourceFile(full)) results.push(full);
      } catch {}
    }
  } catch {}
  return results;
}

function tokenize(text) {
  if (!text) return [];
  const tokens = [];
  const raw = text.replace(/\/\/.*$/gm, '').replace(/#.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const words = raw.match(/[a-zA-Z_]\w*/g) || [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (STOP_WORDS.has(lower) || lower.length < 2) continue;
    const parts = lower.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|_/g);
    for (const p of parts) {
      const t = p.replace(/_/g, '').toLowerCase();
      if (t.length >= 2 && !STOP_WORDS.has(t)) tokens.push(t);
    }
  }
  return tokens;
}

function extractImports(content, ext) {
  const imports = [];
  if (ext === '.mjs' || ext === '.js' || ext === '.ts') {
    const m = content.matchAll(/import\s+(?:[\w*{},]\s+from\s+)?['"](.+)['"]/g);
    for (const match of m) imports.push(match[1]);
    const r = content.matchAll(/require\(['"](.+)['"]\)/g);
    for (const match of r) imports.push(match[1]);
  }
  if (ext === '.py') {
    const m = content.matchAll(/(?:from\s+(\S+)\s+)?import\s+(\S+)/g);
    for (const match of m) imports.push(match[1] || match[2]);
  }
  return imports;
}

function extractExports(content, ext) {
  const exports = [];
  if (ext === '.mjs' || ext === '.js' || ext === '.ts') {
    const m = content.matchAll(/export\s+(?:default\s+)?(?:function|const|let|var|class|async\s+function)\s+(\w+)/g);
    for (const match of m) exports.push(match[1]);
    const dm = content.matchAll(/export\s+default\s+(\w+)/g);
    for (const match of dm) exports.push(match[1]);
  }
  if (ext === '.py') {
    const m = content.matchAll(/^def\s+(\w+)|^class\s+(\w+)/gm);
    for (const match of m) exports.push(match[1] || match[2]);
  }
  return exports;
}

function buildDoc(path, content) {
  const ext = extname(path);
  const tokens = tokenize(content);
  const termFreq = {};
  for (const t of tokens) termFreq[t] = (termFreq[t] || 0) + 1;
  const imports = extractImports(content, ext);
  const exports = extractExports(content, ext);
  return {
    path: relative(WORKSPACE, path),
    ext,
    total_terms: tokens.length,
    unique_terms: Object.keys(termFreq).length,
    termFreq,
    imports,
    exports,
    size: content.length,
    indexed: new Date().toISOString(),
  };
}

export function buildIndex(paths = null) {
  const searchPaths = paths || DEFAULT_PATHS.map(p => resolve(WORKSPACE, p));
  const files = [];
  for (const p of searchPaths) {
    if (existsSync(p)) files.push(...walkDir(p));
  }

  const docs = {};
  const docCount = {};
  let totalDocs = 0;

  for (const f of files) {
    try {
      const content = readFileSync(f, 'utf-8');
      const doc = buildDoc(f, content);
      if (doc.total_terms < 5) continue;
      docs[doc.path] = doc;
      totalDocs++;
      for (const t of Object.keys(doc.termFreq)) {
        docCount[t] = (docCount[t] || 0) + 1;
      }
    } catch {}
  }

  const idf = {};
  for (const [term, count] of Object.entries(docCount)) {
    idf[term] = Math.log((totalDocs + 1) / (count + 1)) + 1;
  }

  index = { docs, idf, totalDocs, built: new Date().toISOString() };
  persist();
  return index;
}

function persist() {
  if (!index) return;
  try {
    const serializable = {
      totalDocs: index.totalDocs,
      built: index.built,
      idf: index.idf,
    };
    writeFileSync(INDEX_PATH, JSON.stringify(serializable));
    const summary = {};
    for (const [path, doc] of Object.entries(index.docs)) {
      summary[path] = {
        ext: doc.ext, total_terms: doc.total_terms,
        unique_terms: doc.unique_terms,
        imports: doc.imports.length, exports: doc.exports.length,
        size: doc.size, indexed: doc.indexed,
      };
    }
    writeFileSync(STATE_PATH, JSON.stringify({ summary, totalDocs: index.totalDocs, built: index.built }, null, 2));
  } catch {}
}

function loadIndex() {
  if (index) return index;
  try {
    if (!existsSync(INDEX_PATH)) return null;
    const data = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
    // Rebuild full index from scratch if we need the docs
    return null;
  } catch { return null; }
}

function ensureIndex() {
  if (!index) {
    const loaded = loadIndex();
    if (loaded) index = loaded;
    else buildIndex();
  }
  return index;
}

function tfidfVec(termFreq, totalTerms, idf) {
  const vec = {};
  for (const [term, count] of Object.entries(termFreq)) {
    const tf = count / totalTerms;
    const idfVal = idf[term] || 1;
    vec[term] = tf * idfVal;
  }
  return vec;
}

function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function query(text, n = 10) {
  ensureIndex();
  const queryTokens = tokenize(text);
  if (queryTokens.length === 0) return [];
  const qTf = {};
  for (const t of queryTokens) qTf[t] = (qTf[t] || 0) + 1;
  const qVec = tfidfVec(qTf, queryTokens.length, index.idf);
  const scores = [];
  for (const [path, doc] of Object.entries(index.docs)) {
    const dVec = tfidfVec(doc.termFreq, doc.total_terms, index.idf);
    const sim = cosineSim(qVec, dVec);
    if (sim > 0) scores.push({ path, score: +sim.toFixed(4), ext: doc.ext, exports: doc.exports.slice(0, 5) });
  }
  return scores.sort((a, b) => b.score - a.score).slice(0, n);
}

export function findRelated(path, n = 10) {
  ensureIndex();
  const relPath = path.startsWith(WORKSPACE) ? relative(WORKSPACE, path) : path;
  const doc = index.docs[relPath];
  if (!doc) return [];
  const dVec = tfidfVec(doc.termFreq, doc.total_terms, index.idf);
  const scores = [];
  for (const [p, d] of Object.entries(index.docs)) {
    if (p === relPath) continue;
    const v = tfidfVec(d.termFreq, d.total_terms, index.idf);
    const sim = cosineSim(dVec, v);
    if (sim > 0) scores.push({ path: p, score: +sim.toFixed(4), ext: d.ext });
  }
  return scores.sort((a, b) => b.score - a.score).slice(0, n);
}

export function traceSymbol(symbol) {
  ensureIndex();
  const s = symbol.toLowerCase();
  const queryTokens = tokenize(s);
  const results = [];
  for (const [path, doc] of Object.entries(index.docs)) {
    const matches = [];
    for (const qt of queryTokens.length ? queryTokens : [s]) {
      if (doc.termFreq[qt]) matches.push(`term:${doc.termFreq[qt]}`);
    }
    if (doc.exports.some(e => e.toLowerCase() === s || queryTokens.some(qt => e.toLowerCase().includes(qt)))) matches.push('exported');
    if (doc.imports.some(i => i.toLowerCase().includes(s))) matches.push('imported');
    if (matches.length > 0) results.push({ path, matches, ext: doc.ext });
  }
  return results;
}

export function getIndex() {
  ensureIndex();
  return index;
}

export function getMap() {
  ensureIndex();
  const total = index.totalDocs;
  const byExt = {};
  for (const doc of Object.values(index.docs)) {
    byExt[doc.ext] = (byExt[doc.ext] || 0) + 1;
  }
  const topTerms = Object.entries(index.idf)
    .filter(([t, v]) => v < 2)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 20)
    .map(([t]) => t);
  return { total, byExt, top_terms: topTerms, built: index.built };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || 'status';

  if (cmd === 'index' || cmd === 'rebuild') {
    const specificPath = process.argv[3];
    const paths = specificPath ? [resolve(WORKSPACE, specificPath)] : null;
    const result = buildIndex(paths);
    const m = getMap();
    console.log(`Cartographer — index built`);
    console.log(`  Files indexed: ${m.total}`);
    console.log(`  By type:       ${Object.entries(m.byExt).map(([e, c]) => `${e}: ${c}`).join(', ')}`);
    console.log(`  Top terms:     ${m.top_terms.join(', ')}`);
  } else if (cmd === 'query') {
    const text = process.argv.slice(3).join(' ');
    if (!text) { console.error('Usage: phos cartographer query <text>'); process.exit(1); }
    const results = query(text, 15);
    if (results.length === 0) { console.log('No matches.'); process.exit(0); }
    console.log(`Query: "${text}"`);
    for (const r of results) {
      const exports = r.exports?.length ? ` [${r.exports.join(', ')}]` : '';
      console.log(`  ${(r.score * 100).toFixed(0).padStart(2)}%  ${r.path}${exports}`);
    }
  } else if (cmd === 'related') {
    const path = process.argv[3];
    if (!path) { console.error('Usage: phos cartographer related <file-path>'); process.exit(1); }
    const results = findRelated(path, 15);
    if (results.length === 0) { console.log('No related files found.'); process.exit(0); }
    console.log(`Related to: ${path}`);
    for (const r of results) {
      console.log(`  ${(r.score * 100).toFixed(0).padStart(2)}%  ${r.path}`);
    }
  } else if (cmd === 'trace') {
    const symbol = process.argv[3];
    if (!symbol) { console.error('Usage: phos cartographer trace <symbol>'); process.exit(1); }
    const results = traceSymbol(symbol);
    if (results.length === 0) { console.log(`No references to "${symbol}" found.`); process.exit(0); }
    console.log(`Symbol: "${symbol}" — ${results.length} references`);
    for (const r of results) {
      console.log(`  ${r.path}  (${r.matches.join(', ')})`);
    }
  } else if (cmd === 'status') {
    const m = getMap();
    console.log(`Cartographer — Semantic Codebase Map`);
    console.log(`  Files indexed: ${m.total}`);
    console.log(`  Last built:    ${m.built || 'never'}`);
    console.log(`  By type:       ${Object.entries(m.byExt || {}).map(([e, c]) => `${e}: ${c}`).join(', ')}`);
    console.log(`  Top terms:     ${(m.top_terms || []).join(', ')}`);
  } else {
    console.log(`PHOS Cartographer — Semantic Codebase Map

Indexes source files with TF-IDF vectors for semantic search.

Usage:
  phos cartographer status                Show index statistics
  phos cartographer index [path]          Build/rebuild index (default: phos-forge, dashboard, scripts)
  phos cartographer query "<text>"        Semantic search (find files by meaning)
  phos cartographer related <file>        Find files related to a given file
  phos cartographer trace <symbol>        Find all references to a symbol
`);
  }
}
