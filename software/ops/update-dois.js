#!/usr/bin/env node
/**
 * P31 — Batch DOI replacer (Day-2 ops)
 * =====================================
 * Paste real Zenodo DOIs into `DOI_MAP` and run from `software/`:
 *   node ops/update-dois.js
 *   node ops/update-dois.js --dry-run
 *
 * Updates:
 *   1) frontend/src/AndromedaCommandCenter.jsx  — OMNIBUS_PAPERS.doi
 *   2) p31-forge/content/omnibus/paper{01-25}.json — doi + deep string placeholder
 *   3) README.md, admin/ZENODO_PAPER_III_METADATA.md (table rows; loose xxxxx)
 */

const fs = require('fs');
const path = require('path');

// ─── Source of truth: paper id (1–25) → full DOI string ───────────────────
const DOI_MAP = {
  // 3: '10.5281/zenodo.1234567',
  // 8: '10.5281/zenodo.8888888',
  // 12: '10.5281/zenodo.9999999',
};

const PLACEHOLDER = '10.5281/zenodo.xxxxx';

const ROOT = path.resolve(__dirname, '..');
const PATHS = {
  andromeda: path.join(ROOT, 'frontend', 'src', 'AndromedaCommandCenter.jsx'),
  omnibus: path.join(ROOT, 'p31-forge', 'content', 'omnibus'),
  readme: path.join(ROOT, 'README.md'),
  zenodo: path.join(ROOT, '..', 'admin', 'ZENODO_PAPER_III_METADATA.md')
};

function nonEmptyMap(map) {
  return Object.fromEntries(
    Object.entries(map).filter(([, v]) => v != null && String(v).trim() !== '')
  );
}

// ─── 1) JSX: { id: N, title: '...', doi: '...' } ──────────────────────────
function updateOmnibusJsx(content, map) {
  const ids = Object.keys(map)
    .map((k) => Number(k, 10))
    .filter((n) => n >= 1 && n <= 25)
    .sort((a, b) => b - a);

  let out = content;
  for (const id of ids) {
    const doi = map[id] || map[String(id)];
    if (!doi) continue;
    const re = new RegExp(
      `(\\{ id: ${id}, title: '[^']*', doi: ')([^']*)(')`,
      'g'
    );
    const before = out;
    out = out.replace(re, `$1${doi}$3`);
    if (before === out) {
      console.warn(
        `[update-dois] JSX: no { id: ${id}, ... doi: ... } match in AndromedaCommandCenter.jsx`
      );
    }
  }
  return out;
}

// ─── 2) JSON: paperNN — doi field + any nested string with PLACEHOLDER ────
function deepReplacePlaceholder(obj, newDoi) {
  if (obj === null || obj === undefined) return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const v = obj[i];
      if (typeof v === 'string' && v.includes(PLACEHOLDER)) {
        obj[i] = v.split(PLACEHOLDER).join(newDoi);
      } else {
        deepReplacePlaceholder(v, newDoi);
      }
    }
    return;
  }
  if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string' && v.includes(PLACEHOLDER)) {
        obj[k] = v.split(PLACEHOLDER).join(newDoi);
      } else {
        deepReplacePlaceholder(v, newDoi);
      }
    }
  }
}

function updatePaperJson(paperId, newDoi, dry) {
  const name = `paper${String(paperId).padStart(2, '0')}.json`;
  const fp = path.join(PATHS.omnibus, name);
  if (!fs.existsSync(fp)) {
    console.warn(`[update-dois] missing ${fp}`);
    return false;
  }
  const raw = fs.readFileSync(fp, 'utf8');
  const obj = JSON.parse(raw);
  obj.doi = newDoi;
  deepReplacePlaceholder(obj, newDoi);
  const newRaw = JSON.stringify(obj, null, 2) + '\n';
  if (newRaw === raw) {
    return false;
  }
  if (!dry) {
    fs.writeFileSync(fp, newRaw, 'utf8');
  }
  return true;
}

