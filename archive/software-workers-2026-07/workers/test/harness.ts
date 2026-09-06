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

export const TEST_AUTH_SECRET = 'test-secret';

export interface Harness {
  mf: Miniflare;
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
  dispose: () => Promise<void>;
}

export async function createHarness(opts?: { auth?: boolean }): Promise<Harness> {
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

  const mfOpts: Record<string, unknown> = {
    modules: true,
    script: code,
    compatibilityDate: '2026-03-24',
    d1Databases: {
      LOVE_D1: 'love-ledger',
    },
    durableObjects: {
      LOVE_TRANSACTION: 'LoveTransactionDO',
    },
  };

  // When auth is enabled, configure the worker with a test secret and require
  // Bearer auth — mirroring how production would enable the hardening.
  // (Miniflare does not inject top-level `vars` for a script worker, so we use
  // `bindings`, which are applied to the worker's env.)
  if (opts?.auth) {
    mfOpts.bindings = {
      LOVE_AUTH_SECRET: TEST_AUTH_SECRET,
      LOVE_REQUIRE_AUTH: 'true',
    };
  }

  const mf = new Miniflare(mfOpts as any);

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

// HS256 token signing (Node side) — matches the worker's verifyJwt.
function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function makeToken(userId: string, expSeconds = 3600): Promise<string> {
  const header = b64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64urlEncode(
    new TextEncoder().encode(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + expSeconds }))
  );
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(TEST_AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
  return `${data}.${b64urlEncode(sig)}`;
}
