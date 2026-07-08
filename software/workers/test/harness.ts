// Shared Miniflare harness for love-ledger worker integration tests.
// Bundles the real worker (no mocks) and runs it against an in-memory
// local D1 + Durable Object, so tests exercise actual handler logic.

import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = resolve(__dirname, '..', 'love-ledger.ts');
const SCHEMA_PATH = resolve(__dirname, 'migrations', '0001_init.sql');

export interface Harness {
  mf: Miniflare;
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
  dispose: () => Promise<void>;
}

export async function createHarness(): Promise<Harness> {
  const result = await build({
    entryPoints: [WORKER_PATH],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    conditions: ['worker', 'import'],
    write: false,
  });
  const code = result.outputFiles[0].text;

  const mf = new Miniflare({
    modules: true,
    script: code,
    compatibilityDate: '2026-03-24',
    d1Databases: {
      LOVE_D1: 'love-ledger',
    },
    durableObjects: {
      LOVE_TRANSACTION: 'LoveTransactionDO',
    },
  });

  // Ensure schema is present (idempotent CREATE TABLE IF NOT EXISTS).
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  const db = await mf.getD1Database('LOVE_D1');
  for (const stmt of schema.split(';')) {
    const trimmed = stmt.trim();
    if (trimmed) await db.prepare(trimmed).run();
  }

  const fetch = (path: string, init?: RequestInit) =>
    mf.dispatchFetch(`http://localhost${path}`, init);

  return {
    mf,
    fetch,
    dispose: () => mf.dispose(),
  };
}
