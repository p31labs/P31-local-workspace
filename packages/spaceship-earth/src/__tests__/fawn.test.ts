import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyze, safeAnalyze, getWarning, FAWN_PATTERNS, FawnGuard, type FawnAnalysis } from '../lib/engine/fawn';

describe('FawnGuard', () => {
  describe('analyze', () => {
    it('detects apology patterns', () => {
      const result = analyze("I'm so sorry");
      expect(result.triggered).toBe(true);
      expect(result.matches).toContain('over_apology');
    });

    it('returns empty for empty string', () => {
      const result = analyze('');
      expect(result.triggered).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('returns empty for null/undefined', () => {
      expect(analyze(null as any).triggered).toBe(false);
      expect(analyze(undefined as any).triggered).toBe(false);
    });

    it('detects multiple patterns', () => {
      const result = analyze("I'm so sorry and I'm probably wrong");
      expect(result.triggered).toBe(true);
      expect(result.matches.length).toBeGreaterThan(1);
    });

    it('detects permission seeking', () => {
      const result = analyze("is it okay if I ask?");
      expect(result.triggered).toBe(true);
    });

    it('detects self-diminishing', () => {
      const result = analyze("I just thought maybe I was wrong");
      expect(result.triggered).toBe(true);
    });
  });

  describe('safeAnalyze', () => {
    it('handles non-string input', () => {
      expect(safeAnalyze(123).triggered).toBe(false);
      expect(safeAnalyze({ foo: 'bar' }).triggered).toBe(false);
      expect(safeAnalyze([]).triggered).toBe(false);
    });

    it('respects max length', () => {
      const longText = 'a'.repeat(15000);
      const result = safeAnalyze(longText);
      expect(result.triggered).toBe(false);
    });
  });

  describe('getWarning', () => {
    it('returns null for safe text', () => {
      const result = getWarning("Just checking in");
      expect(result).toBe('');
    });

    it('returns warning with XSS escaped', () => {
      const result = getWarning('<script>alert("xss")</script> sorry');
      expect(result).toContain('&lt;');
    });
  });

  describe('FawnGuard.isSafe', () => {
    it('returns true for safe text', () => {
      expect(FawnGuard.isSafe("Hello")).toBe(true);
    });

    it('returns false for fawning text', () => {
      expect(FawnGuard.isSafe("I'm sorry")).toBe(false);
    });
  });
});