import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SOURCE = resolve(ROOT, 'apps/phos/public/.well-known/design-system.json');
const OUT = resolve(ROOT, 'schemas/tokens.dense.json');

if (!existsSync(SOURCE)) {
  console.error(`Source not found: ${SOURCE}`);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(SOURCE, 'utf-8'));
const srcBytes = Buffer.byteLength(JSON.stringify(raw));

function flattenTokens(obj, prefix = []) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === '$value') {
      const name = 'p31-' + prefix.join('-');
      result[name] = val;
    } else if (key === '$type' || key === '$description') {
      continue;
    } else if (typeof val === 'object' && val !== null) {
      Object.assign(result, flattenTokens(val, [...prefix, key]));
    }
  }
  return result;
}

const tokens = flattenTokens(raw.tokens);

function compactComponentList(components) {
  return components.map(c => ({
    name: c.name,
    css_class: c.css_class,
    props: Object.keys(c.props || {}).map(p => ({
      [p]: (c.props[p]?.type || typeof c.props[p])
    }))
  }));
}

function compactWebmcpSchema(webmcp) {
  if (!webmcp || !webmcp.properties) return {};
  const props = {};
  for (const [key, val] of Object.entries(webmcp.properties)) {
    const entry = { type: val.type };
    if (val.enum) entry.enum = val.enum;
    if (val.description) entry.desc = val.description;
    props[key] = entry;
  }
  return props;
}

const dense = {
  tokens,
  components: compactComponentList(raw.components || []),
  webmcp: compactWebmcpSchema(raw.webmcp)
};

mkdirSync(dirname(OUT), { recursive: true });
const outJson = JSON.stringify(dense, null, 2);
writeFileSync(OUT, outJson, 'utf-8');

const denseBytes = Buffer.byteLength(outJson);
const reduction = ((1 - denseBytes / srcBytes) * 100).toFixed(1);

console.log(`Tokens exported:  ${Object.keys(tokens).length}`);
console.log(`Source size:      ${(srcBytes / 1024).toFixed(1)} KB`);
console.log(`Dense size:       ${(denseBytes / 1024).toFixed(1)} KB`);
console.log(`Reduction:        ${reduction}%`);