// ─── 3) Markdown ───────────────────────────────────────────────────────
function updateMarkdownTableRows(content, map) {
  const ids = Object.keys(map)
    .map((k) => Number(k, 10))
    .filter((n) => n >= 1 && n <= 25);
  return content
    .split('\n')
    .map((line) => {
      for (const id of ids) {
        const doi = map[id] || map[String(id)];
        if (!doi) continue;
        const lead = new RegExp(`^\\|\\s*${id}\\s*\\|`);
        if (lead.test(line) && /10\.5281\/zenodo\.(xxxxx|\d+)/.test(line)) {
          return line.replace(/10\.5281\/zenodo\.(xxxxx|\d+)/, doi);
        }
      }
      return line;
    })
    .join('\n');
}

function replaceLooseMetadataPlaceholders(content, map) {
  if (!content.includes(PLACEHOLDER)) return content;
  const keys = Object.keys(map).filter((k) => map[k] && String(map[k]).trim());
  if (keys.length === 0) {
    return content;
  }
  const d3 = map[3] != null && map[3] !== '' ? map[3] : map['3'];
  if (d3 != null && String(d3).trim() !== '') {
    return content.split(PLACEHOLDER).join(String(d3).trim());
  }
  if (keys.length === 1) {
    const k0 = keys[0];
    const only = map[k0] || map[String(k0)];
    return content.split(PLACEHOLDER).join(only);
  }
  console.warn(
    '[update-dois] markdown: add key 3 to DOI_MAP (Paper III) or fix multi-placeholder files manually'
  );
  return content;
}

function processMarkdown(relLabel, filePath, map, dry) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[update-dois] skip (not found): ${relLabel}`);
    return;
  }
  let c = fs.readFileSync(filePath, 'utf8');
  const before = c;
  c = updateMarkdownTableRows(c, map);
  c = replaceLooseMetadataPlaceholders(c, map);
  if (c === before) {
    console.log(`[update-dois] ${relLabel} (no changes)`);
    return;
  }
  if (!dry) {
    fs.writeFileSync(filePath, c, 'utf8');
  }
  console.log(`[update-dois] ${relLabel} ${dry ? '(dry-run would write)' : 'written'}`);
}

// ─── main ────────────────────────────────────────────────────────────────
function main() {
  const dry = process.argv.includes('--dry-run');
  const map = nonEmptyMap(DOI_MAP);
  const keys = Object.keys(map);
  if (keys.length === 0) {
    console.log(
      '[update-dois] DOI_MAP is empty — add id → DOI entries, then re-run. Example:\n' +
        "  3: '10.5281/zenodo.1234567',\n" +
        "  12: '10.5281/zenodo.9999999',\n"
    );
  }

  const ids = Object.keys(map)
    .map((k) => Number(k, 10))
    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 25)
    .sort((a, b) => a - b);

  if (fs.existsSync(PATHS.andromeda) && keys.length) {
    let j = fs.readFileSync(PATHS.andromeda, 'utf8');
    const j0 = j;
    j = updateOmnibusJsx(j, map);
    if (j !== j0) {
      if (!dry) fs.writeFileSync(PATHS.andromeda, j, 'utf8');
      console.log(
        `[update-dois] AndromedaCommandCenter.jsx ${dry ? '(dry-run would write)' : 'updated'}`
      );
    } else {
      console.log('[update-dois] AndromedaCommandCenter.jsx (no changes)');
    }
  } else if (!fs.existsSync(PATHS.andromeda) && keys.length) {
    console.warn(`[update-dois] missing: ${PATHS.andromeda}`);
  }

  for (const id of ids) {
    const doi = map[id] || map[String(id)];
    if (!doi) continue;
    if (updatePaperJson(id, doi, dry)) {
      const name = `paper${String(id).padStart(2, '0')}.json`;
      console.log(
        `[update-dois] p31-forge/.../omnibus/${name} ${dry ? '(dry-run would write)' : 'updated'}`
      );
    }
  }

  processMarkdown('README.md', PATHS.readme, map, dry);
  processMarkdown('admin/ZENODO_PAPER_III_METADATA.md', PATHS.zenodo, map, dry);

  if (keys.length) {
    console.log('[update-dois] done.');
  }
  process.exit(0);
}

main();
