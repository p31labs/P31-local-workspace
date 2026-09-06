import { describe, it, expect } from 'vitest';

import { required, pattern, maxLength, minLength, isEnum, range, compose } from './validators';

describe('validators', () => {
  describe('required', () => {
    it('rejects undefined', () => {
      const errors = required()(undefined, 'test');
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe('required');
    });

    it('rejects null', () => {
      const errors = required()(null, 'test');
      expect(errors.length).toBe(1);
    });

    it('rejects empty string', () => {
      const errors = required()('', 'test');
      expect(errors.length).toBe(1);
    });

    it('passes for non-empty string', () => {
      const errors = required()('hello', 'test');
      expect(errors.length).toBe(0);
    });
  });

  describe('pattern', () => {
    it('matches valid input', () => {
      const errors = pattern(/^\d{4}-\d{2}-\d{2}$/)('2026-01-01', 'dob');
      expect(errors.length).toBe(0);
    });

    it('rejects invalid input', () => {
      const errors = pattern(/^\d{4}-\d{2}-\d{2}$/)('not-a-date', 'dob');
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe('pattern');
    });
  });

  describe('range', () => {
    it('passes within range', () => {
      const errors = range(0, 10)(5, 'sensitivity');
      expect(errors.length).toBe(0);
    });

    it('rejects out of range', () => {
      const errors = range(0, 10)(15, 'sensitivity');
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe('range');
    });

    it('passes at boundaries', () => {
      expect(range(0, 10)(0, 'test').length).toBe(0);
      expect(range(0, 10)(10, 'test').length).toBe(0);
    });
  });

  describe('isEnum', () => {
    const OPTIONS = ['a', 'b', 'c'] as const;

    it('passes for valid enum value', () => {
      const errors = isEnum(OPTIONS)('a', 'test');
      expect(errors.length).toBe(0);
    });

    it('rejects invalid enum value', () => {
      const errors = isEnum(OPTIONS)('z' as 'a', 'test');
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe('enum');
    });

    it('passes for undefined', () => {
      const errors = isEnum(OPTIONS)(undefined as unknown as 'a', 'test');
      expect(errors.length).toBe(0);
    });
  });

  describe('compose', () => {
    it('runs all validators', () => {
      const v = compose(required(), maxLength(5));
      const errors = v('hello world', 'test');
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe('max_length');
    });

    it('reports all error', () => {
      const errors = compose(required(), minLength(10))('ab', 'test');
      expect(errors.length).toBe(1);
    });
  });
});
