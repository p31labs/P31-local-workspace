import { describe, it, expect } from 'vitest';
import { generateStaticHtml } from './componentGenerator.html.js';
import { join } from 'path';
import os from 'os';

const MONOREPO_ROOT = join(__dirname, '..', '..', '..', '..');
const COMPONENTS_YAML = join(MONOREPO_ROOT, 'cli', 'tokens', 'components.yml');
const TOKENS_YAML = join(MONOREPO_ROOT, 'cli', 'tokens', 'tokens.yml');

describe('componentGenerator.html', () => {
  it('generates HTML files for all components by default', () => {
    const tmpDir = join(os.tmpdir(), `p31-html-test-${Date.now()}`);
    const result = generateStaticHtml({ componentsPath: COMPONENTS_YAML, tokensPath: TOKENS_YAML, outputDir: tmpDir });
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const item of result) {
      // generateHtml is the dry-run API: returns in-memory output, does not write to disk.
      expect(item.code).toContain('<!DOCTYPE html>');
      expect(item.path).toMatch(/\.html$/);
    }
  });

  it('generates HTML for a single component when specified', () => {
    const tmpDir = join(os.tmpdir(), `p31-html-test-${Date.now()}`);
    const result = generateStaticHtml({ component: 'Button', componentsPath: COMPONENTS_YAML, tokensPath: TOKENS_YAML, outputDir: tmpDir });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Button');
    expect(result[0].path).toMatch(/Button\.html$/);
    const content = result[0].code;
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Button');
    expect(content).toContain('copy-btn');
  });
});
