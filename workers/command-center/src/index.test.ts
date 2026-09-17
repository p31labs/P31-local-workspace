import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

const workerRoot = import.meta.url
  .replace(/\/src\/index\.test\.ts$/, '')
  .replace(/^file:\/\//, '');

describe('worker scaffold smoke tests', () => {
  it('has a src/index.ts or src/index.js entrypoint', () => {
    expect(
      existsSync(`${workerRoot}/src/index.ts`) ||
      existsSync(`${workerRoot}/src/index.js`)
    ).toBe(true);
  });

  it('has a wrangler.toml with a name field', () => {
    const toml = readFileSync(`${workerRoot}/wrangler.toml`, 'utf8');
    expect(toml).toMatch(/^name\s*=/m);
  });
});
