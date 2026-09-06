/**
 * @file Component generation cache — local filesystem capacitor.
 *
 * Stores a hash of components.yml and skips regeneration if unchanged.
 * Can be extended to use KV via design-mcp Worker for remote caching.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

const ROOT = resolve(process.cwd(), '..', '..');
const CACHE_DIR = resolve(ROOT, 'packages', 'design-core', '.cache');
const HASH_FILE = resolve(CACHE_DIR, 'component-generation.hash');

try {
  mkdirSync(CACHE_DIR, { recursive: true });
} catch {}

export interface CacheResult {
  hit: boolean;
  hash: string;
}

export function computeSourceHash(sourcePath: string): string {
  const content = readFileSync(sourcePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function readCachedHash(): string | null {
  try {
    if (existsSync(HASH_FILE)) {
      return readFileSync(HASH_FILE, 'utf-8').trim();
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeCachedHash(hash: string): void {
  try {
    writeFileSync(HASH_FILE, hash, 'utf-8');
  } catch {
    // ignore cache write errors
  }
}

export function shouldRegenerate(sourcePath: string, force = false): CacheResult {
  if (force) {
    return { hit: false, hash: computeSourceHash(sourcePath) };
  }

  const currentHash = computeSourceHash(sourcePath);
  const cachedHash = readCachedHash();

  if (cachedHash === currentHash) {
    return { hit: true, hash: currentHash };
  }

  return { hit: false, hash: currentHash };
}

export function clearCache(): void {
  try {
    if (existsSync(HASH_FILE)) {
      writeFileSync(HASH_FILE, '', 'utf-8');
    }
  } catch {
    // ignore
  }
}
