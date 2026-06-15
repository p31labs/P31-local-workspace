import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeScopePath,
  MAX_DEPTH,
  SUB_VERTICES,
  edgeKeySub,
} from '../scopes.js';

describe('scopes', () => {
  describe('normalizeScopePath', () => {
    it('returns empty string for null/undefined/empty', () => {
      assert.equal(normalizeScopePath(null), '');
      assert.equal(normalizeScopePath(undefined), '');
      assert.equal(normalizeScopePath(''), '');
    });

    it('returns empty string for root and family aliases', () => {
      assert.equal(normalizeScopePath('root'), '');
      assert.equal(normalizeScopePath('family'), '');
    });

    it('normalizes leading/trailing slashes', () => {
      assert.equal(normalizeScopePath('/will/a/b/'), 'will/a/b');
    });

    it('returns "personal" for personal scope', () => {
      assert.equal(normalizeScopePath('personal'), 'personal');
    });

    it('rejects personal with extra segments', () => {
      assert.equal(normalizeScopePath('personal/extra'), null);
    });

    it('accepts valid nested paths up to MAX_DEPTH', () => {
      const parts = ['will', ...SUB_VERTICES.slice(0, MAX_DEPTH - 1)];
      assert.equal(normalizeScopePath(parts.join('/')), parts.join('/'));
    });

    it('rejects paths exceeding MAX_DEPTH', () => {
      const parts = ['will', ...Array(MAX_DEPTH).fill('a')];
      assert.equal(normalizeScopePath(parts.join('/')), null);
    });

    it('filters out empty path segments', () => {
      assert.equal(normalizeScopePath('will//b'), 'will/b');
    });
  });

  describe('edgeKeySub', () => {
    it('produces sorted hyphenated key', () => {
      assert.equal(edgeKeySub('b', 'a'), 'a-b');
      assert.equal(edgeKeySub('a', 'b'), 'a-b');
    });
  });
});
