// _canonical.mjs — canonical-source loader for govern negative controls.
//
// The govern runtime runs `node <nc-command>`; an NC must exercise the REAL
// detection logic from its domain's canonical source. Those sources are
// TypeScript. Node 24 strips types natively, but TS files that use
// extensionless relative specifiers, mixed type/value import lists, or
// worker-only builtins (cloudflare:workers) do not load under plain node.
//
// This loader materializes each canonical .ts file into a build dir applying
// ONLY import-list normalization:
//   - relative specifiers are resolved and emitted as absolute file:// URLs
//   - type-only names in mixed import lists are elided (as tsc would)
//   - `cloudflare:workers` is redirected to a provided stub module
// No control flow or logic is altered — the real classes/functions run.
//
// SUPPORTED (loader handles): relative specifiers without extensions,
// `import type`/mixed type+value import lists, `cloudflare:workers` builtin.
//
// NOT SUPPORTED — Node's type-stripper refuses these (loader cannot help):
//   enum, namespace/module with runtime code, parameter properties,
//   `import =` aliases, decorators. These need `--experimental-transform-types`
//   or a real build step. The canonical sources must stay in the erasable
//   subset (TypeScript `erasableSyntaxOnly`) or the NCs will fail at load.
//
// NOT HANDLED (loader limitation — fails loudly, does not guess):
//   `export ... from` re-exports, dynamic `import()`, `declare module`
//   augmentation. If a canonical source adds these, extend the loader — do
//   not paper over it.
//
// Loader self-test: scripts/nc/loader-self-test.mjs exercises the supported
// constructs against a synthetic fixture and asserts load succeeds. Run it in
// CI so a Node type-stripping change fails the loader, not the NCs.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';

const MATERIALIZED = new Map();

const IMPORT_RE =
  /^[ \t]*import(?:[ \t]+type)?[ \t]+([\s\S]*?)[ \t]+from[ \t]+['"]([^'"]+)['"];?[ \t]*$/gm;

function typeOnlyExports(targetPath) {
  let text;
  try {
    text = readFileSync(targetPath, 'utf8');
  } catch {
    return new Set();
  }
  const names = new Set();
  const re = /export\s+(?:declare\s+)?(?:type|interface)\s+([A-Za-z_$][\w$]*)/g;
  for (const m of text.matchAll(re)) names.add(m[1]);
  return names;
}

// Drop names that are only types from a `{ a, b, type c }` import list.
function elideTypeNames(specList, targetPath) {
  const trimmed = specList.trim();
  if (!trimmed.startsWith('{')) return trimmed;
  const close = trimmed.lastIndexOf('}');
  if (close < 0) return trimmed;
  const typeOnly = typeOnlyExports(targetPath);
  const parts = trimmed
    .slice(1, close)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const kept = [];
  for (const part of parts) {
    if (/^type\s+/.test(part)) continue;
    const name = part.split(/\s+as\s+/)[0].trim();
    if (typeOnly.has(name)) continue;
    kept.push(part);
  }
  if (kept.length === 0) return null;
  return `{ ${kept.join(', ')} }`;
}

function rewrite(text, srcPath, cfStub) {
  const dir = path.dirname(srcPath);
  return text.replace(IMPORT_RE, (m, specList, spec) => {
    if (/^import\s+type/.test(m)) return m;
    if (spec.startsWith('./') || spec.startsWith('../')) {
      let target = path.resolve(dir, spec);
      if (!/\.(ts|tsx|mjs|js)$/.test(target)) {
        const cand = [target + '.ts', target + '.tsx'].find((c) => existsSync(c));
        if (!cand) throw new Error(`cannot resolve canonical import '${spec}' from ${srcPath}`);
        target = cand;
      }
      const newList = elideTypeNames(specList, target);
      const url = pathToFileURL(target).href;
      if (!newList) return `import '${url}';`;
      return `import ${newList} from '${url}';`;
    }
    if (spec === 'cloudflare:workers') {
      if (!cfStub) throw new Error(`'cloudflare:workers' import in ${srcPath} needs a stub`);
      const newList = elideTypeNames(specList, cfStub);
      const url = pathToFileURL(cfStub).href;
      if (!newList) return `import '${url}';`;
      return `import ${newList} from '${url}';`;
    }
    const url = import.meta.resolve(spec, pathToFileURL(srcPath).href);
    const newList = elideTypeNames(specList, srcPath);
    if (!newList) return `import '${url}';`;
    return `import ${newList} from '${url}';`;
  });
}

function materialize(srcPath, buildDir, cfStub) {
  const seen = new Set();
  const queue = [path.resolve(srcPath)];
  const outUrl = new Map();
  mkdirSync(buildDir, { recursive: true });
  while (queue.length) {
    const src = queue.shift();
    if (seen.has(src)) continue;
    seen.add(src);
    const text = rewrite(readFileSync(src, 'utf8'), src, cfStub);
    const tag = crypto.createHash('sha1').update(src).digest('hex').slice(0, 10);
    const base = path.basename(src).replace(/\.tsx?$/, '');
    const out = path.join(buildDir, `${base}.${tag}.ts`);
    writeFileSync(out, text);
    outUrl.set(src, pathToFileURL(out).href);
  }
  return outUrl.get(path.resolve(srcPath));
}

export async function loadCanonical(
  srcPath,
  { buildDir, cloudflareDurableObjectStub = null } = {}
) {
  const abs = path.resolve(srcPath);
  if (!MATERIALIZED.has(abs)) {
    MATERIALIZED.set(abs, materialize(abs, buildDir, cloudflareDurableObjectStub));
  }
  return import(MATERIALIZED.get(abs));
}