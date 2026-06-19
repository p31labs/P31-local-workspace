import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

const MANIFEST_PATH = resolve(
  new URL('../../phos-file-manifest.json', import.meta.url).pathname
);

let _manifest = null;

export function loadManifest() {
  if (_manifest) return _manifest;
  if (!existsSync(MANIFEST_PATH)) {
    _manifest = { version: '1.0.0', entries: [] };
    return _manifest;
  }
  try {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    _manifest = JSON.parse(raw);
  } catch {
    _manifest = { version: '1.0.0', entries: [] };
  }
  return _manifest;
}

export function saveManifest(manifest) {
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  _manifest = manifest;
}

export function addEntry(entry) {
  const manifest = loadManifest();
  manifest.entries.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  // Keep last 1000 entries
  if (manifest.entries.length > 1000) {
    manifest.entries = manifest.entries.slice(0, 1000);
  }
  saveManifest(manifest);
  return manifest.entries[0];
}

export function getRecentEntries(count = 10) {
  const manifest = loadManifest();
  return manifest.entries.slice(0, count);
}

export function rollbackEntries(count = 1) {
  const manifest = loadManifest();
  const toRollback = manifest.entries
    .filter((e) => e.status === 'moved')
    .slice(0, count);

  const rollbacks = [];
  for (const entry of toRollback) {
    rollbacks.push({
      id: entry.id,
      oldPath: entry.newPath,
      newPath: entry.oldPath,
      originalId: entry.id,
    });
    entry.status = 'rolled_back';
  }
  saveManifest(manifest);
  return rollbacks;
}

export function getStats() {
  const manifest = loadManifest();
  const total = manifest.entries.length;
  const moved = manifest.entries.filter((e) => e.status === 'moved').length;
  const failed = manifest.entries.filter((e) => e.status === 'failed').length;
  const rolledBack = manifest.entries.filter(
    (e) => e.status === 'rolled_back'
  ).length;
  const unclassified = manifest.entries.filter(
    (e) => e.status === 'unclassified'
  ).length;
  return { total, moved, failed, rolledBack, unclassified };
}
